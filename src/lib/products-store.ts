import { useSyncExternalStore } from "react";

export interface ProductVariant {
  id: string;
  name: string; // e.g. "Hardcover", "Arabic Edition", "Paperback"
  sku: string;
  price: number;
  stock: number;
  weightGrams: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

export interface ProductOption {
  name: string; // e.g. "Size", "Color"
  values: string[];
}

export type ConfidenceLevel = "unreviewed" | "estimated" | "verified";

export interface Product {
  id: string;
  name: string;
  slug?: string;
  sku?: string;
  category: string;
  description: string;
  basePrice: number;
  salePrice?: number;
  badge?: string; // "New", "Sale", "Bestseller"
  author?: string;
  publisher?: string;
  language?: string;
  imageUrl?: string;
  active: boolean;
  variants: ProductVariant[];
  options?: ProductOption[];
  tags?: string[];
  family?: string;
  familyLabel?: string;
  confidence?: ConfidenceLevel;
  weightSourceUrl?: string;
  createdAt: string;
}

const uid = () => Math.random().toString(36).slice(2, 9);

const seed: Product[] = [
  {
    id: "p1",
    name: "The Lost Compass",
    category: "Books",
    description: "A historical fiction novel set in 17th century India.",
    basePrice: 499,
    active: true,
    createdAt: new Date().toISOString(),
    variants: [
      { id: uid(), name: "Paperback", sku: "TLC-PB", price: 499, stock: 42, weightGrams: 320, lengthCm: 20, widthCm: 13, heightCm: 2 },
      { id: uid(), name: "Hardcover", sku: "TLC-HC", price: 799, stock: 18, weightGrams: 540, lengthCm: 22, widthCm: 14, heightCm: 3 },
      { id: uid(), name: "Arabic Edition", sku: "TLC-AR", price: 549, stock: 7, weightGrams: 330, lengthCm: 20, widthCm: 13, heightCm: 2 },
    ],
  },
  {
    id: "p2",
    name: "Whispers of Dawn",
    category: "Books",
    description: "Poetry collection — bilingual edition available.",
    basePrice: 299,
    active: true,
    createdAt: new Date().toISOString(),
    variants: [
      { id: uid(), name: "Paperback", sku: "WOD-PB", price: 299, stock: 65, weightGrams: 220, lengthCm: 18, widthCm: 12, heightCm: 1.5 },
      { id: uid(), name: "Deluxe Hardcover", sku: "WOD-DLX", price: 899, stock: 12, weightGrams: 680, lengthCm: 22, widthCm: 15, heightCm: 3 },
    ],
  },
  {
    id: "p3",
    name: "Silent Tides",
    category: "Books",
    description: "Bestselling thriller.",
    basePrice: 399,
    active: true,
    createdAt: new Date().toISOString(),
    variants: [
      { id: uid(), name: "Paperback", sku: "ST-PB", price: 399, stock: 0, weightGrams: 280, lengthCm: 19, widthCm: 13, heightCm: 2 },
    ],
  },
];

let state: Product[] = [...seed];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => state;
export const useProducts = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

export const productsActions = {
  addProduct(p: Omit<Product, "id" | "createdAt" | "variants"> & { variants?: ProductVariant[] }) {
    const product: Product = {
      ...p,
      id: uid(),
      createdAt: new Date().toISOString(),
      variants: p.variants && p.variants.length ? p.variants : [
        { id: uid(), name: "Default", sku: p.name.slice(0, 3).toUpperCase() + "-DEF", price: p.basePrice, stock: 0, weightGrams: 300, lengthCm: 20, widthCm: 13, heightCm: 2 },
      ],
    };
    state = [product, ...state];
    emit();
    return product.id;
  },
  bulkAddProducts(rows: { name: string; category: string; price: number; stock: number; weight?: number }[]) {
    const items: Product[] = rows.map((r) => ({
      id: uid(),
      name: r.name,
      category: r.category || "Uncategorized",
      description: "",
      basePrice: r.price,
      active: true,
      createdAt: new Date().toISOString(),
      variants: [
        { id: uid(), name: "Default", sku: r.name.slice(0, 3).toUpperCase() + "-" + uid().slice(0, 3).toUpperCase(), price: r.price, stock: r.stock, weightGrams: r.weight ?? 300, lengthCm: 20, widthCm: 13, heightCm: 2 },
      ],
    }));
    state = [...items, ...state];
    emit();
    return items.length;
  },
  updateProduct(id: string, patch: Partial<Omit<Product, "id" | "variants">>) {
    state = state.map((p) => (p.id === id ? { ...p, ...patch } : p));
    emit();
  },
  deleteProduct(id: string) {
    state = state.filter((p) => p.id !== id);
    emit();
  },
  addVariant(productId: string, v: Omit<ProductVariant, "id">) {
    state = state.map((p) =>
      p.id === productId ? { ...p, variants: [...p.variants, { ...v, id: uid() }] } : p,
    );
    emit();
  },
  updateVariant(productId: string, variantId: string, patch: Partial<ProductVariant>) {
    state = state.map((p) =>
      p.id === productId
        ? { ...p, variants: p.variants.map((v) => (v.id === variantId ? { ...v, ...patch } : v)) }
        : p,
    );
    emit();
  },
  deleteVariant(productId: string, variantId: string) {
    state = state.map((p) =>
      p.id === productId ? { ...p, variants: p.variants.filter((v) => v.id !== variantId) } : p,
    );
    emit();
  },
  adjustStock(productId: string, variantId: string, delta: number) {
    state = state.map((p) =>
      p.id === productId
        ? {
            ...p,
            variants: p.variants.map((v) =>
              v.id === variantId ? { ...v, stock: Math.max(0, v.stock + delta) } : v,
            ),
          }
        : p,
    );
    emit();
  },
  setStock(productId: string, variantId: string, value: number) {
    this.updateVariant(productId, variantId, { stock: Math.max(0, value) });
  },
};

export function totalStock(p: Product) {
  return p.variants.reduce((a, b) => a + b.stock, 0);
}
export function priceRange(p: Product) {
  if (!p.variants.length) return `₹${p.basePrice}`;
  const prices = p.variants.map((v) => v.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? `₹${min}` : `₹${min} – ₹${max}`;
}
