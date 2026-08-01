/**
 * A keyword tagger sized and stemmed for real product text.
 *
 * Two changes from `KeywordTagger`:
 *
 * 1. **Stemming.** The original does exact token matching: "charger" matches
 *    the literal string "charger" and nothing else, so "Charging Cable" and
 *    "Rechargeable Batteries" score zero on electronics despite being
 *    unambiguously electronics. Both sides of the comparison (keywords and
 *    product tokens) are reduced to a common stem first.
 *
 * 2. **Honest "no signal" reporting.** When every category scores zero, the
 *    original still names a "top" category, whichever happens to sort first,
 *    which looks like a prediction with an opinion behind it even though
 *    there is none. Confidence is zero either way and the item still
 *    escalates, but `category` is reported as `null` rather than a category
 *    picked by array order, because a reviewer reading "predicted:
 *    electronics" will reasonably assume the tagger saw something.
 */
import { CATEGORIES, type Category, type Product } from "./taxonomy.js";
import { CATEGORY_KEYWORDS_V2, stem } from "./taxonomy_v2.js";
import type { TagPrediction, Tagger } from "./tagger.js";

function tokenize(text: string): Set<string> {
  const words = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return new Set(words.map(stem));
}

// Stem the keyword lists once, not per call.
const STEMMED_KEYWORDS: Record<Category, string[]> = Object.fromEntries(
  CATEGORIES.map((cat) => [cat, CATEGORY_KEYWORDS_V2[cat].map(stem)]),
) as Record<Category, string[]>;

export interface TagPredictionV2 extends Omit<TagPrediction, "category"> {
  category: Category | null;
  hasSignal: boolean;
}

export class KeywordTaggerV2 implements Tagger {
  /** Satisfies the existing `Tagger` interface: never returns a null
   * category, matching the original contract for anything that consumes it
   * without knowing about v2's honesty upgrade. */
  tag(product: Product): TagPrediction {
    const result = this.tagWithSignal(product);
    return {
      category: result.category ?? CATEGORIES[0],
      confidence: result.confidence,
      runnerUp: result.runnerUp,
      scores: result.scores,
    };
  }

  tagWithSignal(product: Product): TagPredictionV2 {
    const tokens = tokenize(`${product.title} ${product.description}`);
    const scores = {} as Record<Category, number>;
    for (const cat of CATEGORIES) {
      const keywords = STEMMED_KEYWORDS[cat];
      const hits = keywords.filter((k) => tokens.has(k)).length;
      // Raw hit count, not hits/list-length -- see the note on `confidence`
      // below for why dividing by list length actively punishes coverage.
      scores[cat] = hits;
    }

    const ranked = [...CATEGORIES].sort((a, b) => scores[b] - scores[a]);
    const [best, second] = ranked;
    const top = scores[best];
    const runnerUpScore = scores[second];
    const hasSignal = top > 0;

    // Confidence from raw hit count, not hits/list-length. Dividing by list
    // length was the first version of this fix, and it made a longer, more
    // useful keyword list score *lower* confidence for the same evidence:
    // 4 hits out of 8 words is 0.5, 4 hits out of 45 is 0.09. A bigger
    // taxonomy should not be self-punishing. Two independent keyword hits
    // with no runner-up is already strong signal for short product text, so
    // the saturation point is a small hit count rather than a fraction of
    // the list.
    const margin = top > 0 ? (top - runnerUpScore) / top : 0;
    const confidence = Math.max(0, Math.min(1, margin * Math.min(1, top / 2)));

    return {
      category: hasSignal ? best : null,
      confidence: Math.round(confidence * 1000) / 1000,
      runnerUp: second,
      scores,
      hasSignal,
    };
  }
}
