/** Product taxonomy and the labeled catalog used for the benchmark. */

export interface Product {
  id: string;
  title: string;
  description: string;
  trueCategory: string;
  /** Deliberately ambiguous items that a keyword tagger will misclassify. */
  ambiguous?: boolean;
}

export const CATEGORIES = [
  "electronics",
  "kitchen",
  "apparel",
  "office",
  "sports",
] as const;
export type Category = (typeof CATEGORIES)[number];

/** Keyword signal per category. Deliberately overlapping so some items are
 * genuinely hard to tag from text alone (e.g. "smart watch band" touches both
 * electronics and apparel) -- exactly the case that should escalate to a human
 * rather than get force-tagged with low confidence. */
export const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  electronics: ["battery", "charger", "bluetooth", "watch", "smart", "screen", "wireless", "usb"],
  kitchen: ["knife", "pan", "oven", "blender", "kitchen", "cooking", "steel", "grill"],
  apparel: ["shirt", "band", "fabric", "sleeve", "wear", "cotton", "jacket", "shoe"],
  office: ["desk", "pen", "paper", "notebook", "chair", "stapler", "folder", "printer"],
  sports: ["running", "yoga", "gym", "ball", "fitness", "outdoor", "bike", "mat"],
};

export const CATALOG: Product[] = [
  { id: "p1", title: "Stainless Steel Chef Knife 8-inch", description: "Full-tang stainless steel knife for kitchen prep and cooking.", trueCategory: "kitchen" },
  { id: "p2", title: "Wireless Bluetooth Charger Pad", description: "Fast USB-C wireless charger with bluetooth pairing indicator.", trueCategory: "electronics" },
  { id: "p3", title: "Ergonomic Office Desk Chair", description: "Adjustable desk chair for long office hours, breathable fabric back.", trueCategory: "office" },
  { id: "p4", title: "Running Shoes Lightweight Mesh", description: "Lightweight running shoes with breathable mesh for gym and outdoor training.", trueCategory: "sports" },
  { id: "p5", title: "Cotton Crew Neck T-Shirt", description: "Soft cotton shirt, regular fit, short sleeve.", trueCategory: "apparel" },
  { id: "p6", title: "Non-Stick Frying Pan 10-inch", description: "Non-stick steel pan for stovetop and oven cooking.", trueCategory: "kitchen" },
  { id: "p7", title: "Mechanical Pencil Set with Refills", description: "Office pencil set with paper notebook refill leads.", trueCategory: "office" },
  { id: "p8", title: "Yoga Mat with Carry Strap", description: "Non-slip yoga and fitness mat, includes carrying strap for gym or outdoor use.", trueCategory: "sports" },
  // ambiguous: genuinely spans two categories via keyword overlap
  { id: "p9", title: "Smart Watch Band Wireless Fabric Strap", description: "Replacement fabric band for smart wireless watch, soft cotton blend.", trueCategory: "apparel", ambiguous: true },
  { id: "p10", title: "Bluetooth Fitness Tracker Wristband", description: "Wireless bluetooth fitness tracker band for gym and running.", trueCategory: "electronics", ambiguous: true },
  { id: "p11", title: "Steel Water Bottle for Gym and Office", description: "Insulated steel bottle, fits desk cup holders and gym bags.", trueCategory: "sports", ambiguous: true },
  { id: "p12", title: "Kitchen Storage Folder Organizer", description: "Stackable steel folder-style organizer for kitchen or office paper.", trueCategory: "kitchen", ambiguous: true },
];
