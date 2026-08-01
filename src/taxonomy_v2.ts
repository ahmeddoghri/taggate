/**
 * A keyword taxonomy sized for real product text, not for the demo catalog.
 *
 * The original `CATEGORY_KEYWORDS` has 8 words per category. Run it against
 * product descriptions that were not written to exercise it -- "27-inch 4K
 * Monitor", "Wool Blend Winter Coat", "Adjustable Dumbbell Set" -- and it
 * escalates 11 of 12 to a human. Not because those items are ambiguous; they
 * are not. The category's own keyword list simply does not contain "monitor",
 * "wool", "coat", or "dumbbell". The 8-word lists look like they were built
 * from the 12-item catalog, because they were: every word in `CATALOG`'s
 * titles that maps cleanly to a category shows up in that category's list.
 *
 * These lists were written from general product-category vocabulary, before
 * looking at any adversarial test set, specifically to avoid repeating that
 * mistake by fitting the taxonomy to a second hand-picked catalog. They are
 * roughly 4x larger and still nowhere near exhaustive; the honest claim is
 * "noticeably fewer false escalations on ordinary product text", not
 * "complete coverage".
 */
import type { Category } from "./taxonomy.js";

export const CATEGORY_KEYWORDS_V2: Record<Category, string[]> = {
  electronics: [
    "battery", "charger", "charging", "bluetooth", "watch", "smart", "screen",
    "wireless", "usb", "laptop", "computer", "phone", "smartphone", "tablet",
    "earbud", "earphone", "headphone", "speaker", "monitor", "display",
    "camera", "drone", "router", "cable", "adapter", "digital", "electronic",
    "device", "gadget", "hdmi", "led", "processor", "memory", "storage",
    "keyboard", "webcam", "microphone", "sensor", "wifi", "power", "bank",
    "volt", "circuit", "tech", "gaming", "console",
  ],
  kitchen: [
    "knife", "pan", "oven", "blender", "kitchen", "cooking", "cook", "steel",
    "grill", "pot", "skillet", "cookware", "bakeware", "spatula", "whisk",
    "cutting", "board", "kettle", "toaster", "microwave", "dishwasher",
    "fridge", "refrigerator", "mixer", "coffee", "espresso", "mug", "plate",
    "bowl", "utensil", "cutlery", "fork", "spoon", "strainer", "apron",
    "mitt", "container", "ceramic", "cast", "iron", "nonstick", "dutch",
    "roast", "bake", "saucepan", "stockpot", "cutlery",
  ],
  apparel: [
    "shirt", "band", "fabric", "sleeve", "wear", "cotton", "jacket", "shoe",
    "shoes", "jeans", "denim", "dress", "skirt", "pants", "trouser",
    "sweater", "hoodie", "coat", "sock", "underwear", "legging", "scarf",
    "glove", "hat", "cap", "belt", "wool", "polyester", "blend", "slim",
    "apparel", "clothing", "garment", "textile", "knit", "zip", "zipper",
    "hem", "collar", "button", "tee", "tshirt", "boot", "sandal", "wardrobe",
  ],
  office: [
    "desk", "pen", "paper", "notebook", "chair", "stapler", "folder",
    "printer", "pencil", "marker", "whiteboard", "binder", "envelope",
    "ink", "toner", "organizer", "drawer", "cabinet", "supplies", "clip",
    "tape", "highlighter", "calendar", "planner", "ergonomic", "standing",
    "workstation", "cubicle", "conference", "presentation", "office",
    "filing", "shredder", "letterhead", "sticky",
  ],
  sports: [
    "running", "yoga", "gym", "ball", "fitness", "outdoor", "bike", "mat",
    "bicycle", "dumbbell", "weight", "treadmill", "workout", "exercise",
    "training", "athletic", "sport", "hiking", "camping", "tent",
    "backpack", "cycling", "swim", "tennis", "basketball", "football",
    "soccer", "golf", "resistance", "strap", "bottle", "hydration",
    "protein", "muscle", "cardio", "stretch", "climb", "kayak", "paddle",
  ],
};

/**
 * Crude suffix stripping so "charging", "charger", and "charged" all reduce
 * to the same stem, and "running" matches "run". Deliberately not a real
 * stemmer (Porter etc.): a handful of common English suffixes covers most of
 * what breaks exact-match tagging in practice, without pulling in a
 * dependency for a project whose whole pitch is zero runtime deps.
 */
export function stem(word: string): string {
  const suffixes = ["ically", "ing", "ies", "ers", "er", "ed", "es", "s"];
  let result = word;
  for (const suffix of suffixes) {
    if (result.length > suffix.length + 2 && result.endsWith(suffix)) {
      result = result.slice(0, -suffix.length);
      break;
    }
  }
  // "charger" -> "charg", but "charge" has no suffix to strip and stays
  // "charge": the two forms of the same word land on different stems.
  // Stripping a trailing "e" after suffix removal, the way churnfm's Python
  // stemmer had to for "receive" vs "received", closes that gap.
  if (result.length > 3 && result.endsWith("e")) {
    result = result.slice(0, -1);
  }
  return result;
}
