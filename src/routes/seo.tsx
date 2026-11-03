import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Wand2, CheckCircle2, AlertTriangle, Search } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { useProducts, productsActions } from "@/lib/products-store";
import { auditProduct, autoFix, seoScore } from "@/lib/seo";

export const Route = createFileRoute("/seo")({
  component: SeoPage,
  head: () => ({
    meta: [
      { title: "SEO Autopilot — Store Management" },
      { name: "description", content: "Automatically fix search titles, descriptions, URLs and image alt text" },
      { property: "og:title", content: "SEO Autopilot — Store Management" },
      { property: "og:description", content: "Automatically fix search titles, descriptions, URLs and image alt text" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function SeoPage() {
  const products = useProducts();
  const [autopilot, setAutopilot] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  // Autopilot: whenever products change, silently fill any fixable gaps.
  useEffect(() => {
    if (!autopilot) return;
    for (const p of products) {
      const patch = autoFix(p);
      if (Object.keys(patch).length) productsActions.updateProduct(p.id, patch);
    }
  }, [autopilot, products]);

  const avg = products.length ? Math.round(products.reduce((a, p) => a + seoScore(p), 0) / products.length) : 100;
  const totalIssues = products.reduce((a, p) => a + auditProduct(p).length, 0);

  function fixAll() {
    let n = 0;
    for (const p of products) {
      const patch = autoFix(p);
      n += Object.keys(patch).length;
      if (Object.keys(patch).length) productsActions.updateProduct(p.id, patch);
    }
    toast.success(n ? `Fixed ${n} issues` : "Nothing to fix");
  }

  return (
    <AdminShell title="SEO Autopilot" subtitle="Help customers find you on Google">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-lg bg-card border border-border p-5">
          <p className="text-[12px] text-muted-foreground">Store SEO score</p>
          <p className="text-[32px] font-semibold tabular-nums text-foreground">{avg}<span className="text-[14px] text-muted-foreground">/100</span></p>
          <div className="h-1.5 rounded-full bg-surface mt-2"><div className="h-full rounded-full bg-foreground" style={{ width: `${avg}%` }} /></div>
        </div>
        <div className="rounded-lg bg-card border border-border p-5">
          <p className="text-[12px] text-muted-foreground">Open issues</p>
          <p className="text-[32px] font-semibold tabular-nums text-foreground">{totalIssues}</p>
          <button onClick={fixAll} className="mt-1 inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-foreground text-background text-[13px] font-medium">
            <Wand2 className="w-4 h-4" /> Fix all now
          </button>
        </div>
        <div className="rounded-lg bg-card border border-border p-5">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-foreground">Autopilot</p>
            <button onClick={() => { setAutopilot(!autopilot); toast.success(autopilot ? "Autopilot off" : "Autopilot on"); }} aria-pressed={autopilot}
              className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${autopilot ? "bg-foreground" : "bg-surface"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-card border border-border transition-transform ${autopilot ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
          <p className="text-[12px] text-muted-foreground mt-2">
            When on, new and edited products automatically get a search title, description, clean URL and image alt text. Product descriptions still need your words.
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-card border border-border overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-border">
          <h3 className="text-[13px] font-medium text-foreground">Products</h3>
        </div>
        <ul className="divide-y divide-border">
          {products.map((p) => {
            const issues = auditProduct(p);
            const score = seoScore(p);
            const open = openId === p.id;
            return (
              <li key={p.id}>
                <button onClick={() => setOpenId(open ? null : p.id)} className="w-full flex items-center gap-3 px-4 sm:px-6 py-3 text-left hover:bg-accent/50">
                  {issues.length ? <AlertTriangle className="w-4 h-4 text-warning shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-success shrink-0" />}
                  <span className="flex-1 min-w-0 text-[13px] text-foreground truncate">{p.name}</span>
                  <span className="text-[12px] text-muted-foreground">{issues.length} issues</span>
                  <span className="w-10 text-right text-[13px] font-medium tabular-nums text-foreground">{score}</span>
                </button>
                {open && (
                  <div className="px-4 sm:px-6 pb-4 space-y-3">
                    <div className="rounded-md border border-border p-3">
                      <p className="text-[11px] text-muted-foreground mb-1 inline-flex items-center gap-1"><Search className="w-3 h-3" /> Google preview</p>
                      <p className="text-[12px] text-muted-foreground truncate">yourstore.com/products/{p.slug || "…"}</p>
                      <p className="text-[15px] text-info truncate">{p.seoTitle || p.name}</p>
                      <p className="text-[12px] text-muted-foreground line-clamp-2">{p.seoDescription || "No description — Google will pick random text."}</p>
                    </div>
                    {issues.length > 0 && (
                      <ul className="space-y-1">
                        {issues.map((i) => <li key={i.key} className="text-[12px] text-foreground">• {i.label}</li>)}
                      </ul>
                    )}
                    {issues.some((i) => i.key !== "productDesc") && (
                      <button onClick={() => { productsActions.updateProduct(p.id, autoFix(p)); toast.success("Fixed"); }} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border text-[12px] text-foreground">
                        <Wand2 className="w-3.5 h-3.5" /> Auto-fix this product
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </AdminShell>
  );
}
