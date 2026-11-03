import type { Product } from "./products-store";

export interface SeoIssue {
  key: "title" | "description" | "slug" | "alt" | "productDesc";
  label: string;
}

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-");

export function suggestTitle(p: Product, store = "Store") {
  const extra = p.author ? ` by ${p.author}` : p.category ? ` | ${p.category}` : "";
  const t = `${p.name}${extra} – ${store}`;
  return t.length > 60 ? `${p.name}${extra}`.slice(0, 60) : t;
}

export function suggestDescription(p: Product) {
  const min = p.variants.length ? Math.min(...p.variants.map((v) => v.price)) : p.basePrice;
  const formats = p.variants.map((v) => v.name).filter((n) => n !== "Default");
  const base = p.description?.trim() || `Shop ${p.name}${p.author ? ` by ${p.author}` : ""}.`;
  let d = `${base} ${formats.length ? `Available in ${formats.join(", ")}. ` : ""}From ₹${min}. Fast shipping across India.`;
  if (d.length > 158) d = d.slice(0, 155).trimEnd() + "…";
  return d;
}

export function suggestAlt(p: Product) {
  return `${p.name}${p.author ? ` by ${p.author}` : ""} – ${p.category.toLowerCase()} cover`;
}

export function auditProduct(p: Product): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const t = p.seoTitle ?? "";
  const d = p.seoDescription ?? "";
  if (t.length < 20 || t.length > 60) issues.push({ key: "title", label: t ? "Title length not 20–60 chars" : "Missing search title" });
  if (d.length < 70 || d.length > 160) issues.push({ key: "description", label: d ? "Description length not 70–160 chars" : "Missing search description" });
  if (!p.slug || p.slug !== slugify(p.slug)) issues.push({ key: "slug", label: "Missing or messy URL" });
  if (!p.imageAlt) issues.push({ key: "alt", label: "Image has no alt text" });
  if ((p.description ?? "").length < 50) issues.push({ key: "productDesc", label: "Product description too short" });
  return issues;
}

/** Score out of 100; each of 5 checks is worth 20. */
export function seoScore(p: Product) {
  return 100 - auditProduct(p).length * 20;
}

/** Fields autopilot can fill automatically (product description needs a human). */
export function autoFix(p: Product, store?: string): Partial<Product> {
  const patch: Partial<Product> = {};
  for (const i of auditProduct(p)) {
    if (i.key === "title") patch.seoTitle = suggestTitle(p, store);
    if (i.key === "description") patch.seoDescription = suggestDescription(p);
    if (i.key === "slug") patch.slug = slugify(p.slug || p.name);
    if (i.key === "alt") patch.imageAlt = suggestAlt(p);
  }
  return patch;
}
