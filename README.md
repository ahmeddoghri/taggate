# 🏷️ TagGate

**Confidence-gated multi-agent tagging with human-in-the-loop escalation.**

![CI](https://github.com/ahmeddoghri/taggate/actions/workflows/ci.yml/badge.svg)
![tests](https://img.shields.io/badge/tests-29%20passing-brightgreen)
![typescript](https://img.shields.io/badge/typescript-5.6-blue)
![deps](https://img.shields.io/badge/runtime%20deps-none-success)
![license](https://img.shields.io/badge/license-MIT-black)

> **Auto-tag the confident cases, escalate only the genuinely ambiguous
> ones.** In the benchmark, confidence-gating lifts accuracy from **75%
> to 100%** by routing the ambiguous minority to a human. Zero deps:
> `npm run eval`.
>
> Then I ran it against 24 ordinary product listings it had never seen,
> and it escalated **22 of 24**. Not because they were hard; the
> 8-word-per-category keyword lists were reverse-engineered from the
> demo catalog's own text. `npm run eval:v2` is the benchmark that found
> it, and a taxonomy built independently that gets 20 of 24 right with
> zero wrong auto-tags.

You've worked with the intern who's never once said "I'm not sure." Every
answer arrives with total conviction, whether it's right or dead wrong.
An auto-tagger that always guesses has the same personality disorder: it
is wrong exactly as often as it's overconfident, and it never tells you
which one it's being right now.

TagGate scores its own confidence as the **margin** between its top and
runner-up category, not just "did I find a match," and routes anything
below threshold to a human instead of silently mislabeling something
genuinely ambiguous. A "smart watch band" is legitimately both
electronics and apparel. No keyword scorer should be forcing a confident
guess there, and neither should you.

Runs with **zero runtime dependencies and zero API keys** (a
deterministic keyword-overlap tagger). Swap in a real LLM by implementing
the same `Tagger` interface. The confidence-gating and escalation logic
don't change.

---

## The result in one number

```bash
npm run eval
```
```
catalog size: 12 products (4 deliberately ambiguous)

policy              accuracy   escalation rate
always_auto              75%                0%
confidence_gated        100%               42%
```

Always-auto-tagging gets the genuinely ambiguous items wrong a quarter of
the time, with the same confident tone as everything else. Confidence
gating escalates only the hard 42% to a human reviewer and reaches 100%
accuracy. Same shape as a real ops tagging pipeline: most items never
need a person, but the ones that do, actually get one instead of a
guess wearing a confident voice.

## The 12-item catalog and the keyword list were written together

That 42% escalation rate looked suspicious once I thought about what a real
catalog looks like. So I ran the tagger against 24 ordinary product listings
(a 4K monitor, a wool coat, an espresso machine) it had never seen, none
deliberately ambiguous:

```bash
npm run eval:v2
```
```
catalog / tagger      auto rate  correct    wrong  escalated
original / v1              58%        7        0          5
adversarial / v1             8%        2        0         22
```

**8% auto rate. 22 of 24 escalate.** Not because those items are hard;
they are not. `electronics` in the original taxonomy is `["battery",
"charger", "bluetooth", "watch", "smart", "screen", "wireless", "usb"]`,
eight words, and none of them are "monitor", "laptop", "headphone", or
"speaker". Every clean item in the bundled 12-product catalog happens to
hit 3-4 of its category's 8 keywords, because the keyword lists were
written by reading the catalog. The benchmark measured whether the
tagger could find the words it had been handed.

### What "confidence gating" looks like when it can't find any words

A system that escalates 92% of a catalog is not "safely deferring to a
human", it is a human doing the job with extra steps. Two fixes:

**A real, independently-built keyword list.** `taxonomy_v2.ts` has ~4x
the vocabulary per category, written from general product-category
knowledge *before* looking at the adversarial catalog above, specifically
so the same mistake could not repeat itself against a second hand-picked
list.

**Stemming.** The original does exact-string matching, so "Rechargeable
Batteries" and "Charging Cable" score zero on electronics because neither
contains the literal substring "charger". A dozen common English suffixes,
stripped from both the keywords and the product text before comparing,
closes most of that gap without pulling in a dependency.

```
catalog / tagger      auto rate  correct    wrong  escalated
original / v2              58%        7        0          5
adversarial / v2            83%       20        0          4
```

**8% -> 83% auto rate, zero wrong.** The original catalog does not regress.

### The bug in the first version of the fix

A bigger keyword list made things *worse* at first: `score = hits /
list.length`, so a category with 45 words scores a hit at 1/45 instead of
1/8, and every confidence dropped through the floor. `original / v2`
briefly read 0% auto rate: a longer, more useful taxonomy was
self-punishing. Confidence is computed from the raw hit count now, not
the fraction of an arbitrarily-sized list.

### The other bug: broader recall also strengthens the wrong side of a tie

Fixing the dilution bug pushed `original / v2` to 75% auto rate, one point
higher than expected: one of the catalog's four deliberately-ambiguous
items ("Kitchen Storage Folder Organizer") crossed the confidence line
into a *wrong* auto-tag, because the expanded office list now matched
"organizer", "folder", "paper", and the literal word "office", pulling it
decisively away from kitchen. Broader coverage cuts both ways: it also
strengthens whichever side of a genuine tie happens to gain more keywords.

Fixed by raising the auto-tag threshold to 0.55, tuned against the
original catalog and the adversarial one only, before the holdout below
had been evaluated even once. `original / v2` above reflects that
threshold: 58% auto rate, matching v1 exactly, with zero wrong.

### Held out, run once

`taxonomy_v2.ts`, the stemmer, and the 0.55 threshold were all frozen
before `HOLDOUT_CATALOG` (15 more ordinary listings) was written. It was
evaluated a single time:

```
catalog / tagger      auto rate  correct    wrong  escalated
holdout / v1                 7%        1        0         14
holdout / v2                 67%        10        0          5
```

Zero wrong auto-tags, same as the other two catalogs.

### Limits

- **~4x more keywords is still not exhaustive.** This closes the gap between "built for a 12-item demo" and "works on ordinary text", not the gap to a real classifier.
- **Stemming is suffix-stripping, not a real stemmer.** It fixes the common cases (`-ing`, `-er`, `-ed`, `-s`) and nothing irregular.
- **The threshold (0.55) is tuned on synthetic catalogs, three of them now.** Treat it as a starting point, not a calibrated production value.

## Install

```bash
git clone https://github.com/ahmeddoghri/taggate
cd taggate && npm install
npm run example
```

Or with Docker:

```bash
docker build -t taggate .
docker run --rm taggate
```

## Tag a catalog

```typescript
import { KeywordTagger, TaggingPipeline, OracleReviewer } from "taggate";

const pipeline = new TaggingPipeline(new KeywordTagger(), new OracleReviewer(), 0.5);
const result = pipeline.process({
  id: "p9",
  title: "Smart Watch Band Wireless Fabric Strap",
  description: "Replacement fabric band for smart wireless watch, soft cotton blend.",
  trueCategory: "apparel",
});

console.log(result.decision.kind);     // "escalated": genuinely ambiguous
console.log(result.finalCategory);     // "apparel": from the human reviewer
```

## How it works

```
Tagger.tag(product)
  ├─ score keyword overlap per category
  └─ confidence = margin(top, runner-up) * signal-strength

TaggingPipeline.process(product)
  ├─ confidence >= threshold?  -> auto-apply the tag
  └─ else                      -> escalate to HumanReviewer
```

Confidence isn't just "how strong was the top match." A category that
wins 1-to-0 with no real competition should score differently than one
that wins 5-to-4. The margin-based score means a genuinely contested item
can't sneak past the gate just because it happened to have *a* keyword
hit somewhere.

## Bring your own tagger

```typescript
class MyLLMTagger implements Tagger {
  tag(product: Product): TagPrediction { /* call your model, return a score */ }
}

new TaggingPipeline(new MyLLMTagger(), myReviewQueue, 0.6);
```

`HumanReviewer` is equally pluggable. `OracleReviewer` is a test
stand-in; swap in a real review queue (Slack approval, a ticketing
system) for production.

## Tests

```bash
npm install && npm test      # 8 passing
```

## More in this series

Nine small, dependency-light, benchmarked tools for LLM/ML infrastructure. Each one reproduces its headline number locally with no API keys:

[agentmem](https://github.com/ahmeddoghri/agentmem) · [rubricagent](https://github.com/ahmeddoghri/rubricagent) · [clarifyrag](https://github.com/ahmeddoghri/clarifyrag) · [churnfm](https://github.com/ahmeddoghri/churnfm) · [citebench](https://github.com/ahmeddoghri/citebench) · [guardrail-gate](https://github.com/ahmeddoghri/guardrail-gate) · [tablextract](https://github.com/ahmeddoghri/tablextract) · [vllm-cost-router](https://github.com/ahmeddoghri/vllm-cost-router)

## License

MIT © Ahmed Doghri
