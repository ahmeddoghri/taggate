/**
 * Does confidence-gating actually beat always-auto-tagging?
 *
 * We compare two policies over the bundled catalog (which includes
 * deliberately ambiguous items -- a smart-watch *band* is genuinely both
 * electronics and apparel from keyword signal alone):
 *
 *   always_auto      -- apply the tagger's top guess no matter what
 *   confidence_gated  -- TagGate: escalate low-confidence items to a human
 *
 * Metric: accuracy, and the fraction of items that needed a human -- the
 * tradeoff a real ops team cares about (manual tagging load vs. correctness).
 */
import { CATALOG } from "./taxonomy.js";
import { KeywordTagger } from "./tagger.js";
import { OracleReviewer, TaggingPipeline, type PipelineResult } from "./pipeline.js";

export interface EvalResult {
  accuracy: number;
  escalationRate: number;
  n: number;
}

function evalAlwaysAuto(): EvalResult {
  const tagger = new KeywordTagger();
  let correct = 0;
  for (const p of CATALOG) {
    const pred = tagger.tag(p);
    if (pred.category === p.trueCategory) correct++;
  }
  return { accuracy: correct / CATALOG.length, escalationRate: 0, n: CATALOG.length };
}

function evalConfidenceGated(threshold: number): EvalResult {
  const pipeline = new TaggingPipeline(new KeywordTagger(), new OracleReviewer(), threshold);
  const results: PipelineResult[] = pipeline.processAll(CATALOG);
  let correct = 0;
  let escalated = 0;
  results.forEach((r, i) => {
    const truth = CATALOG[i].trueCategory;
    if (r.finalCategory === truth) correct++;
    if (r.decision.kind === "escalated") escalated++;
  });
  return {
    accuracy: correct / CATALOG.length,
    escalationRate: escalated / CATALOG.length,
    n: CATALOG.length,
  };
}

export function runEval() {
  const auto = evalAlwaysAuto();
  const gated = evalConfidenceGated(0.5);
  return { auto, gated };
}

function main() {
  const { auto, gated } = runEval();
  console.log(`catalog size: ${auto.n} products (4 deliberately ambiguous)\n`);
  console.log(`${"policy".padEnd(18)}${"accuracy".padStart(10)}${"escalation rate".padStart(18)}`);
  console.log(
    `${"always_auto".padEnd(18)}${(auto.accuracy * 100).toFixed(0).padStart(9)}%${(auto.escalationRate * 100).toFixed(0).padStart(17)}%`,
  );
  console.log(
    `${"confidence_gated".padEnd(18)}${(gated.accuracy * 100).toFixed(0).padStart(9)}%${(gated.escalationRate * 100).toFixed(0).padStart(17)}%`,
  );
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) main();
