import { useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  X,
  Package,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  productsActions,
  type Product,
  type ProductVariant,
  type ProductOption,
  type ConfidenceLevel,
} from "@/lib/products-store";
import { cn } from "@/lib/utils";

interface Props {
  product?: Product;
  open: boolean;
  onClose: () => void;
}

type Draft = {
  name: string;
  slug: string;
  sku: string;
  category: string;
  description: string;
  basePrice: number;
  salePrice: string;
  stock: number;
  badge: string;
  author: string;
  publisher: string;
  language: string;
  imageUrl: string;
  weightGrams: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  confidence: ConfidenceLevel;
  weightSourceUrl: string;
  family: string;
  familyLabel: string;
  tags: string;
  options: ProductOption[];
  variants: Omit<ProductVariant, "id">[];
};

const CATEGORIES = ["Books", "Apparel", "Accessories", "Home", "Other"];

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function emptyVariant(): Omit<ProductVariant, "id"> {
  return {
    name: "",
    sku: "",
    price: 0,
    stock: 0,
    weightGrams: 0,
    lengthCm: 0,
    widthCm: 0,
    heightCm: 0,
  };
}

export function ProductEditor({ product, open, onClose }: Props) {
  const isEdit = !!product;
  const initial: Draft = useMemo(
    () => ({
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      sku: product?.sku ?? "",
      category: product?.category ?? "Books",
      description: product?.description ?? "",
      basePrice: product?.basePrice ?? 0,
      salePrice: product?.salePrice ? String(product.salePrice) : "",
      stock: product?.variants?.[0]?.stock ?? 0,
      badge: product?.badge ?? "",
      author: product?.author ?? "",
      publisher: product?.publisher ?? "",
      language: product?.language ?? "",
      imageUrl: product?.imageUrl ?? "",
      weightGrams: product?.variants?.[0]?.weightGrams ? String(product.variants[0].weightGrams) : "",
      lengthCm: product?.variants?.[0]?.lengthCm ? String(product.variants[0].lengthCm) : "",
      widthCm: product?.variants?.[0]?.widthCm ? String(product.variants[0].widthCm) : "",
      heightCm: product?.variants?.[0]?.heightCm ? String(product.variants[0].heightCm) : "",
      confidence: product?.confidence ?? "unreviewed",
      weightSourceUrl: product?.weightSourceUrl ?? "",
      family: product?.family ?? "",
      familyLabel: product?.familyLabel ?? "",
      tags: product?.tags?.join(", ") ?? "",
      options: product?.options ?? [],
      variants: product?.variants?.map(({ id: _id, ...v }) => v) ?? [],
    }),
    [product],
  );

  const [d, setD] = useState<Draft>(initial);
  const [tab, setTab] = useState("general");

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setD((prev) => ({ ...prev, [key]: value }));

  function save() {
    if (!d.name.trim()) {
      toast.error("Product name is required");
      setTab("general");
      return;
    }
    if (d.basePrice <= 0) {
      toast.error("Price must be greater than 0");
      setTab("pricing");
      return;
    }

    const fallbackVariant: Omit<ProductVariant, "id"> = {
      name: "Default",
      sku: d.sku || slugify(d.name).toUpperCase().slice(0, 8),
      price: d.basePrice,
      stock: d.stock,
      weightGrams: Number(d.weightGrams) || 0,
      lengthCm: Number(d.lengthCm) || 0,
      widthCm: Number(d.widthCm) || 0,
      heightCm: Number(d.heightCm) || 0,
    };

    const variants = d.variants.length > 0 ? d.variants : [fallbackVariant];

    const payload = {
      name: d.name.trim(),
      slug: d.slug || slugify(d.name),
      sku: d.sku || undefined,
      category: d.category,
      description: d.description,
      basePrice: Number(d.basePrice) || 0,
      salePrice: d.salePrice ? Number(d.salePrice) : undefined,
      badge: d.badge || undefined,
      author: d.author || undefined,
      publisher: d.publisher || undefined,
      language: d.language || undefined,
      imageUrl: d.imageUrl || undefined,
      active: product?.active ?? true,
      options: d.options.length ? d.options : undefined,
      tags: d.tags
        ? d.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : undefined,
      family: d.family || undefined,
      familyLabel: d.familyLabel || undefined,
      confidence: d.confidence,
      weightSourceUrl: d.weightSourceUrl || undefined,
    };

    if (isEdit && product) {
      productsActions.updateProduct(product.id, payload);
      product.variants.forEach((v) => productsActions.deleteVariant(product.id, v.id));
      variants.forEach((v) => productsActions.addVariant(product.id, v));
      toast.success("Product saved");
    } else {
      productsActions.addProduct({
        ...payload,
        variants: variants.map((v) => ({ ...v, id: Math.random().toString(36).slice(2, 9) })),
      });
      toast.success("Product created");
    }
    onClose();
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 flex flex-col gap-0 h-full"
      >
        <SheetHeader className="px-5 py-4 border-b border-border space-y-0.5 shrink-0">
          <SheetTitle className="text-base font-semibold tracking-tight">
            {isEdit ? "Edit product" : "New product"}
          </SheetTitle>
          <SheetDescription className="text-[12px] text-muted-foreground truncate">
            {d.slug || (d.name ? slugify(d.name) : "Untitled product")}
          </SheetDescription>
        </SheetHeader>

        <Tabs
          value={tab}
          onValueChange={setTab}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="px-5 pt-3 border-b border-border shrink-0 overflow-x-auto">
            <TabsList className="bg-transparent p-0 h-auto gap-1">
              {[
                ["general", "General"],
                ["pricing", "Pricing"],
                ["shipping", "Shipping"],
                ["variants", "Variants"],
                ["organize", "Organize"],
              ].map(([k, label]) => (
                <TabsTrigger
                  key={k}
                  value={k}
                  className="text-[12.5px] data-[state=active]:bg-foreground data-[state=active]:text-background rounded-md px-3 py-1.5 h-auto"
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <TabsContent value="general" className="mt-0 space-y-5 focus-visible:outline-none">
              <ImageBlock url={d.imageUrl} onChange={(u) => set("imageUrl", u)} />

              <Field label="Name" required>
                <Input
                  value={d.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Al Adab al Muftad"
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Slug"
                  hint="Auto-generated from name if empty"
                >
                  <Input
                    value={d.slug}
                    onChange={(e) => set("slug", slugify(e.target.value))}
                    placeholder={slugify(d.name) || "al-adab-al-muftad"}
                  />
                </Field>
                <Field label="SKU" hint="Stock keeping unit (optional)">
                  <Input
                    value={d.sku}
                    onChange={(e) => set("sku", e.target.value)}
                    placeholder="BK-AAM-001"
                    className="font-mono"
                  />
                </Field>
              </div>

              <Field label="Category" hint="Shown in the storefront “Shop by category” section">
                <Select value={d.category} onValueChange={(v) => set("category", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Description">
                <Textarea
                  value={d.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={4}
                  placeholder="A short description of this product..."
                />
              </Field>
            </TabsContent>

            <TabsContent value="pricing" className="mt-0 space-y-5 focus-visible:outline-none">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Price (₹)" required>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={d.basePrice || ""}
                    onChange={(e) => set("basePrice", parseFloat(e.target.value) || 0)}
                    placeholder="800"
                  />
                </Field>
                <Field label="Sale price (₹)" hint="Shows a discount when set">
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={d.salePrice}
                    onChange={(e) => set("salePrice", e.target.value)}
                    placeholder="—"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Stock" hint="Inventory for the default variant">
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={d.stock || ""}
                    onChange={(e) => set("stock", parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </Field>
                <Field label="Badge" hint="e.g. New, Sale, Bestseller">
                  <Input
                    value={d.badge}
                    onChange={(e) => set("badge", e.target.value)}
                    placeholder="—"
                  />
                </Field>
              </div>

              <div className="rounded-lg border border-border bg-surface/40 p-4 space-y-4">
                <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                  Book details
                </p>
                <Field label="Author">
                  <Input
                    value={d.author}
                    onChange={(e) => set("author", e.target.value)}
                    placeholder="Imam Al-Bukhari"
                  />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Publisher">
                    <Input
                      value={d.publisher}
                      onChange={(e) => set("publisher", e.target.value)}
                      placeholder="Dakwah Corner"
                    />
                  </Field>
                  <Field label="Language">
                    <Input
                      value={d.language}
                      onChange={(e) => set("language", e.target.value)}
                      placeholder="English"
                    />
                  </Field>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="shipping" className="mt-0 space-y-5 focus-visible:outline-none">
              <p className="text-[12.5px] text-muted-foreground">
                Weight and dimensions are used to calculate accurate DTDC and India Post shipping rates.
              </p>

              <Field label="Weight (g)">
                <Input
                  type="number"
                  inputMode="numeric"
                  value={d.weightGrams}
                  onChange={(e) => set("weightGrams", e.target.value)}
                  placeholder="320"
                />
              </Field>

              <div>
                <Label className="text-[12.5px] font-medium">Dimensions (cm)</Label>
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={d.lengthCm}
                    onChange={(e) => set("lengthCm", e.target.value)}
                    placeholder="L"
                  />
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={d.widthCm}
                    onChange={(e) => set("widthCm", e.target.value)}
                    placeholder="W"
                  />
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={d.heightCm}
                    onChange={(e) => set("heightCm", e.target.value)}
                    placeholder="H"
                  />
                </div>
                <p className="text-[11.5px] text-muted-foreground mt-1.5">
                  Length × Width × Height
                </p>
              </div>

              <Field label="Confidence" hint="How trustworthy is this measurement?">
                <Select
                  value={d.confidence}
                  onValueChange={(v) => set("confidence", v as ConfidenceLevel)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unreviewed">Unreviewed</SelectItem>
                    <SelectItem value="estimated">Estimated</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Weight source URL" hint="Link to spec sheet or carrier confirmation">
                <Input
                  value={d.weightSourceUrl}
                  onChange={(e) => set("weightSourceUrl", e.target.value)}
                  placeholder="https://..."
                />
              </Field>
            </TabsContent>

            <TabsContent value="variants" className="mt-0 space-y-5 focus-visible:outline-none">
              <div className="rounded-lg border border-info/30 bg-info/5 p-3 flex gap-2 text-[12.5px] text-foreground">
                <AlertCircle className="w-4 h-4 text-info shrink-0 mt-0.5" />
                <p>
                  Add editions like <b>Hardcover</b>, <b>Arabic</b>, or <b>Paperback</b>. Each variant has its own price, stock and weight.
                </p>
              </div>

              <div className="space-y-3">
                {d.variants.map((v, i) => (
                  <VariantCard
                    key={i}
                    index={i}
                    variant={v}
                    onChange={(patch) =>
                      setD((prev) => ({
                        ...prev,
                        variants: prev.variants.map((x, j) => (j === i ? { ...x, ...patch } : x)),
                      }))
                    }
                    onRemove={() =>
                      setD((prev) => ({
                        ...prev,
                        variants: prev.variants.filter((_, j) => j !== i),
                      }))
                    }
                  />
                ))}

                {d.variants.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border bg-surface/30 p-6 text-center">
                    <Package className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                    <p className="text-[12.5px] text-muted-foreground">
                      No variants yet — the product will use the price, stock and shipping from the Pricing & Shipping tabs.
                    </p>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() =>
                  setD((prev) => ({ ...prev, variants: [...prev.variants, { ...emptyVariant(), price: prev.basePrice }] }))
                }
              >
                <Plus className="w-3.5 h-3.5" /> Add variant
              </Button>
            </TabsContent>

            <TabsContent value="organize" className="mt-0 space-y-5 focus-visible:outline-none">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[12.5px] font-medium">Options</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setD((prev) => ({
                        ...prev,
                        options: [...prev.options, { name: "", values: [] }],
                      }))
                    }
                  >
                    <Plus className="w-3.5 h-3.5" /> Add option
                  </Button>
                </div>
                {d.options.map((opt, i) => (
                  <OptionCard
                    key={i}
                    index={i}
                    option={opt}
                    onChange={(patch) =>
                      setD((prev) => ({
                        ...prev,
                        options: prev.options.map((x, j) => (j === i ? { ...x, ...patch } : x)),
                      }))
                    }
                    onRemove={() =>
                      setD((prev) => ({
                        ...prev,
                        options: prev.options.filter((_, j) => j !== i),
                      }))
                    }
                  />
                ))}
                {d.options.length === 0 && (
                  <p className="text-[12px] text-muted-foreground">
                    Add options like Size or Color to let customers choose.
                  </p>
                )}
              </div>

              <Field label="Tags" hint="Comma separated">
                <Input
                  value={d.tags}
                  onChange={(e) => set("tags", e.target.value)}
                  placeholder="hadith, bukhari, classic"
                />
              </Field>

              <div className="rounded-lg border border-border bg-surface/40 p-4 space-y-4">
                <div>
                  <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                    Linked product family
                  </p>
                  <p className="text-[11.5px] text-muted-foreground mt-1">
                    Use only when separate products should appear on each other&apos;s pages.
                  </p>
                </div>
                <Field label="Family handle">
                  <Input
                    value={d.family}
                    onChange={(e) => set("family", e.target.value)}
                    placeholder="kufi-prayer-cap"
                    className="font-mono"
                  />
                </Field>
                <Field label="This product label">
                  <Input
                    value={d.familyLabel}
                    onChange={(e) => set("familyLabel", e.target.value)}
                    placeholder="Brown · Large · Urdu"
                  />
                </Field>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="border-t border-border p-3 sm:p-4 bg-card flex gap-2 shrink-0">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={save}>
            {isEdit ? "Save changes" : "Create product"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ---------- helpers ---------- */

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12.5px] font-medium flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11.5px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ImageBlock({ url, onChange }: { url: string; onChange: (u: string) => void }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "w-24 h-24 rounded-lg border border-border bg-surface flex items-center justify-center overflow-hidden shrink-0 relative group",
        )}
      >
        {url ? (
          <>
            <img src={url} alt="Cover" className="w-full h-full object-cover" />
            <button
              onClick={() => onChange("")}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-background/90 border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove image"
            >
              <X className="w-3 h-3" />
            </button>
          </>
        ) : (
          <ImageIcon className="w-6 h-6 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 space-y-1.5 min-w-0">
        <Label className="text-[12.5px] font-medium">Cover image</Label>
        <Input
          value={url}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="text-[12.5px]"
        />
        <p className="text-[11px] text-muted-foreground">Paste a public image URL.</p>
      </div>
    </div>
  );
}

function VariantCard({
  index,
  variant,
  onChange,
  onRemove,
}: {
  index: number;
  variant: Omit<ProductVariant, "id">;
  onChange: (patch: Partial<Omit<ProductVariant, "id">>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="font-mono text-[10.5px]">
          Variant #{index + 1}
        </Badge>
        <button
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive p-1"
          aria-label="Remove variant"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Edition">
          <Input
            value={variant.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Hardcover"
          />
        </Field>
        <Field label="SKU">
          <Input
            value={variant.sku}
            onChange={(e) => onChange({ sku: e.target.value })}
            placeholder="AAM-HC"
            className="font-mono"
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Price (₹)">
          <Input
            type="number"
            inputMode="decimal"
            value={variant.price || ""}
            onChange={(e) => onChange({ price: parseFloat(e.target.value) || 0 })}
          />
        </Field>
        <Field label="Stock">
          <Input
            type="number"
            inputMode="numeric"
            value={variant.stock || ""}
            onChange={(e) => onChange({ stock: parseInt(e.target.value) || 0 })}
          />
        </Field>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <Field label="Weight (g)">
          <Input
            type="number"
            inputMode="numeric"
            value={variant.weightGrams || ""}
            onChange={(e) => onChange({ weightGrams: parseInt(e.target.value) || 0 })}
          />
        </Field>
        <Field label="L (cm)">
          <Input
            type="number"
            inputMode="decimal"
            value={variant.lengthCm || ""}
            onChange={(e) => onChange({ lengthCm: parseFloat(e.target.value) || 0 })}
          />
        </Field>
        <Field label="W (cm)">
          <Input
            type="number"
            inputMode="decimal"
            value={variant.widthCm || ""}
            onChange={(e) => onChange({ widthCm: parseFloat(e.target.value) || 0 })}
          />
        </Field>
        <Field label="H (cm)">
          <Input
            type="number"
            inputMode="decimal"
            value={variant.heightCm || ""}
            onChange={(e) => onChange({ heightCm: parseFloat(e.target.value) || 0 })}
          />
        </Field>
      </div>
    </div>
  );
}

function OptionCard({
  index,
  option,
  onChange,
  onRemove,
}: {
  index: number;
  option: ProductOption;
  onChange: (patch: Partial<ProductOption>) => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState("");
  function addValue() {
    const v = draft.trim();
    if (!v) return;
    if (option.values.includes(v)) return;
    onChange({ values: [...option.values, v] });
    setDraft("");
  }
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
          Option {index + 1}
        </span>
        <button
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive p-1"
          aria-label="Remove option"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <Input
        value={option.name}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder="Size"
      />
      <div className="flex flex-wrap gap-1.5">
        {option.values.map((v) => (
          <Badge key={v} variant="secondary" className="gap-1 font-normal">
            {v}
            <button
              onClick={() => onChange({ values: option.values.filter((x) => x !== v) })}
              aria-label={`Remove ${v}`}
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addValue();
            }
          }}
          placeholder="Add value"
        />
        <Button variant="outline" size="sm" onClick={addValue}>
          Add
        </Button>
      </div>
    </div>
  );
}
