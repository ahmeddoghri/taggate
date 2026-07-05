/**
 * The tagging "agent". Offline default scores keyword overlap per category and
 * turns it into a calibrated confidence via the margin between the top two
 * candidates -- a genuinely ambiguous item (two categories nearly tied) should
 * produce low confidence, not a coin-flip label. Swap in a real LLM by
 * implementing the same `Tagger` interface.
 */
import { CATEGORIES, CATEGORY_KEYWORDS, type Category, type Product } from "./taxonomy.js";

export interface TagPrediction {
  category: Category;
  confidence: number; // 0..1
  runnerUp?: Category;
  scores: Record<Category, number>;
}

export interface Tagger {
  tag(product: Product): TagPrediction;
}

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

export class KeywordTagger implements Tagger {
  tag(product: Product): TagPrediction {
    const tokens = new Set(tokenize(`${product.title} ${product.description}`));
    const scores = {} as Record<Category, number>;
    for (const cat of CATEGORIES) {
      const kws = CATEGORY_KEYWORDS[cat];
      const hits = kws.filter((k) => tokens.has(k)).length;
      scores[cat] = hits / kws.length;
    }
    const ranked = [...CATEGORIES].sort((a, b) => scores[b] - scores[a]);
    const [best, second] = ranked;
    const top = scores[best];
    const runnerUpScore = scores[second];
    // confidence = separation between best and runner-up, scaled by absolute
    // signal strength -- a tiny top score with no separation is not confident
    // even if it's technically "the max"
    const margin = top > 0 ? (top - runnerUpScore) / top : 0;
    const confidence = Math.max(0, Math.min(1, margin * Math.min(1, top * 3)));
    return {
      category: best,
      confidence: Math.round(confidence * 1000) / 1000,
      runnerUp: second,
      scores,
    };
  }
}
