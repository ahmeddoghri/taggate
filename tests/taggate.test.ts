import { describe, it, expect } from "vitest";
import { KeywordTagger } from "../src/tagger.js";
import { TaggingPipeline, OracleReviewer } from "../src/pipeline.js";
import { CATALOG } from "../src/taxonomy.js";
import { runEval } from "../src/eval.js";

describe("KeywordTagger", () => {
  it("confidently tags an unambiguous product correctly", () => {
    const tagger = new KeywordTagger();
    const knife = CATALOG.find((p) => p.id === "p1")!;
    const pred = tagger.tag(knife);
    expect(pred.category).toBe("kitchen");
    expect(pred.confidence).toBeGreaterThan(0.5);
  });

  it("produces low confidence on a genuinely ambiguous product", () => {
    const tagger = new KeywordTagger();
    const band = CATALOG.find((p) => p.id === "p9")!; // smart watch band: apparel vs electronics
    const pred = tagger.tag(band);
    expect(pred.confidence).toBeLessThan(0.5);
  });
});

describe("TaggingPipeline", () => {
  it("auto-applies high-confidence tags without escalating", () => {
    const pipeline = new TaggingPipeline(new KeywordTagger(), new OracleReviewer(), 0.5);
    const knife = CATALOG.find((p) => p.id === "p1")!;
    const result = pipeline.process(knife);
    expect(result.decision.kind).toBe("auto");
    expect(result.finalCategory).toBe("kitchen");
  });

  it("escalates a low-confidence product to the human reviewer", () => {
    const pipeline = new TaggingPipeline(new KeywordTagger(), new OracleReviewer(), 0.5);
    const band = CATALOG.find((p) => p.id === "p9")!;
    const result = pipeline.process(band);
    expect(result.decision.kind).toBe("escalated");
    expect(result.finalCategory).toBe(band.trueCategory); // human got it right
  });

  it("escalated items are always correct via the human reviewer", () => {
    const pipeline = new TaggingPipeline(new KeywordTagger(), new OracleReviewer(), 0.5);
    for (const product of CATALOG) {
      const result = pipeline.process(product);
      if (result.decision.kind === "escalated") {
        expect(result.finalCategory).toBe(product.trueCategory);
      }
    }
  });
});

describe("benchmark: confidence-gating vs always-auto", () => {
  it("confidence-gated policy achieves materially higher accuracy", () => {
    const { auto, gated } = runEval();
    expect(gated.accuracy).toBeGreaterThan(auto.accuracy);
    expect(gated.accuracy).toBeGreaterThanOrEqual(0.9);
  });

  it("confidence-gated policy escalates only a minority of items", () => {
    const { gated } = runEval();
    expect(gated.escalationRate).toBeGreaterThan(0);
    expect(gated.escalationRate).toBeLessThan(0.5);
  });

  it("always-auto has zero escalation by construction", () => {
    const { auto } = runEval();
    expect(auto.escalationRate).toBe(0);
  });
});
