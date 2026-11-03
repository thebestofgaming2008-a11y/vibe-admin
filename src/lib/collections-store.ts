import { useSyncExternalStore } from "react";
import type { Product } from "./products-store";

export type RuleField = "category" | "tag" | "price_below" | "price_above" | "in_stock" | "on_sale";

export interface CollectionRule {
  field: RuleField;
  value: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  type: "manual" | "smart";
  productIds: string[];
  rules: CollectionRule[];
  match: "all" | "any";
  visible: boolean;
  createdAt: string;
}

const uid = () => Math.random().toString(36).slice(2, 9);

let state: Collection[] = [
  { id: "c1", name: "Bestsellers", description: "Our most loved books.", type: "manual", productIds: ["p1", "p3"], rules: [], match: "all", visible: true, createdAt: new Date().toISOString() },
  { id: "c2", name: "Under ₹400", description: "Great reads on a budget.", type: "smart", productIds: [], rules: [{ field: "price_below", value: "400" }], match: "all", visible: true, createdAt: new Date().toISOString() },
  { id: "c3", name: "All books", description: "", type: "smart", productIds: [], rules: [{ field: "category", value: "Books" }], match: "all", visible: false, createdAt: new Date().toISOString() },
];

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => state;
export const useCollections = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

export const collectionsActions = {
  add(c: Omit<Collection, "id" | "createdAt">) {
    state = [{ ...c, id: uid(), createdAt: new Date().toISOString() }, ...state];
    emit();
  },
  update(id: string, patch: Partial<Collection>) {
    state = state.map((c) => (c.id === id ? { ...c, ...patch } : c));
    emit();
  },
  remove(id: string) {
    state = state.filter((c) => c.id !== id);
    emit();
  },
};

function minPrice(p: Product) {
  return p.variants.length ? Math.min(...p.variants.map((v) => v.price)) : p.basePrice;
}

export function matchesRule(p: Product, r: CollectionRule): boolean {
  switch (r.field) {
    case "category": return p.category.toLowerCase() === r.value.toLowerCase();
    case "tag": return (p.tags ?? []).some((t) => t.toLowerCase() === r.value.toLowerCase());
    case "price_below": return minPrice(p) < Number(r.value);
    case "price_above": return minPrice(p) > Number(r.value);
    case "in_stock": return p.variants.some((v) => v.stock > 0);
    case "on_sale": return p.salePrice != null && p.salePrice < p.basePrice;
  }
}

export function productsInCollection(c: Collection, products: Product[]): Product[] {
  if (c.type === "manual") return products.filter((p) => c.productIds.includes(p.id));
  if (!c.rules.length) return [];
  return products.filter((p) =>
    c.match === "all" ? c.rules.every((r) => matchesRule(p, r)) : c.rules.some((r) => matchesRule(p, r)),
  );
}

export const ruleLabels: Record<RuleField, string> = {
  category: "Category is",
  tag: "Has tag",
  price_below: "Price below ₹",
  price_above: "Price above ₹",
  in_stock: "In stock",
  on_sale: "On sale",
};
