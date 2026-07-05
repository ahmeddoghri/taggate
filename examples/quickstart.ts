/** Tag a catalog, watch confidence gating decide auto vs. escalate.
 * Run: npx tsx examples/quickstart.ts
 */
import { KeywordTagger, TaggingPipeline, OracleReviewer, CATALOG, runEval } from "../src/index.js";

const pipeline = new TaggingPipeline(new KeywordTagger(), new OracleReviewer(), 0.5);

for (const product of CATALOG) {
  const result = pipeline.process(product);
  const tag = result.decision.kind === "auto" ? "AUTO" : "ASK HUMAN";
  console.log(
    `[${tag.padEnd(9)}] ${product.title.padEnd(42)} -> ${result.finalCategory} ` +
      `(confidence=${result.decision.prediction.confidence})`,
  );
}

console.log("\n--- benchmark: confidence-gating vs always-auto ---");
const { auto, gated } = runEval();
console.log(`always_auto       accuracy=${(auto.accuracy * 100).toFixed(0)}%  escalation=${(auto.escalationRate * 100).toFixed(0)}%`);
console.log(`confidence_gated  accuracy=${(gated.accuracy * 100).toFixed(0)}%  escalation=${(gated.escalationRate * 100).toFixed(0)}%`);
