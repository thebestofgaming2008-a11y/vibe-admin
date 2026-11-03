import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Layers, Sparkles, Trash2, Eye, EyeOff, X } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { useProducts } from "@/lib/products-store";
import {
  useCollections, collectionsActions, productsInCollection, ruleLabels,
  type Collection, type CollectionRule, type RuleField,
} from "@/lib/collections-store";

export const Route = createFileRoute("/collections")({
  component: CollectionsPage,
  head: () => ({
    meta: [
      { title: "Collections — Store Management" },
      { name: "description", content: "Group products into manual or automatic collections" },
      { property: "og:title", content: "Collections — Store Management" },
      { property: "og:description", content: "Group products into manual or automatic collections" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const inputCls = "w-full h-10 px-3 rounded-md bg-card border border-border text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring";

function CollectionsPage() {
  const collections = useCollections();
  const products = useProducts();
  const [editing, setEditing] = useState<Collection | "new" | null>(null);

  return (
    <AdminShell title="Collections" subtitle={`${collections.length} collections`}>
      <div className="flex justify-end">
        <button onClick={() => setEditing("new")} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-foreground text-background text-[13px] font-medium hover:bg-foreground/90">
          <Plus className="w-4 h-4" /> New collection
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {collections.map((c) => {
          const items = productsInCollection(c, products);
          return (
            <button key={c.id} onClick={() => setEditing(c)} className="text-left rounded-lg bg-card border border-border p-5 hover:border-foreground/30 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="w-9 h-9 rounded-md bg-surface flex items-center justify-center">
                  {c.type === "smart" ? <Sparkles className="w-4 h-4 text-muted-foreground" /> : <Layers className="w-4 h-4 text-muted-foreground" />}
                </div>
                <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                  {c.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {c.visible ? "Visible" : "Hidden"}
                </span>
              </div>
              <h3 className="mt-3 text-[14px] font-medium text-foreground">{c.name}</h3>
              <p className="text-[12px] text-muted-foreground line-clamp-2 min-h-[2.5em]">{c.description || "No description"}</p>
              <div className="mt-3 flex items-center justify-between text-[12px]">
                <span className="text-foreground tabular-nums">{items.length} products</span>
                <span className="text-muted-foreground">{c.type === "smart" ? "Automatic" : "Manual"}</span>
              </div>
            </button>
          );
        })}
      </div>

      {editing && (
        <CollectionEditor
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </AdminShell>
  );
}

function CollectionEditor({ initial, onClose }: { initial: Collection | null; onClose: () => void }) {
  const products = useProducts();
  const [draft, setDraft] = useState<Omit<Collection, "id" | "createdAt">>(
    initial ?? { name: "", description: "", type: "smart", productIds: [], rules: [{ field: "category", value: "" }], match: "all", visible: true },
  );
  const set = (p: Partial<typeof draft>) => setDraft((d) => ({ ...d, ...p }));
  const preview = productsInCollection({ ...draft, id: "x", createdAt: "" }, products);

  function save() {
    if (!draft.name.trim()) return toast.error("Give the collection a name");
    if (initial) collectionsActions.update(initial.id, draft);
    else collectionsActions.add(draft);
    toast.success("Collection saved");
    onClose();
  }

  const updateRule = (i: number, r: Partial<CollectionRule>) =>
    set({ rules: draft.rules.map((x, j) => (j === i ? { ...x, ...r } : x)) });

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg h-full bg-background border-l border-border flex flex-col animate-fade-in">
        <div className="flex items-center justify-between px-5 h-14 border-b border-border">
          <h2 className="text-[14px] font-medium text-foreground">{initial ? "Edit collection" : "New collection"}</h2>
          <button onClick={onClose} aria-label="Close" className="p-1 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <label className="block">
            <span className="block text-[12px] text-muted-foreground mb-1.5">Name</span>
            <input className={inputCls} value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Summer reads" />
          </label>
          <label className="block">
            <span className="block text-[12px] text-muted-foreground mb-1.5">Description</span>
            <textarea className={`${inputCls} h-20 py-2`} value={draft.description} onChange={(e) => set({ description: e.target.value })} />
          </label>

          <div>
            <span className="block text-[12px] text-muted-foreground mb-1.5">How are products added?</span>
            <div className="grid grid-cols-2 gap-2">
              {(["smart", "manual"] as const).map((t) => (
                <button key={t} onClick={() => set({ type: t })} className={`rounded-md border p-3 text-left ${draft.type === t ? "border-foreground bg-accent" : "border-border"}`}>
                  <p className="text-[13px] font-medium text-foreground">{t === "smart" ? "Automatic" : "Manual"}</p>
                  <p className="text-[11px] text-muted-foreground">{t === "smart" ? "Products matching rules join by themselves" : "Pick products one by one"}</p>
                </button>
              ))}
            </div>
          </div>

          {draft.type === "smart" ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                Products must match
                <select className="h-8 px-2 rounded-md bg-card border border-border text-foreground" value={draft.match} onChange={(e) => set({ match: e.target.value as "all" | "any" })}>
                  <option value="all">all rules</option>
                  <option value="any">any rule</option>
                </select>
              </div>
              {draft.rules.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <select className={`${inputCls} flex-1`} value={r.field} onChange={(e) => updateRule(i, { field: e.target.value as RuleField })}>
                    {Object.entries(ruleLabels).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                  {r.field !== "in_stock" && r.field !== "on_sale" && (
                    <input className={`${inputCls} flex-1`} value={r.value} onChange={(e) => updateRule(i, { value: e.target.value })} placeholder="Value" />
                  )}
                  <button onClick={() => set({ rules: draft.rules.filter((_, j) => j !== i) })} className="px-2 text-muted-foreground hover:text-destructive" aria-label="Remove rule"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              <button onClick={() => set({ rules: [...draft.rules, { field: "tag", value: "" }] })} className="text-[12px] text-foreground inline-flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add rule</button>
            </div>
          ) : (
            <ul className="rounded-md border border-border divide-y divide-border">
              {products.map((p) => {
                const on = draft.productIds.includes(p.id);
                return (
                  <li key={p.id}>
                    <label className="flex items-center gap-3 px-3 py-2.5 cursor-pointer">
                      <input type="checkbox" checked={on} onChange={() => set({ productIds: on ? draft.productIds.filter((x) => x !== p.id) : [...draft.productIds, p.id] })} />
                      <span className="text-[13px] text-foreground flex-1">{p.name}</span>
                      <span className="text-[11px] text-muted-foreground">{p.category}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}

          <label className="flex items-center justify-between">
            <span className="text-[13px] text-foreground">Show on store</span>
            <input type="checkbox" checked={draft.visible} onChange={(e) => set({ visible: e.target.checked })} />
          </label>

          <div className="rounded-md bg-surface p-3">
            <p className="text-[12px] text-muted-foreground mb-1">{preview.length} products in this collection</p>
            <p className="text-[12px] text-foreground">{preview.map((p) => p.name).join(", ") || "—"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-4 border-t border-border">
          {initial && (
            <button onClick={() => { collectionsActions.remove(initial.id); toast.success("Collection deleted"); onClose(); }} className="h-10 px-3 rounded-md text-[13px] text-destructive hover:bg-accent">Delete</button>
          )}
          <div className="flex-1" />
          <button onClick={onClose} className="h-10 px-4 rounded-md border border-border text-[13px] text-foreground">Cancel</button>
          <button onClick={save} className="h-10 px-4 rounded-md bg-foreground text-background text-[13px] font-medium">Save</button>
        </div>
      </div>
    </div>
  );
}
