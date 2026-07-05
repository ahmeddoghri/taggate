/**
 * Confidence-gated tagging: auto-apply the agent's tag when it clears a
 * threshold, otherwise route to a human review queue. This is the same shape
 * as production human-in-the-loop tagging -- most items never need a human,
 * but the ambiguous ones get one instead of silently getting the wrong label.
 */
import type { Product } from "./taxonomy.js";
import type { TagPrediction, Tagger } from "./tagger.js";

export type Decision =
  | { kind: "auto"; product: Product; prediction: TagPrediction }
  | { kind: "escalated"; product: Product; prediction: TagPrediction };

export interface HumanReviewer {
  /** In production this is a person; here it's a simulated oracle that always
   * returns the ground-truth label so we can measure escalation quality. */
  review(product: Product): string;
}

export class OracleReviewer implements HumanReviewer {
  review(product: Product): string {
    return product.trueCategory;
  }
}

export interface PipelineResult {
  decision: Decision;
  finalCategory: string;
}

export class TaggingPipeline {
  constructor(
    private tagger: Tagger,
    private reviewer: HumanReviewer,
    private confidenceThreshold = 0.5,
  ) {}

  process(product: Product): PipelineResult {
    const prediction = this.tagger.tag(product);
    if (prediction.confidence >= this.confidenceThreshold) {
      return {
        decision: { kind: "auto", product, prediction },
        finalCategory: prediction.category,
      };
    }
    const decision: Decision = { kind: "escalated", product, prediction };
    return { decision, finalCategory: this.reviewer.review(product) };
  }

  processAll(products: Product[]): PipelineResult[] {
    return products.map((p) => this.process(p));
  }
}
