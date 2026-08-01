/**
 * Does the tagger work on a catalog it was not built around?
 *
 * The original benchmark's 75% -> 100% story is real and reproduces, and it
 * is measured on a 12-item catalog whose keyword lists were written from that
 * same catalog's text. This module runs both taggers against 24 ordinary
 * product listings that neither keyword list was tuned against, and reports
 * what actually happens: how much gets auto-tagged correctly, how much gets
 * auto-tagged *wrong* with false confidence, and how much just escalates
 * because the tagger never saw a relevant word.
 *
 *     npm run eval:v2
 */
import { ADVERSARIAL_CATALOG, HOLDOUT_CATALOG } from "./adversarial.js";
import { CATALOG } from "./taxonomy.js";
import { KeywordTagger } from "./tagger.js";
import { KeywordTaggerV2 } from "./tagger_v2.js";
import type { Product } from "./taxonomy.js";
import type { Tagger } from "./tagger.js";

export interface CoverageResult {
  n: number;
  autoCorrect: number;
  autoWrong: number;
  escalated: number;
  accuracyOfAuto: number; // of the items it auto-tagged, how many were right
  autoRate: number; // share of the catalog it was willing to tag on its own
}

export function scoreCoverage(tagger: Tagger, catalog: Product[], threshold = 0.5): CoverageResult {
  // NOTE: callers pass an explicit threshold per tagger below -- v1 keeps its
  // original 0.5, v2 uses 0.55, frozen against CATALOG + ADVERSARIAL_CATALOG
  // only, before HOLDOUT_CATALOG was evaluated even once. See taxonomy_v2.ts.
  let autoCorrect = 0;
  let autoWrong = 0;
  let escalated = 0;

  for (const product of catalog) {
    const prediction = tagger.tag(product);
    const auto = prediction.confidence >= threshold;
    if (!auto) {
      escalated++;
      continue;
    }
    if (prediction.category === product.trueCategory) {
      autoCorrect++;
    } else {
      autoWrong++;
    }
  }

  const autoTotal = autoCorrect + autoWrong;
  return {
    n: catalog.length,
    autoCorrect,
    autoWrong,
    escalated,
    accuracyOfAuto: autoTotal ? autoCorrect / autoTotal : 1,
    autoRate: autoTotal / catalog.length,
  };
}

export interface CoverageReport {
  originalCatalog: { v1: CoverageResult; v2: CoverageResult };
  adversarial: { v1: CoverageResult; v2: CoverageResult };
  holdout: { v1: CoverageResult; v2: CoverageResult };
}

const V1_THRESHOLD = 0.5;
export const V2_THRESHOLD = 0.55;

export function buildCoverageReport(): CoverageReport {
  const v1 = new KeywordTagger();
  const v2 = new KeywordTaggerV2();
  return {
    originalCatalog: {
      v1: scoreCoverage(v1, CATALOG, V1_THRESHOLD),
      v2: scoreCoverage(v2, CATALOG, V2_THRESHOLD),
    },
    adversarial: {
      v1: scoreCoverage(v1, ADVERSARIAL_CATALOG, V1_THRESHOLD),
      v2: scoreCoverage(v2, ADVERSARIAL_CATALOG, V2_THRESHOLD),
    },
    holdout: {
      v1: scoreCoverage(v1, HOLDOUT_CATALOG, V1_THRESHOLD),
      v2: scoreCoverage(v2, HOLDOUT_CATALOG, V2_THRESHOLD),
    },
  };
}

function row(label: string, r: CoverageResult): string {
  return (
    `${label.padEnd(22)}${(r.autoRate * 100).toFixed(0).padStart(7)}%` +
    `${r.autoCorrect.toString().padStart(9)}${r.autoWrong.toString().padStart(9)}` +
    `${r.escalated.toString().padStart(11)}`
  );
}

export function formatCoverageReport(report: CoverageReport): string {
  const lines: string[] = [];
  lines.push("Auto-tag coverage: does it tag on its own, or hand everything to a human?");
  lines.push("=".repeat(74));
  lines.push(
    `${"catalog / tagger".padEnd(22)}${"auto rate".padStart(8)}${"correct".padStart(9)}` +
      `${"wrong".padStart(9)}${"escalated".padStart(11)}`,
  );
  lines.push("-".repeat(74));

  lines.push(row("original / v1", report.originalCatalog.v1));
  lines.push(row("original / v2", report.originalCatalog.v2));
  lines.push("");
  lines.push(row("adversarial / v1", report.adversarial.v1));
  lines.push(row("adversarial / v2", report.adversarial.v2));
  lines.push("");
  lines.push(row("holdout / v1", report.holdout.v1));
  lines.push(row("holdout / v2", report.holdout.v2));
  lines.push("");
  lines.push(
    "auto rate = share of the catalog the tagger was willing to tag without a human.",
  );
  lines.push(
    "'wrong' is a confident, auto-applied mistake, the failure that actually costs",
  );
  lines.push("something; 'escalated' items always get a correct label from the reviewer.");
  return lines.join("\n");
}

function main() {
  const report = buildCoverageReport();
  console.log(formatCoverageReport(report));
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) main();
