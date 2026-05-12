import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  useProducts,
  productsActions,
  totalStock,
  priceRange,
  type Product,
  type ProductVariant,
} from "@/lib/products-store";
import {
  Plus, Package, Pencil, Trash2, Search, Upload, Minus,
  ChevronDown, ChevronRight, X,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/products")({
  component: ProductsPage,
  head: () => ({
    meta: [
      { title: "Products — Store Management" },
      { name: "description", content: "Manage your store catalog" },
    ],
  }),
});

function Stat({ label, value, accent }: { label: string; value: string; accent?: "warning" | "destructive" }) {
  const color = accent === "warning" ? "text-warning" : accent === "destructive" ? "text-destructive" : "text-foreground";
  return (
    <div className="rounded-lg bg-card border border-border p-4 sm:p-5">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <p className={`text-[20px] font-semibold tracking-tight mt-1.5 tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

function ProductsPage() {
  const products = useProducts();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Product | null>(null);
  const [adding, setAdding] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
    [products, query],
  );

  const stats = useMemo(() => {
    let total = 0, low = 0, out = 0, units = 0;
    products.forEach((p) => {
      total += p.variants.length;
      p.variants.forEach((v) => {
        units += v.stock;
        if (v.stock === 0) out++;
        else if (v.stock <= 5) low++;
      });
    });
    return { total, low, out, units };
  }, [products]);

  return (
    <AdminShell title="Products" subtitle={`${products.length} active · ${stats.total} variants`}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Stat label="Active products" value={products.length.toString()} />
        <Stat label="Variants" value={stats.total.toString()} />
        <Stat label="Low stock (≤5)" value={stats.low.toString()} accent={stats.low ? "warning" : undefined} />
        <Stat label="Out of stock" value={stats.out.toString()} accent={stats.out ? "destructive" : undefined} />
      </div>

      <div className="rounded-lg bg-card border border-border overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-border">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search products…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8 pl-8 text-[13px]"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)}>
              <Upload className="w-3.5 h-3.5" /> Bulk add
            </Button>
            <Button size="sm" onClick={() => setAdding(true)}>
              <Plus className="w-3.5 h-3.5" /> Add product
            </Button>
          </div>
        </div>

        <ul className="divide-y divide-border">
          {filtered.map((p) => {
            const open = !!expanded[p.id];
            const stock = totalStock(p);
            return (
              <li key={p.id}>
                <div className="flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-accent/40 transition-colors">
                  <button
                    onClick={() => setExpanded((e) => ({ ...e, [p.id]: !open }))}
                    className="text-muted-foreground hover:text-foreground p-0.5"
                    aria-label={open ? "Collapse" : "Expand"}
                  >
                    {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <div className="w-8 h-8 rounded-md bg-surface flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {p.category} · {p.variants.length} {p.variants.length === 1 ? "variant" : "variants"} · {priceRange(p)}
                    </p>
                  </div>
                  <span className={`hidden sm:inline text-[12px] font-mono shrink-0 ${stock === 0 ? "text-destructive" : stock <= 5 ? "text-warning" : "text-muted-foreground"}`}>
                    {stock} in stock
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(p)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        if (confirm(`Delete "${p.name}"?`)) {
                          productsActions.deleteProduct(p.id);
                          toast.success("Product deleted");
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {open && (
                  <div className="bg-surface/40 border-t border-border px-4 sm:px-12 py-3">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px] text-[12.5px]">
                        <thead>
                          <tr className="text-left text-[11px] text-muted-foreground">
                            <th className="py-1.5 pr-4 font-normal">Variant</th>
                            <th className="py-1.5 pr-4 font-normal">SKU</th>
                            <th className="py-1.5 pr-4 font-normal text-right">Price</th>
                            <th className="py-1.5 pr-4 font-normal text-right">Weight</th>
                            <th className="py-1.5 pr-4 font-normal text-right">Stock</th>
                            <th className="py-1.5 font-normal text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {p.variants.map((v) => (
                            <tr key={v.id} className="border-t border-border">
                              <td className="py-2 pr-4">{v.name}</td>
                              <td className="py-2 pr-4 font-mono text-[11.5px] text-muted-foreground">{v.sku}</td>
                              <td className="py-2 pr-4 text-right font-mono">₹{v.price}</td>
                              <td className="py-2 pr-4 text-right font-mono text-muted-foreground">{v.weightGrams}g</td>
                              <td className="py-2 pr-4 text-right">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    className="w-6 h-6 rounded border border-border hover:bg-accent"
                                    onClick={() => productsActions.adjustStock(p.id, v.id, -1)}
                                  ><Minus className="w-3 h-3 mx-auto" /></button>
                                  <input
                                    value={v.stock}
                                    onChange={(e) => productsActions.setStock(p.id, v.id, parseInt(e.target.value) || 0)}
                                    className="w-12 text-center bg-card border border-border rounded h-6 text-[12px] tabular-nums"
                                  />
                                  <button
                                    className="w-6 h-6 rounded border border-border hover:bg-accent"
                                    onClick={() => productsActions.adjustStock(p.id, v.id, 1)}
                                  ><Plus className="w-3 h-3 mx-auto" /></button>
                                </div>
                              </td>
                              <td className="py-2 text-right">
                                <button
                                  className="text-muted-foreground hover:text-destructive"
                                  onClick={() => {
                                    if (p.variants.length === 1) return toast.error("Need at least one variant");
                                    productsActions.deleteVariant(p.id, v.id);
                                    toast.success("Variant removed");
                                  }}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => {
                        productsActions.addVariant(p.id, {
                          name: "New Edition",
                          sku: p.name.slice(0, 3).toUpperCase() + "-NEW",
                          price: p.basePrice,
                          stock: 0,
                          weightGrams: 300,
                          lengthCm: 20,
                          widthCm: 13,
                          heightCm: 2,
                        });
                        toast.success("Variant added — edit details");
                      }}
                    >
                      <Plus className="w-3.5 h-3.5" /> Add variant / edition
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="px-6 py-12 text-center text-[13px] text-muted-foreground">No products match your search.</li>
          )}
        </ul>
      </div>

      {adding && <ProductDialog onClose={() => setAdding(false)} />}
      {editing && <ProductDialog product={editing} onClose={() => setEditing(null)} />}
      {bulkOpen && <BulkAddDialog onClose={() => setBulkOpen(false)} />}
    </AdminShell>
  );
}

function ProductDialog({ product, onClose }: { product?: Product; onClose: () => void }) {
  const isEdit = !!product;
  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState(product?.category ?? "Books");
  const [description, setDescription] = useState(product?.description ?? "");
  const [basePrice, setBasePrice] = useState(product?.basePrice ?? 0);
  const [variants, setVariants] = useState<Omit<ProductVariant, "id">[]>(
    product?.variants.map(({ id: _id, ...v }) => v) ?? [
      { name: "Default", sku: "", price: 0, stock: 0, weightGrams: 300, lengthCm: 20, widthCm: 13, heightCm: 2 },
    ],
  );

  function save() {
    if (!name.trim()) return toast.error("Name is required");
    if (isEdit && product) {
      productsActions.updateProduct(product.id, { name, category, description, basePrice });
      // sync variants: update existing in order, add new ones; for simplicity replace fully
      product.variants.forEach((v) => productsActions.deleteVariant(product.id, v.id));
      variants.forEach((v) => productsActions.addVariant(product.id, v));
      toast.success("Product updated");
    } else {
      productsActions.addProduct({ name, category, description, basePrice, active: true, variants: variants.map((v) => ({ ...v, id: Math.random().toString(36).slice(2, 9) })) });
      toast.success("Product added");
    }
    onClose();
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit product" : "Add product"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-[12px]">Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label className="text-[12px]">Category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-[12px]">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="max-w-[12rem]">
            <Label className="text-[12px]">Base price (₹)</Label>
            <Input type="number" value={basePrice} onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-[12px]">Variants / editions</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setVariants((vs) => [
                    ...vs,
                    { name: "", sku: "", price: basePrice, stock: 0, weightGrams: 300, lengthCm: 20, widthCm: 13, heightCm: 2 },
                  ])
                }
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {variants.map((v, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center bg-surface/50 border border-border rounded-md p-2">
                  <Input className="col-span-3 h-8 text-[12px]" placeholder="Edition name" value={v.name} onChange={(e) => setVariants((arr) => arr.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                  <Input className="col-span-2 h-8 text-[12px] font-mono" placeholder="SKU" value={v.sku} onChange={(e) => setVariants((arr) => arr.map((x, j) => j === i ? { ...x, sku: e.target.value } : x))} />
                  <Input className="col-span-2 h-8 text-[12px]" type="number" placeholder="₹ Price" value={v.price} onChange={(e) => setVariants((arr) => arr.map((x, j) => j === i ? { ...x, price: parseFloat(e.target.value) || 0 } : x))} />
                  <Input className="col-span-2 h-8 text-[12px]" type="number" placeholder="Stock" value={v.stock} onChange={(e) => setVariants((arr) => arr.map((x, j) => j === i ? { ...x, stock: parseInt(e.target.value) || 0 } : x))} />
                  <Input className="col-span-2 h-8 text-[12px]" type="number" placeholder="Weight g" value={v.weightGrams} onChange={(e) => setVariants((arr) => arr.map((x, j) => j === i ? { ...x, weightGrams: parseInt(e.target.value) || 0 } : x))} />
                  <button className="col-span-1 text-muted-foreground hover:text-destructive justify-self-end" onClick={() => setVariants((arr) => arr.filter((_, j) => j !== i))}>
                    <X className="w-4 h-4" />
                  </button>
                  <div className="col-span-12 grid grid-cols-3 gap-2">
                    <Input className="h-7 text-[11.5px]" type="number" placeholder="L (cm)" value={v.lengthCm} onChange={(e) => setVariants((arr) => arr.map((x, j) => j === i ? { ...x, lengthCm: parseFloat(e.target.value) || 0 } : x))} />
                    <Input className="h-7 text-[11.5px]" type="number" placeholder="W (cm)" value={v.widthCm} onChange={(e) => setVariants((arr) => arr.map((x, j) => j === i ? { ...x, widthCm: parseFloat(e.target.value) || 0 } : x))} />
                    <Input className="h-7 text-[11.5px]" type="number" placeholder="H (cm)" value={v.heightCm} onChange={(e) => setVariants((arr) => arr.map((x, j) => j === i ? { ...x, heightCm: parseFloat(e.target.value) || 0 } : x))} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>{isEdit ? "Save changes" : "Create product"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BulkAddDialog({ onClose }: { onClose: () => void }) {
  const [csv, setCsv] = useState("name,category,price,stock,weight\nExample Book,Books,499,20,320\n");

  function importRows() {
    const lines = csv.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return toast.error("Add at least one product row");
    const [header, ...rows] = lines;
    const cols = header.split(",").map((c) => c.trim().toLowerCase());
    const required = ["name", "category", "price", "stock"];
    if (!required.every((r) => cols.includes(r))) return toast.error("Header must include: name, category, price, stock");

    const parsed = rows.map((r) => {
      const cells = r.split(",").map((c) => c.trim());
      const get = (k: string) => cells[cols.indexOf(k)] ?? "";
      return {
        name: get("name"),
        category: get("category"),
        price: parseFloat(get("price")) || 0,
        stock: parseInt(get("stock")) || 0,
        weight: cols.includes("weight") ? parseInt(get("weight")) || undefined : undefined,
      };
    }).filter((r) => r.name);

    const n = productsActions.bulkAddProducts(parsed);
    toast.success(`${n} product${n === 1 ? "" : "s"} added`);
    onClose();
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk add products</DialogTitle>
        </DialogHeader>
        <p className="text-[12px] text-muted-foreground">
          Paste CSV with columns <code className="bg-surface px-1 rounded">name, category, price, stock, weight</code> (weight optional, in grams). One product per line.
        </p>
        <Textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={10} className="font-mono text-[12px]" />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={importRows}>Import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
