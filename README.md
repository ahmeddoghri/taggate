# 🏷️ TagGate

**Confidence-gated multi-agent tagging with human-in-the-loop escalation.**

![CI](https://github.com/ahmeddoghri/taggate/actions/workflows/ci.yml/badge.svg)
![tests](https://img.shields.io/badge/tests-8%20passing-brightgreen)
![typescript](https://img.shields.io/badge/typescript-5.6-blue)
![deps](https://img.shields.io/badge/runtime%20deps-none-success)
![license](https://img.shields.io/badge/license-MIT-black)

> **Auto-tag the confident cases, escalate only the genuinely ambiguous
> ones.** In the benchmark, confidence-gating lifts accuracy from **75%
> to 100%** by routing the ambiguous minority to a human. Zero deps:
> `npm run eval`.

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
