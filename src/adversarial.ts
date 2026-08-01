/**
 * Product text the taxonomy was not built around.
 *
 * The bundled catalog's 12 items and the original keyword lists were written
 * together, so every clean item hits 3-4 keywords per category and scores
 * full confidence. That measures whether the tagger can find the words it
 * was handed. It does not measure whether the tagger works on a catalog it
 * has not seen.
 *
 * These 24 items are ordinary product listings, the kind any e-commerce
 * catalog actually contains, written independently of both keyword lists.
 * None are deliberately ambiguous; every one has an unambiguous correct
 * category to a human reader. The question is whether the tagger agrees
 * without a person's help.
 */
import type { Product } from "./taxonomy.js";

export const ADVERSARIAL_CATALOG: Product[] = [
  { id: "a1", title: "Wireless Earbuds with Charging Case", description: "Noise cancelling earbuds, USB-C charging case, Bluetooth 5.3 pairing.", trueCategory: "electronics" },
  { id: "a2", title: "27-inch 4K Monitor", description: "Ultra HD display for gaming and productivity, HDMI and DisplayPort inputs.", trueCategory: "electronics" },
  { id: "a3", title: "Portable Power Bank 20000mAh", description: "Fast charging power bank with dual USB ports for phones and tablets.", trueCategory: "electronics" },
  { id: "a4", title: "Rechargeable AA Batteries 4-Pack", description: "NiMH rechargeable batteries with a compact charging dock included.", trueCategory: "electronics" },
  { id: "a5", title: "Mechanical Gaming Keyboard", description: "RGB backlit keyboard with hot-swappable switches for desktop setups.", trueCategory: "electronics" },
  { id: "a6", title: "Ceramic Dutch Oven 6-Quart", description: "Enameled cast iron pot for braising, roasting, and slow cooking.", trueCategory: "kitchen" },
  { id: "a7", title: "Espresso Machine with Milk Frother", description: "Semi-automatic espresso maker for home baristas, includes steam wand.", trueCategory: "kitchen" },
  { id: "a8", title: "Bamboo Cutting Board Set", description: "Three-piece cutting board set, knife-friendly and dishwasher safe.", trueCategory: "kitchen" },
  { id: "a9", title: "Electric Kettle 1.7L", description: "Fast-boil kettle with auto shutoff for tea and coffee prep.", trueCategory: "kitchen" },
  { id: "a10", title: "Stand Mixer with Dough Hook", description: "Countertop mixer for baking bread, cakes, and cookie dough.", trueCategory: "kitchen" },
  { id: "a11", title: "Slim Fit Denim Jeans", description: "Classic five-pocket jeans in stretch denim fabric.", trueCategory: "apparel" },
  { id: "a12", title: "Wool Blend Winter Coat", description: "Warm winter coat with zip closure and detachable hood.", trueCategory: "apparel" },
  { id: "a13", title: "Merino Wool Crew Socks 3-Pack", description: "Moisture-wicking wool socks for cold weather.", trueCategory: "apparel" },
  { id: "a14", title: "Leather Ankle Boots", description: "Genuine leather boots with a side zipper and block heel.", trueCategory: "apparel" },
  { id: "a15", title: "Fleece Zip-Up Hoodie", description: "Soft fleece hoodie with kangaroo pocket and adjustable hood.", trueCategory: "apparel" },
  { id: "a16", title: "Adjustable Standing Desk Converter", description: "Raise your monitor and keyboard for a healthier workday.", trueCategory: "office" },
  { id: "a17", title: "Whiteboard Markers 12-Pack", description: "Dry erase markers for classroom and conference room use.", trueCategory: "office" },
  { id: "a18", title: "Document Shredder Cross-Cut", description: "Shreds up to 12 sheets at once, includes a wastebasket.", trueCategory: "office" },
  { id: "a19", title: "Sticky Notes Assorted Colors", description: "Self-stick notes for reminders, filing, and desk organization.", trueCategory: "office" },
  { id: "a20", title: "Three-Ring Binder Set", description: "Durable binders for filing paperwork and presentation handouts.", trueCategory: "office" },
  { id: "a21", title: "Adjustable Dumbbell Set", description: "Space-saving dumbbells for home strength training.", trueCategory: "sports" },
  { id: "a22", title: "Insulated Water Bottle 32oz", description: "Keeps drinks cold for 24 hours, leak-proof lid for hiking.", trueCategory: "sports" },
  { id: "a23", title: "Foldable Camping Tent 4-Person", description: "Weatherproof tent for outdoor camping trips.", trueCategory: "sports" },
  { id: "a24", title: "Resistance Bands Set", description: "Five-band set for stretching and strength workouts.", trueCategory: "sports" },
];

/**
 * A second set, written after `CATEGORY_KEYWORDS_V2`, the stemmer, and the
 * confidence threshold (0.55) were all frozen against `CATALOG` and
 * `ADVERSARIAL_CATALOG` only. Nothing below was consulted while tuning
 * anything; it is evaluated exactly once, by `tests/taggate.test.ts`. Same
 * discipline as the corpus above: ordinary listings, not built to exercise
 * any particular keyword.
 */
export const HOLDOUT_CATALOG: Product[] = [
  { id: "h1", title: "Smart Doorbell Camera", description: "1080p video doorbell with motion alerts and night vision.", trueCategory: "electronics" },
  { id: "h2", title: "USB-C Hub 7-in-1", description: "Adapter with HDMI, ethernet, and SD card slots for laptops.", trueCategory: "electronics" },
  { id: "h3", title: "Noise-Cancelling Over-Ear Headphones", description: "Studio headphones with active noise cancellation and a 30-hour battery.", trueCategory: "electronics" },
  { id: "h4", title: "Cast Iron Skillet 12-inch", description: "Pre-seasoned skillet for stovetop and oven cooking.", trueCategory: "kitchen" },
  { id: "h5", title: "Silicone Baking Mat Set", description: "Reusable nonstick mats for cookies and pastries.", trueCategory: "kitchen" },
  { id: "h6", title: "Vacuum Sealer for Food Storage", description: "Keeps meat, produce, and leftovers fresh for meal prep.", trueCategory: "kitchen" },
  { id: "h7", title: "Linen Button-Down Shirt", description: "Breathable linen shirt with a relaxed fit for summer.", trueCategory: "apparel" },
  { id: "h8", title: "Thermal Base Layer Leggings", description: "Insulating leggings for cold-weather layering.", trueCategory: "apparel" },
  { id: "h9", title: "Canvas Utility Work Jacket", description: "Durable canvas jacket with reinforced elbows and chest pockets.", trueCategory: "apparel" },
  { id: "h10", title: "Ergonomic Wrist Rest for Keyboard", description: "Memory foam support to reduce desk strain during typing.", trueCategory: "office" },
  { id: "h11", title: "Desktop File Organizer Tray", description: "Stackable trays for sorting incoming and outgoing paperwork.", trueCategory: "office" },
  { id: "h12", title: "Push Pin Cork Board 24x18", description: "Bulletin board for pinning notes and schedules at a workstation.", trueCategory: "office" },
  { id: "h13", title: "Jump Rope with Ball Bearings", description: "Adjustable speed rope for cardio and conditioning workouts.", trueCategory: "sports" },
  { id: "h14", title: "Trail Running Backpack 10L", description: "Lightweight hydration backpack for trail running and hiking.", trueCategory: "sports" },
  { id: "h15", title: "Foam Roller for Muscle Recovery", description: "High-density roller for post-workout stretching and recovery.", trueCategory: "sports" },
];
