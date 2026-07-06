# 🏷️ TagGate

**Confidence-gated multi-agent tagging with human-in-the-loop escalation.**

![CI](https://github.com/ahmeddoghri/taggate/actions/workflows/ci.yml/badge.svg)
![tests](https://img.shields.io/badge/tests-8%20passing-brightgreen)
![typescript](https://img.shields.io/badge/typescript-5.6-blue)
![deps](https://img.shields.io/badge/runtime%20deps-none-success)
![license](https://img.shields.io/badge/license-MIT-black)

An auto-tagging agent that always guesses is wrong exactly as often as it's
overconfident. TagGate instead scores its own confidence as the **margin**
between its top and runner-up category — not just "did I find a match" — and
routes anything below threshold to a human, instead of silently mislabeling
genuinely ambiguous items (a "smart watch band" is legitimately both
electronics and apparel; no keyword scorer should force a confident guess
there).

Runs with **zero runtime dependencies and zero API keys** (a deterministic
keyword-overlap tagger). Swap in a real LLM by implementing the same
`Tagger` interface — the confidence-gating and escalation logic don't change.

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

Always-auto-tagging gets the genuinely ambiguous items wrong a quarter of the
time. Confidence-gating escalates only the hard 42% to a human reviewer and
reaches 100% accuracy — the same shape as a real ops tagging pipeline: most
items never need a person, but the ones that do, get one.

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

console.log(result.decision.kind);     // "escalated" -- genuinely ambiguous
console.log(result.finalCategory);     // "apparel" -- from the human reviewer
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

Confidence isn't just "how strong was the top match" — a category that wins
1-to-0 with no real competition should score differently than one that wins
5-to-4. The margin-based score means a genuinely contested item can't sneak
past the gate just because it happened to have *a* keyword hit.

## Bring your own tagger

```typescript
class MyLLMTagger implements Tagger {
  tag(product: Product): TagPrediction { /* call your model, return a score */ }
}

new TaggingPipeline(new MyLLMTagger(), myReviewQueue, 0.6);
```

`HumanReviewer` is equally pluggable — `OracleReviewer` is a test stand-in;
swap in a real review queue (Slack approval, a ticketing system) for
production.

## Tests

```bash
npm install && npm test      # 8 passing
```

## License

MIT © Ahmed Doghri
