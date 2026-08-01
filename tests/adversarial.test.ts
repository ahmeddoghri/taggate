import { describe, expect, it } from "vitest";
import { ADVERSARIAL_CATALOG, HOLDOUT_CATALOG } from "../src/adversarial.js";
import {
  V2_THRESHOLD,
  buildCoverageReport,
  scoreCoverage,
} from "../src/eval_v2.js";
import { OracleReviewer, TaggingPipeline } from "../src/pipeline.js";
import { CATALOG } from "../src/taxonomy.js";
import { KeywordTagger } from "../src/tagger.js";
import { KeywordTaggerV2 } from "../src/tagger_v2.js";
import { stem } from "../src/taxonomy_v2.js";

// --- the finding: the original taxonomy does not generalize ----------------

describe("original KeywordTagger on realistic product text", () => {
  it("escalates almost everything it was not built around", () => {
    const result = scoreCoverage(new KeywordTagger(), ADVERSARIAL_CATALOG, 0.5);
    // 8 of 24 keyword lists were reverse-engineered from the 12-item demo
    // catalog; on ordinary listings it should barely tag anything on its own.
    expect(result.autoRate).toBeLessThan(0.2);
  });

  it("does not, at least, tag those escalations wrong", () => {
    const result = scoreCoverage(new KeywordTagger(), ADVERSARIAL_CATALOG, 0.5);
    expect(result.autoWrong).toBe(0);
  });
});

// --- exact-match brittleness ------------------------------------------------

describe("stem", () => {
  it("reduces charging, charger, and charged to the same stem", () => {
    expect(stem("charging")).toBe(stem("charger"));
    expect(stem("charger")).toBe(stem("charge"));
  });

  it("reduces running to the same stem as run-ish forms", () => {
    expect(stem("running")).toBe(stem("runner"));
  });

  it("leaves short words alone rather than over-stripping", () => {
    expect(stem("bus")).toBe("bus");
    expect(stem("pen")).toBe("pen");
  });
});

describe("original tagger's exact-match blind spot", () => {
  it("scores zero on a product that only uses an inflected keyword form", () => {
    const tagger = new KeywordTagger();
    const pred = tagger.tag({
      id: "x",
      title: "Rechargeable AA Batteries 4-Pack",
      description: "NiMH rechargeable batteries with a compact charging dock included.",
      trueCategory: "electronics",
    });
    // "charger" never appears; only "rechargeable" and "charging" do.
    expect(pred.scores.electronics).toBe(0);
  });
});

// --- the fix: raw hit counts, not hits/list-length --------------------------

describe("KeywordTaggerV2 scoring", () => {
  it("does not get diluted by a longer keyword list", () => {
    // A regression test for the bug found while building this: dividing by
    // list length made a *bigger*, more useful taxonomy score *lower*
    // confidence for the same evidence.
    const tagger = new KeywordTaggerV2();
    const knife = CATALOG.find((p) => p.id === "p1")!;
    const pred = tagger.tag(knife);
    expect(pred.confidence).toBeGreaterThan(0.9);
  });

  it("matches an inflected keyword form the original tagger misses", () => {
    const tagger = new KeywordTaggerV2();
    const pred = tagger.tagWithSignal({
      id: "x",
      title: "Rechargeable AA Batteries 4-Pack",
      description: "NiMH rechargeable batteries with a compact charging dock included.",
      trueCategory: "electronics",
    });
    expect(pred.category).toBe("electronics");
    expect(pred.hasSignal).toBe(true);
  });

  it("reports no signal, not an arbitrary category, when nothing matches", () => {
    const tagger = new KeywordTaggerV2();
    const pred = tagger.tagWithSignal({
      id: "x",
      title: "Zzyzx Quantum Widget",
      description: "A completely nonsense product description with no category words.",
      trueCategory: "electronics",
    });
    expect(pred.hasSignal).toBe(false);
    expect(pred.category).toBeNull();
    expect(pred.confidence).toBe(0);
  });

  it("still returns a Tagger-compatible category for interface compatibility", () => {
    const tagger = new KeywordTaggerV2();
    const pred = tagger.tag({
      id: "x",
      title: "Zzyzx Quantum Widget",
      description: "Nonsense text.",
      trueCategory: "electronics",
    });
    expect(pred.category).not.toBeNull();
    expect(pred.confidence).toBe(0); // still escalates downstream
  });
});

// --- the coverage gap, measured ---------------------------------------------

describe("v2 coverage vs v1 on realistic text", () => {
  it("auto-tags most of the adversarial catalog correctly", () => {
    const result = scoreCoverage(new KeywordTaggerV2(), ADVERSARIAL_CATALOG, V2_THRESHOLD);
    expect(result.autoRate).toBeGreaterThan(0.7);
    expect(result.autoWrong).toBe(0);
  });

  it("beats v1's auto rate on the adversarial catalog by a wide margin", () => {
    const v1 = scoreCoverage(new KeywordTagger(), ADVERSARIAL_CATALOG, 0.5);
    const v2 = scoreCoverage(new KeywordTaggerV2(), ADVERSARIAL_CATALOG, V2_THRESHOLD);
    expect(v2.autoRate).toBeGreaterThan(v1.autoRate + 0.5);
  });

  it("does not regress the original catalog", () => {
    const v1 = scoreCoverage(new KeywordTagger(), CATALOG, 0.5);
    const v2 = scoreCoverage(new KeywordTaggerV2(), CATALOG, V2_THRESHOLD);
    expect(v2.autoWrong).toBe(0);
    expect(v2.autoRate).toBeGreaterThanOrEqual(v1.autoRate);
  });

  it("never auto-tags an item wrong on the original catalog", () => {
    // Regression test for the specific bug: broadening keywords initially
    // pushed one of the four deliberately ambiguous items (p12, "Kitchen
    // Storage Folder Organizer") over the confidence line into a wrong
    // auto-tag. Fixed by freezing the threshold at 0.55 against this
    // catalog plus the adversarial one, before the holdout was ever run.
    const result = scoreCoverage(new KeywordTaggerV2(), CATALOG, V2_THRESHOLD);
    expect(result.autoWrong).toBe(0);
  });
});

// --- held out, evaluated once ------------------------------------------------

describe("held-out catalog (frozen taxonomy, threshold, and stemmer)", () => {
  it("v1 still barely tags anything on its own", () => {
    const result = scoreCoverage(new KeywordTagger(), HOLDOUT_CATALOG, 0.5);
    expect(result.autoRate).toBeLessThan(0.2);
  });

  it("v2 auto-tags a majority of the holdout correctly, with zero wrong", () => {
    const result = scoreCoverage(new KeywordTaggerV2(), HOLDOUT_CATALOG, V2_THRESHOLD);
    expect(result.autoRate).toBeGreaterThan(0.4);
    expect(result.autoWrong).toBe(0);
  });

  it("v2 beats v1's auto rate on data neither was tuned against", () => {
    const v1 = scoreCoverage(new KeywordTagger(), HOLDOUT_CATALOG, 0.5);
    const v2 = scoreCoverage(new KeywordTaggerV2(), HOLDOUT_CATALOG, V2_THRESHOLD);
    expect(v2.autoRate).toBeGreaterThan(v1.autoRate);
  });
});

// --- the full report ---------------------------------------------------------

describe("buildCoverageReport", () => {
  it("is reproducible", () => {
    expect(buildCoverageReport()).toEqual(buildCoverageReport());
  });

  it("shows zero wrong auto-tags for v2 across every catalog", () => {
    const report = buildCoverageReport();
    expect(report.originalCatalog.v2.autoWrong).toBe(0);
    expect(report.adversarial.v2.autoWrong).toBe(0);
    expect(report.holdout.v2.autoWrong).toBe(0);
  });
});

// --- the pipeline still behaves correctly with v2 ---------------------------

describe("TaggingPipeline with KeywordTaggerV2", () => {
  it("auto-applies a high-confidence realistic product", () => {
    const pipeline = new TaggingPipeline(new KeywordTaggerV2(), new OracleReviewer(), V2_THRESHOLD);
    const earbuds = ADVERSARIAL_CATALOG.find((p) => p.id === "a1")!;
    const result = pipeline.process(earbuds);
    expect(result.decision.kind).toBe("auto");
    expect(result.finalCategory).toBe("electronics");
  });

  it("escalates items with no keyword signal to the human reviewer", () => {
    const pipeline = new TaggingPipeline(new KeywordTaggerV2(), new OracleReviewer(), V2_THRESHOLD);
    const result = pipeline.process({
      id: "x",
      title: "Zzyzx Quantum Widget",
      description: "Nonsense text with no category words.",
      trueCategory: "electronics",
    });
    expect(result.decision.kind).toBe("escalated");
    expect(result.finalCategory).toBe("electronics"); // human still gets it right
  });
});
