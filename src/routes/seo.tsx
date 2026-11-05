import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  RefreshCw, CheckCircle2, AlertTriangle, AlertOctagon, Lightbulb, Globe, Plug, ShieldCheck,
  ChevronRight, FileText, Clock, Eye, X, Check, History, Sparkles, ListTodo, Search,
  Wrench, BarChart3, FileBarChart, CircleCheck, CircleDot, Circle, Minus, ArrowUpRight,
  Download, Target, BookOpen, Link2,
} from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { TrendChart } from "@/components/admin/TrendChart";
import type { DayPoint } from "@/lib/orders-store";
import { useProducts, productsActions, type Product } from "@/lib/products-store";
import { auditProduct, suggestTitle, suggestDescription, suggestAlt, slugify } from "@/lib/seo";

export const Route = createFileRoute("/seo")({
  component: SeoPage,
  head: () => ({
    meta: [
      { title: "SEO Autopilot — Store Management" },
      { name: "description", content: "Review evidence-backed SEO findings, approve safe fixes and verify the result." },
      { property: "og:title", content: "SEO Autopilot — Store Management" },
      { property: "og:description", content: "Review evidence-backed SEO findings, approve safe fixes and verify the result." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

/* ---------- types ---------- */
type Severity = "error" | "warning" | "opportunity";
type Basis = "Observed" | "Rule-based" | "AI suggestion";
type FixState = "open" | "approved" | "verifying" | "verified" | "dismissed";
interface Change { field: string; before: string; after: string }
interface Finding {
  id: string;
  severity: Severity;
  title: string;
  where: string;
  affected: number;
  why: string;
  evidence: string;
  source: string;
  basis: Basis;
  action: string;
  safe: boolean; // can be applied with one approval
  needsHuman?: boolean;
  changes?: Change[];
  productId?: string;
  patch?: Partial<Product>;
}
interface LogEntry { at: string; text: string; kind: "applied" | "verified" | "dismissed" | "scan" }

const DOMAIN = "yourstore.com";
const sevMeta: Record<Severity, { label: string; icon: typeof AlertOctagon; cls: string }> = {
  error: { label: "Error", icon: AlertOctagon, cls: "text-destructive" },
  warning: { label: "Warning", icon: AlertTriangle, cls: "text-warning" },
  opportunity: { label: "Opportunity", icon: Lightbulb, cls: "text-info" },
};

/* Sample site-level findings: illustrate what a public crawl would report. */
const crawlFindings: Finding[] = [
  {
    id: "c-sitemap", severity: "error", title: "Sitemap lists 4 pages that return 404",
    where: "/sitemap.xml", affected: 4,
    why: "Search engines waste crawl effort on dead links and may trust the sitemap less.",
    evidence: "4 of 38 sitemap URLs responded 404 Not Found.", source: "Public crawl", basis: "Observed",
    action: "Remove the dead URLs from the sitemap or redirect them to the closest live product.", safe: false,
  },
  {
    id: "c-canonical", severity: "warning", title: "Collection filters create duplicate pages",
    where: "/collections/books?sort=…", affected: 12,
    why: "Sorted/filtered versions compete with the main collection page in search.",
    evidence: "12 parameter URLs have no canonical tag pointing to /collections/books.", source: "Public crawl", basis: "Observed",
    action: "Add a canonical tag on filtered views. Needs a developer or platform setting.", safe: false,
  },
  {
    id: "c-schema", severity: "opportunity", title: "Product pages have no product structured data",
    where: "/products/*", affected: 3,
    why: "Structured data makes products eligible for price and stock details in Google results. Eligibility only — not guaranteed.",
    evidence: "No Product JSON-LD detected on sampled product pages.", source: "Public crawl", basis: "Rule-based",
    action: "Add Product schema with name, price, currency and availability from the catalog.", safe: false,
  },
];

function buildCatalogFindings(products: Product[]): Finding[] {
  const out: Finding[] = [];
  for (const p of products) {
    for (const i of auditProduct(p)) {
      const url = `/products/${p.slug || slugify(p.name)}`;
      if (i.key === "title") {
        const after = suggestTitle(p);
        out.push({ id: `${p.id}-title`, severity: p.seoTitle ? "warning" : "error", title: p.seoTitle ? "Search title is too short or too long" : "Missing search title",
          where: url, affected: 1, productId: p.id,
          why: "Google uses this as the clickable headline. Without one it guesses from page text.",
          evidence: p.seoTitle ? `Current title is ${p.seoTitle.length} characters.` : "No <title> set for this product.",
          source: "Store catalog", basis: "Rule-based", action: "Use a title built from the product name and author.",
          safe: true, changes: [{ field: "Search title", before: p.seoTitle || "—", after }], patch: { seoTitle: after } });
      }
      if (i.key === "description") {
        const after = suggestDescription(p);
        out.push({ id: `${p.id}-desc`, severity: "warning", title: "Search description missing or off-length",
          where: url, affected: 1, productId: p.id,
          why: "A clear snippet helps shoppers decide to click. Google may still rewrite it.",
          evidence: p.seoDescription ? `Current description is ${p.seoDescription.length} characters.` : "No meta description set.",
          source: "Store catalog", basis: "AI suggestion", action: "Draft built only from your product text, formats and price.",
          safe: true, changes: [{ field: "Search description", before: p.seoDescription || "—", after }], patch: { seoDescription: after } });
      }
      if (i.key === "slug") {
        const after = slugify(p.slug || p.name);
        out.push({ id: `${p.id}-slug`, severity: "warning", title: "Product URL is not set",
          where: p.name, affected: 1, productId: p.id,
          why: "Readable URLs are easier to share. Changing a live URL needs a redirect, so this needs review.",
          evidence: "No URL handle saved for this product.", source: "Store catalog", basis: "Rule-based",
          action: "Set a clean URL. If the page is already live, add a redirect from the old one.",
          safe: false, changes: [{ field: "URL", before: p.slug || "—", after: `/products/${after}` }], patch: { slug: after } });
      }
      if (i.key === "alt") {
        const after = suggestAlt(p);
        out.push({ id: `${p.id}-alt`, severity: "opportunity", title: "Product image has no alt text",
          where: url, affected: 1, productId: p.id,
          why: "Helps screen-reader users and image search understand the photo.",
          evidence: "Main image alt attribute is empty.", source: "Store catalog", basis: "Rule-based",
          action: "Describe the image using the product name and type.",
          safe: true, changes: [{ field: "Image alt text", before: "—", after }], patch: { imageAlt: after } });
      }
      if (i.key === "productDesc") {
        out.push({ id: `${p.id}-pdesc`, severity: "warning", title: "Product description is thin",
          where: url, affected: 1, productId: p.id,
          why: "Shoppers and search engines need real detail: what it is, who it's for, formats, size.",
          evidence: `Description is ${(p.description ?? "").length} characters.`, source: "Store catalog", basis: "Rule-based",
          action: "Write it yourself, or open a content brief in the Content tab.", safe: false, needsHuman: true });
      }
    }
  }
  return out;
}

const sources = [
  { name: "Public crawl", state: "Connected" },
  { name: "Store catalog", state: "Connected" },
  { name: "Search Console", state: "Not connected" },
  { name: "Google Analytics", state: "Not connected" },
  { name: "Bing Webmaster", state: "Not connected" },
  { name: "PageSpeed", state: "Needs access" },
] as const;

const now = () => new Date().toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/* ---------- technical audit (sample crawl results) ---------- */
type CheckStatus = "pass" | "warn" | "fail" | "locked";
interface TechCheck { name: string; detail: string; status: CheckStatus; note?: string }
interface TechGroup { label: string; checks: TechCheck[] }

const techGroups: TechGroup[] = [
  {
    label: "Crawlability & indexing",
    checks: [
      { name: "robots.txt", detail: "Allows crawling of all public pages", status: "pass" },
      { name: "XML sitemap", detail: "Found, but lists 4 dead URLs", status: "fail", note: "4 URLs return 404" },
      { name: "Canonical tags", detail: "Missing on 12 filtered collection URLs", status: "warn" },
      { name: "Indexation", detail: "34 of 38 URLs indexable", status: "warn", note: "4 blocked by noindex" },
      { name: "Redirects", detail: "2 redirect chains longer than 2 hops", status: "warn" },
    ],
  },
  {
    label: "Performance",
    checks: [
      { name: "Largest Contentful Paint", detail: "Needs PageSpeed access to measure", status: "locked" },
      { name: "Cumulative Layout Shift", detail: "Needs PageSpeed access to measure", status: "locked" },
      { name: "Image weight", detail: "6 product images over 500 KB", status: "warn" },
      { name: "Mobile friendly", detail: "All sampled pages pass viewport checks", status: "pass" },
    ],
  },
  {
    label: "Structured data",
    checks: [
      { name: "Product schema", detail: "Not detected on product pages", status: "fail", note: "Eligible for price/stock in results" },
      { name: "Organization schema", detail: "Present on homepage", status: "pass" },
      { name: "Breadcrumb schema", detail: "Present on 31 of 38 pages", status: "warn" },
    ],
  },
  {
    label: "Security & links",
    checks: [
      { name: "HTTPS everywhere", detail: "All pages served over HTTPS", status: "pass" },
      { name: "Broken internal links", detail: "3 links point to deleted products", status: "fail" },
      { name: "Mixed content", detail: "None detected", status: "pass" },
    ],
  },
];

/* ---------- research (directional, no invented numbers) ---------- */
interface Keyword {
  phrase: string; intent: "Buy" | "Compare" | "Learn"; fit: "High" | "Medium";
  target: string; basis: string;
}
const keywords: Keyword[] = [
  { phrase: "historical fiction books india", intent: "Buy", fit: "High", target: "/collections/books", basis: "Matches 1 product + collection theme" },
  { phrase: "bilingual poetry book", intent: "Buy", fit: "High", target: "/products/whispers-of-dawn", basis: "Exact match to product format" },
  { phrase: "arabic edition novels", intent: "Buy", fit: "Medium", target: "/products/the-lost-compass", basis: "Matches Arabic Edition variant" },
  { phrase: "best thriller books 2026", intent: "Compare", fit: "Medium", target: "New blog post", basis: "Bestseller badge on Silent Tides" },
  { phrase: "17th century india novel", intent: "Learn", fit: "High", target: "/products/the-lost-compass", basis: "Matches product description" },
];

interface Gap { title: string; detail: string; effort: "Low" | "Medium" | "High" }
const contentGaps: Gap[] = [
  { title: "Collection intro: Books", detail: "2–3 sentences above the grid explaining what the collection is and who it's for.", effort: "Low" },
  { title: "Author page", detail: "One page per author with bio and their books. Builds topical authority and internal links.", effort: "Medium" },
  { title: "Gift guide post", detail: "\"Books for…\" seasonal guide linking to 3–5 products. Good for Compare-intent searches.", effort: "Medium" },
  { title: "FAQ block on product pages", detail: "Formats, shipping, language editions — answers real buyer questions and adds indexable text.", effort: "Low" },
];

/* ---------- reports (sample) ---------- */
interface Report { week: string; score: number; delta: number; fixes: number; highlight: string }
const reports: Report[] = [
  { week: "This week so far", score: 72, delta: +6, fixes: 5, highlight: "Alt text added to 3 products" },
  { week: "27 Oct – 2 Nov", score: 66, delta: +4, fixes: 3, highlight: "Fixed 2 broken internal links" },
  { week: "20 – 26 Oct", score: 62, delta: +9, fixes: 7, highlight: "Search titles set on all products" },
  { week: "13 – 19 Oct", score: 53, delta: 0, fixes: 0, highlight: "First full scan completed" },
];

/* deterministic 30-day demo series for the analytics charts */
function demoSeries(): DayPoint[] {
  const out: DayPoint[] = [];
  const t = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(t);
    d.setDate(d.getDate() - i);
    const wave = Math.sin(i / 4) * 4;
    out.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString([], { day: "numeric", month: "short" }),
      // visitors = health score, orders = fixes applied, revenue = issues found
      visitors: Math.round(58 + (29 - i) * 0.5 + wave),
      orders: Math.max(0, Math.round(1.5 + Math.sin(i / 2.5) * 1.5)),
      revenue: Math.max(0, Math.round(14 - (29 - i) * 0.25 + wave)),
    });
  }
  return out;
}

/* ---------- page ---------- */
function SeoPage() {
  const products = useProducts();
  const [tab, setTab] = useState("overview");
  const [state, setState] = useState<Record<string, FixState>>({});
  const [frozen, setFrozen] = useState<Record<string, Finding>>({});
  const [log, setLog] = useState<LogEntry[]>([{ at: now(), text: `Scan finished · 38 URLs, 3 products`, kind: "scan" }]);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState(now());
  const [review, setReview] = useState<Finding[] | null>(null);
  const [detail, setDetail] = useState<Finding | null>(null);
  const [sevFilter, setSevFilter] = useState<Severity | "all">("all");
  const [done, setDone] = useState<Record<string, boolean>>({});
  const series = useMemo(demoSeries, []);

  const live = useMemo(() => [...crawlFindings, ...buildCatalogFindings(products)], [products]);
  // keep findings that were applied (they disappear from live audit) so the queue can show them
  const all = useMemo(() => {
    const ids = new Set(live.map((f) => f.id));
    return [...live, ...Object.values(frozen).filter((f) => !ids.has(f.id))];
  }, [live, frozen]);
  const st = (f: Finding): FixState => state[f.id] ?? "open";
  const open = all.filter((f) => st(f) === "open");
  const count = (s: Severity) => open.filter((f) => f.severity === s).length;
  const passed = products.length * 5 + 9 - buildCatalogFindings(products).length;
  const score = Math.max(0, Math.min(100, 100 - count("error") * 8 - count("warning") * 3 - count("opportunity")));

  const addLog = (text: string, kind: LogEntry["kind"]) => setLog((l) => [{ at: now(), text, kind }, ...l]);

  function apply(list: Finding[]) {
    const next = { ...state };
    const fr = { ...frozen };
    for (const f of list) {
      if (f.productId && f.patch) productsActions.updateProduct(f.productId, f.patch);
      next[f.id] = "verifying";
      fr[f.id] = f;
      addLog(`Applied: ${f.title} (${f.where})`, "applied");
    }
    setState(next);
    setFrozen(fr);
    setReview(null);
    setDetail(null);
    toast.success(`${list.length} change${list.length > 1 ? "s" : ""} applied — verifying on next scan`);
  }

  function dismiss(f: Finding) {
    setState((s) => ({ ...s, [f.id]: "dismissed" }));
    addLog(`Dismissed: ${f.title}`, "dismissed");
    setDetail(null);
  }

  function runScan() {
    setScanning(true);
    setTimeout(() => {
      const toVerify = all.filter((f) => st(f) === "verifying");
      setState((s) => {
        const n = { ...s };
        toVerify.forEach((f) => (n[f.id] = "verified"));
        return n;
      });
      toVerify.forEach((f) => addLog(`Verified live: ${f.title}`, "verified"));
      addLog(`Scan finished · 38 URLs, ${products.length} products`, "scan");
      setLastScan(now());
      setScanning(false);
      toast.success(toVerify.length ? `Scan complete · ${toVerify.length} change(s) verified` : "Scan complete");
    }, 1600);
  }

  const safeBatch = open.filter((f) => f.safe);

  /* to-do list: top findings become tasks, plus standing routines */
  const tasks = useMemo(() => {
    const fromFindings = [...open].sort((a, b) => order(a) - order(b)).slice(0, 5).map((f) => ({
      id: `t-${f.id}`, title: f.title, detail: f.where, priority: f.severity === "error" ? "High" : f.severity === "warning" ? "Medium" : "Low",
      source: "Autopilot", finding: f,
    }));
    const standing = [
      { id: "t-gsc", title: "Connect Search Console", detail: "Unlocks real clicks, impressions and positions", priority: "High", source: "Autopilot", finding: null },
      { id: "t-intro", title: "Write the Books collection intro", detail: "Brief is ready in the Content tab", priority: "Medium", source: "Autopilot", finding: null },
      { id: "t-weekly", title: "Review this week's scan", detail: "Every Monday · 5 min", priority: "Low", source: "Routine", finding: null },
      { id: "t-new", title: "Check new products for missing SEO fields", detail: "Runs after every catalog change", priority: "Low", source: "Routine", finding: null },
    ];
    return [...fromFindings, ...standing];
  }, [open]);

  const tabs = [
    ["overview", "Overview"], ["todo", "To-do"], ["findings", "Findings"], ["queue", "Fix queue"],
    ["technical", "Technical"], ["research", "Research"], ["content", "Content"],
    ["analytics", "Analytics"], ["reports", "Reports"], ["settings", "Settings"],
  ] as const;

  return (
    <AdminShell title="SEO Autopilot" subtitle="Find, fix and verify what helps shoppers find you">
      {/* store header */}
      <div className="rounded-lg bg-card border border-border p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-md bg-surface flex items-center justify-center shrink-0"><Globe className="w-4 h-4 text-muted-foreground" /></div>
            <div className="min-w-0">
              <p className="text-[14px] font-medium text-foreground truncate">{DOMAIN}</p>
              <p className="text-[12px] text-muted-foreground">Last scan {lastScan} · 38 public URLs · {products.length} catalog products</p>
            </div>
          </div>
          <button onClick={runScan} disabled={scanning}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-foreground text-background text-[13px] font-medium disabled:opacity-60">
            <RefreshCw className={`w-4 h-4 ${scanning ? "animate-spin" : ""}`} /> {scanning ? "Scanning…" : "Run scan"}
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-4">
          {sources.map((s) => (
            <span key={s.name} className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full border border-border text-[11px] text-muted-foreground">
              <span className={`w-1.5 h-1.5 rounded-full ${s.state === "Connected" ? "bg-success" : s.state === "Needs access" ? "bg-warning" : "bg-border"}`} />
              {s.name} <span className="text-foreground/60">· {s.state}</span>
            </span>
          ))}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="overflow-x-auto -mx-1 px-1">
          <TabsList>
            {tabs.map(([v, l]) => (
              <TabsTrigger key={v} value={v}>
                {l}
                {v === "findings" && open.length > 0 && <span className="ml-1.5 text-[11px] tabular-nums text-muted-foreground">{open.length}</span>}
                {v === "todo" && tasks.filter((t) => !done[t.id]).length > 0 && <span className="ml-1.5 text-[11px] tabular-nums text-muted-foreground">{tasks.filter((t) => !done[t.id]).length}</span>}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Panel title="Store health" className="lg:col-span-1">
              <div className="p-5 flex items-center gap-5">
                <ScoreRing score={score} />
                <div className="space-y-1.5 text-[12px]">
                  <p className="flex items-center gap-2 text-foreground"><span className="w-1.5 h-1.5 rounded-full bg-destructive" />{count("error")} errors</p>
                  <p className="flex items-center gap-2 text-foreground"><span className="w-1.5 h-1.5 rounded-full bg-warning" />{count("warning")} warnings</p>
                  <p className="flex items-center gap-2 text-foreground"><span className="w-1.5 h-1.5 rounded-full bg-info" />{count("opportunity")} opportunities</p>
                  <p className="flex items-center gap-2 text-foreground"><span className="w-1.5 h-1.5 rounded-full bg-success" />{passed} checks passed</p>
                </div>
              </div>
              <p className="px-5 pb-4 text-[11px] text-muted-foreground">Score reflects open findings only. It is not a Google ranking metric.</p>
            </Panel>

            <Panel title="Next best actions" className="lg:col-span-2">
              {open.length === 0 ? <Empty text="Nothing open. Run a scan after your next catalog change." /> : (
                <ul className="divide-y divide-border">
                  {[...open].sort((a, b) => order(a) - order(b)).slice(0, 5).map((f) => (
                    <FindingRow key={f.id} f={f} onClick={() => setDetail(f)} />
                  ))}
                </ul>
              )}
              {safeBatch.length > 0 && (
                <div className="px-4 sm:px-5 py-3 border-t border-border flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-[12px] text-muted-foreground">{safeBatch.length} safe, reversible fixes ready</p>
                  <button onClick={() => setReview(safeBatch)} className="h-8 px-3 rounded-md border border-border text-[12px] text-foreground inline-flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> Review batch
                  </button>
                </div>
              )}
            </Panel>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Panel title="Google search performance" className="lg:col-span-2">
              <div className="p-5 text-center">
                <Plug className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-[13px] text-foreground">No search data yet</p>
                <p className="text-[12px] text-muted-foreground mt-1">Connect Search Console to see real clicks, impressions and positions. We never show estimated traffic.</p>
                <button onClick={() => setTab("settings")} className="mt-3 h-8 px-3 rounded-md border border-border text-[12px] text-foreground">Connect</button>
              </div>
            </Panel>
            <Panel title="Recent activity">
              <ActivityList log={log.slice(0, 6)} />
            </Panel>
          </div>
        </TabsContent>

        {/* TO-DO */}
        <TabsContent value="todo" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Open tasks" value={tasks.filter((t) => !done[t.id]).length} tone="text-info" />
            <Stat label="High priority" value={tasks.filter((t) => !done[t.id] && t.priority === "High").length} tone="text-destructive" />
            <Stat label="Done this session" value={Object.values(done).filter(Boolean).length} tone="text-success" />
            <Stat label="From autopilot" value={tasks.filter((t) => t.source === "Autopilot").length} tone="text-foreground" />
          </div>
          <Panel title="Task list">
            <ul className="divide-y divide-border">
              {tasks.map((t) => {
                const isDone = !!done[t.id];
                return (
                  <li key={t.id} className="px-4 sm:px-5 py-3 flex items-start gap-3">
                    <button
                      onClick={() => {
                        setDone((d) => ({ ...d, [t.id]: !d[t.id] }));
                        if (!isDone) addLog(`Task done: ${t.title}`, "applied");
                      }}
                      className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label={isDone ? "Mark not done" : "Mark done"}
                    >
                      {isDone ? <CircleCheck className="w-4.5 h-4.5 text-success" /> : <Circle className="w-4.5 h-4.5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] ${isDone ? "text-muted-foreground line-through decoration-muted-foreground/50" : "text-foreground"}`}>{t.title}</p>
                      <p className="text-[12px] text-muted-foreground truncate">{t.detail}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[11px] ${t.priority === "High" ? "text-destructive" : t.priority === "Medium" ? "text-warning" : "text-muted-foreground"}`}>{t.priority}</span>
                      <span className="hidden sm:inline text-[11px] text-muted-foreground border border-border rounded px-1.5 py-0.5">{t.source}</span>
                      {t.finding && (
                        <button onClick={() => setDetail(t.finding)} className="text-[12px] text-foreground underline underline-offset-2">Open</button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
          <p className="text-[11px] text-muted-foreground">Tasks regenerate from each scan. Checking one off here doesn't change the site — apply fixes from Findings.</p>
        </TabsContent>

        {/* FINDINGS */}
        <TabsContent value="findings" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-1.5">
            {(["all", "error", "warning", "opportunity"] as const).map((s) => (
              <button key={s} onClick={() => setSevFilter(s)}
                className={`h-8 px-3 rounded-md text-[12px] border ${sevFilter === s ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground"}`}>
                {s === "all" ? `All · ${open.length}` : `${sevMeta[s].label}s · ${count(s)}`}
              </button>
            ))}
          </div>
          <Panel title={`Scan from ${lastScan}`}>
            {open.filter((f) => sevFilter === "all" || f.severity === sevFilter).length === 0 ? <Empty text="No findings in this group." /> : (
              <ul className="divide-y divide-border">
                {open.filter((f) => sevFilter === "all" || f.severity === sevFilter).sort((a, b) => order(a) - order(b)).map((f) => (
                  <FindingRow key={f.id} f={f} onClick={() => setDetail(f)} showSource />
                ))}
              </ul>
            )}
          </Panel>
          <p className="text-[11px] text-muted-foreground">Site-wide findings are sample results that show how a public crawl would report. Catalog findings come from your products.</p>
        </TabsContent>

        {/* FIX QUEUE */}
        <TabsContent value="queue" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Lane title="Fix now" hint="Safe and reversible" items={open.filter((f) => f.safe)} onOpen={setDetail}
              action={safeBatch.length ? <button onClick={() => setReview(safeBatch)} className="text-[12px] text-foreground underline underline-offset-2">Review all</button> : null} />
            <Lane title="Needs your review" hint="Changes URLs, facts or your words" items={open.filter((f) => !f.safe && f.source === "Store catalog")} onOpen={setDetail} />
            <Lane title="Waiting for platform access" hint="Needs a developer or store setting" items={open.filter((f) => f.source === "Public crawl")} onOpen={setDetail} />
            <Lane title="Applied" hint="Verified on the next scan" items={all.filter((f) => st(f) === "verifying" || st(f) === "verified")} onOpen={setDetail} statusOf={st} />
          </div>
        </TabsContent>

        {/* TECHNICAL */}
        <TabsContent value="technical" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Passed" value={techGroups.flatMap((g) => g.checks).filter((c) => c.status === "pass").length} tone="text-success" />
            <Stat label="Warnings" value={techGroups.flatMap((g) => g.checks).filter((c) => c.status === "warn").length} tone="text-warning" />
            <Stat label="Failing" value={techGroups.flatMap((g) => g.checks).filter((c) => c.status === "fail").length} tone="text-destructive" />
            <Stat label="Needs access" value={techGroups.flatMap((g) => g.checks).filter((c) => c.status === "locked").length} tone="text-muted-foreground" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {techGroups.map((g) => (
              <Panel key={g.label} title={g.label}>
                <ul className="divide-y divide-border">
                  {g.checks.map((c) => (
                    <li key={c.name} className="px-4 sm:px-5 py-3 flex items-start gap-3">
                      <CheckIcon status={c.status} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-foreground">{c.name}</p>
                        <p className="text-[12px] text-muted-foreground">{c.detail}</p>
                      </div>
                      {c.note && <span className="text-[11px] text-muted-foreground border border-border rounded px-1.5 py-0.5 shrink-0 hidden sm:inline">{c.note}</span>}
                    </li>
                  ))}
                </ul>
              </Panel>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">Sample results that show how a technical crawl would report. Connect PageSpeed in Settings to unlock speed checks.</p>
        </TabsContent>

        {/* RESEARCH */}
        <TabsContent value="research" className="space-y-4 mt-4">
          <Panel title="Keyword opportunities">
            <ul className="divide-y divide-border">
              {keywords.map((k) => (
                <li key={k.phrase} className="px-4 sm:px-5 py-3 flex items-start gap-3">
                  <Search className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-foreground">{k.phrase}</p>
                    <p className="text-[12px] text-muted-foreground">Target: {k.target} · {k.basis}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[11px] border rounded px-1.5 py-0.5 ${k.intent === "Buy" ? "text-success border-border" : "text-muted-foreground border-border"}`}>{k.intent}</span>
                    <span className="text-[11px] text-muted-foreground border border-border rounded px-1.5 py-0.5 hidden sm:inline">Fit: {k.fit}</span>
                  </div>
                </li>
              ))}
            </ul>
            <p className="px-4 sm:px-5 py-3 border-t border-border text-[11px] text-muted-foreground">
              Directional only — derived from your catalog, not search volumes. Connect Search Console to replace these with queries people actually use to find you.
            </p>
          </Panel>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Content gaps">
              <ul className="divide-y divide-border">
                {contentGaps.map((g) => (
                  <li key={g.title} className="px-4 sm:px-5 py-3 flex items-start gap-3">
                    <BookOpen className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-foreground">{g.title}</p>
                      <p className="text-[12px] text-muted-foreground">{g.detail}</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground border border-border rounded px-1.5 py-0.5 shrink-0">{g.effort} effort</span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Off-page & local">
              <ul className="divide-y divide-border">
                {[
                  { icon: Link2, t: "Google Business Profile", d: "Not linked. For a local or brand search presence, create and verify a profile." },
                  { icon: Link2, t: "Instagram link in bio", d: "Most of your buyers come from Instagram — make sure the bio link points to a fast landing page, not the homepage." },
                  { icon: Link2, t: "Directory & review listings", d: "Consistent name, address and link on 2–3 relevant directories. Quality over quantity." },
                  { icon: Link2, t: "Backlink opportunities", d: "Author interviews, book bloggers and local press are realistic link sources for this catalog." },
                ].map((r) => (
                  <li key={r.t} className="px-4 sm:px-5 py-3 flex items-start gap-3">
                    <r.icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[13px] text-foreground">{r.t}</p>
                      <p className="text-[12px] text-muted-foreground">{r.d}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </TabsContent>

        {/* CONTENT */}
        <TabsContent value="content" className="space-y-4 mt-4">
          <Panel title="Content briefs">
            <ul className="divide-y divide-border">
              {products.map((p) => <BriefRow key={p.id} p={p} />)}
              <li className="px-4 sm:px-5 py-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-foreground">Collection page: Books</p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">Short intro explaining what's in the collection and who it's for. 2–3 sentences, above the product grid.</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0">Category</span>
                </div>
              </li>
            </ul>
          </Panel>
          <p className="text-[11px] text-muted-foreground">Drafts only use facts from your catalog. Anything missing shows as a question for you — nothing is published without approval.</p>
        </TabsContent>

        {/* ANALYTICS */}
        <TabsContent value="analytics" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Health score" value={score} tone="text-info" />
            <Stat label="Fixes applied" value={log.filter((l) => l.kind === "applied").length} tone="text-success" />
            <Stat label="Verified live" value={log.filter((l) => l.kind === "verified").length} tone="text-success" />
            <Stat label="Scans run" value={log.filter((l) => l.kind === "scan").length} tone="text-foreground" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Health score · 30 days">
              <div className="p-4">
                <TrendChart data={series} dataKey="visitors" height={180} formatValue={(n) => `${n}/100`} />
              </div>
            </Panel>
            <Panel title="Issues found vs fixed · 30 days">
              <div className="p-4">
                <TrendChart data={series} dataKey="orders" height={180} variant="bar" formatValue={(n) => `${n} fixed`} />
              </div>
            </Panel>
          </div>

          <Panel title="Search traffic">
            <div className="p-5 text-center">
              <BarChart3 className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-[13px] text-foreground">Real traffic charts appear here</p>
              <p className="text-[12px] text-muted-foreground mt-1">Clicks, impressions, average position and top queries — once Search Console is connected. The charts above use demo data to show the layout.</p>
              <button onClick={() => setTab("settings")} className="mt-3 h-8 px-3 rounded-md border border-border text-[12px] text-foreground">Connect Search Console</button>
            </div>
          </Panel>
        </TabsContent>

        {/* REPORTS */}
        <TabsContent value="reports" className="space-y-4 mt-4">
          <Panel title="Weekly reports">
            <ul className="divide-y divide-border">
              {reports.map((r) => (
                <li key={r.week} className="px-4 sm:px-5 py-4 flex items-start gap-3">
                  <FileBarChart className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-foreground">{r.week}</p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">
                      Score {r.score}/100{r.delta !== 0 && <> · <span className={r.delta > 0 ? "text-success" : "text-destructive"}>{r.delta > 0 ? "+" : ""}{r.delta}</span></>} · {r.fixes} fixes · {r.highlight}
                    </p>
                  </div>
                  <button onClick={() => toast("PDF export is part of the full build")} className="h-8 px-2.5 rounded-md border border-border text-[12px] text-foreground inline-flex items-center gap-1.5 shrink-0">
                    <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">PDF</span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Client summary">
            <div className="p-4 sm:p-5 space-y-3">
              <p className="text-[12px] text-muted-foreground">A plain-language summary you can send to the store owner. Generated from this week's scan — no jargon, no invented numbers.</p>
              <div className="rounded-md bg-surface p-4 text-[13px] text-foreground space-y-2">
                <p className="font-medium">Week of {lastScan}</p>
                <p>Your store scored {score}/100 on our checks. We found {count("error")} errors and {count("warning")} warnings, and prepared {safeBatch.length} fixes you can apply with one tap.</p>
                <p>Biggest win this week: {reports[0].highlight}.</p>
                <p>Next: connect Search Console so we can show how many people actually find you on Google.</p>
              </div>
              <div className="flex justify-end">
                <button onClick={() => toast("Email sharing is part of the full build")} className="h-8 px-3 rounded-md border border-border text-[12px] text-foreground inline-flex items-center gap-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Send to client
                </button>
              </div>
            </div>
          </Panel>
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="settings" className="space-y-4 mt-4">
          <Panel title="Data sources">
            <ul className="divide-y divide-border">
              {sources.map((s) => (
                <li key={s.name} className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] text-foreground">{s.name}</p>
                    <p className="text-[12px] text-muted-foreground">{s.state}</p>
                  </div>
                  {s.state === "Connected"
                    ? <span className="text-[12px] text-success inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Active</span>
                    : <button onClick={() => toast("Connection flow is part of the full build")} className="h-8 px-3 rounded-md border border-border text-[12px] text-foreground">Connect</button>}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Automation rules">
            <ul className="divide-y divide-border">
              <Rule label="Weekly scan" desc="Every Monday at 06:00. Results land in Findings." defaultOn />
              <Rule label="Auto-apply alt text" desc="Fill missing image alt text without asking." />
              <Rule label="Auto-apply search titles & descriptions" desc="Only for products with none set. Never overwrites your text." />
              <Rule label="Always ask before changing URLs" desc="URL changes need a redirect and can't be auto-applied." defaultOn locked />
              <Rule label="Never touch prices, stock or descriptions" desc="Autopilot can only suggest these." defaultOn locked />
              <Rule label="Never invent facts" desc="Drafts use only catalog data. Missing info becomes a question, not a guess." defaultOn locked />
            </ul>
          </Panel>
          <Panel title="Change history"><ActivityList log={log} /></Panel>
        </TabsContent>
      </Tabs>

      {/* finding detail */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg">
          {detail && (() => {
            const m = sevMeta[detail.severity];
            const s = st(detail);
            return (
              <>
                <DialogHeader>
                  <p className={`text-[11px] font-medium inline-flex items-center gap-1 ${m.cls}`}><m.icon className="w-3.5 h-3.5" /> {m.label}</p>
                  <DialogTitle className="text-[16px]">{detail.title}</DialogTitle>
                  <DialogDescription className="text-[12px]">{detail.where}{detail.affected > 1 ? ` · ${detail.affected} URLs` : ""}</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 text-[13px]">
                  <Block label="Why it matters">{detail.why}</Block>
                  <Block label="Evidence">
                    {detail.evidence}
                    <span className="block text-[11px] text-muted-foreground mt-1">{detail.source} · {detail.basis} · {lastScan}</span>
                  </Block>
                  <Block label="Recommended">{detail.action}</Block>
                  {detail.changes && <Diff changes={detail.changes} />}
                </div>
                <div className="flex flex-wrap justify-end gap-2 pt-2">
                  {s === "open" && <button onClick={() => dismiss(detail)} className="h-9 px-3 rounded-md border border-border text-[13px] text-muted-foreground">Not applicable</button>}
                  {s === "open" && detail.changes && !detail.needsHuman && (
                    <button onClick={() => apply([detail])} className="h-9 px-3 rounded-md bg-foreground text-background text-[13px] font-medium">
                      {detail.safe ? "Approve & apply" : "I've checked — apply"}
                    </button>
                  )}
                  {s === "open" && detail.needsHuman && <button onClick={() => { setDetail(null); setTab("content"); }} className="h-9 px-3 rounded-md bg-foreground text-background text-[13px] font-medium">Open brief</button>}
                  {s !== "open" && <span className="text-[12px] text-muted-foreground self-center">{s === "verified" ? "Verified live" : s === "verifying" ? "Applied · waiting for next scan" : "Dismissed"}</span>}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* batch review */}
      <Dialog open={!!review} onOpenChange={(o) => !o && setReview(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[16px]">Review {review?.length} changes</DialogTitle>
            <DialogDescription className="text-[12px]">Only empty or off-length fields are filled. Your descriptions, URLs, prices and stock are not touched. Every change is logged and can be undone.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {review?.map((f) => (
              <div key={f.id} className="rounded-md border border-border p-3">
                <p className="text-[12px] text-muted-foreground mb-2">{f.where}</p>
                {f.changes && <Diff changes={f.changes} />}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setReview(null)} className="h-9 px-3 rounded-md border border-border text-[13px] text-muted-foreground">Cancel</button>
            <button onClick={() => review && apply(review)} className="h-9 px-3 rounded-md bg-foreground text-background text-[13px] font-medium">Apply {review?.length}</button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

/* ---------- pieces ---------- */
const order = (f: Finding) => ({ error: 0, warning: 1, opportunity: 2 })[f.severity];

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg bg-card border border-border p-4">
      <p className="text-[12px] text-muted-foreground inline-flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full bg-current ${tone}`} />{label}</p>
      <p className="text-[24px] font-semibold tabular-nums text-foreground mt-1">{value}</p>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const tone = score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-destructive";
  return (
    <div className="relative w-20 h-20 shrink-0">
      <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--color-border)" strokeWidth="6" />
        <circle cx="40" cy="40" r={r} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"
          className={tone} strokeDasharray={c} strokeDashoffset={c - (c * score) / 100} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[20px] font-semibold tabular-nums text-foreground leading-none">{score}</span>
        <span className="text-[10px] text-muted-foreground">/100</span>
      </div>
    </div>
  );
}

function CheckIcon({ status }: { status: CheckStatus }) {
  if (status === "pass") return <CircleCheck className="w-4 h-4 text-success mt-0.5 shrink-0" />;
  if (status === "warn") return <CircleDot className="w-4 h-4 text-warning mt-0.5 shrink-0" />;
  if (status === "fail") return <AlertOctagon className="w-4 h-4 text-destructive mt-0.5 shrink-0" />;
  return <Minus className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />;
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg bg-card border border-border overflow-hidden ${className}`}>
      <div className="px-4 sm:px-5 py-3 border-b border-border"><h3 className="text-[13px] font-medium text-foreground">{title}</h3></div>
      {children}
    </div>
  );
}

const Empty = ({ text }: { text: string }) => <p className="px-5 py-8 text-center text-[12px] text-muted-foreground">{text}</p>;

function FindingRow({ f, onClick, showSource }: { f: Finding; onClick: () => void; showSource?: boolean }) {
  const m = sevMeta[f.severity];
  return (
    <li>
      <button onClick={onClick} className="w-full flex items-start gap-3 px-4 sm:px-5 py-3 text-left hover:bg-accent/50">
        <m.icon className={`w-4 h-4 mt-0.5 shrink-0 ${m.cls}`} />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-foreground">{f.title}</p>
          <p className="text-[12px] text-muted-foreground truncate">{f.where}{f.affected > 1 ? ` · ${f.affected} URLs` : ""}{showSource ? ` · ${f.source}` : ""}</p>
        </div>
        {f.safe && <span className="hidden sm:inline text-[11px] text-muted-foreground border border-border rounded px-1.5 py-0.5 shrink-0">Safe fix</span>}
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
      </button>
    </li>
  );
}

function Lane({ title, hint, items, onOpen, action, statusOf }: {
  title: string; hint: string; items: Finding[]; onOpen: (f: Finding) => void; action?: React.ReactNode; statusOf?: (f: Finding) => FixState;
}) {
  return (
    <div className="rounded-lg bg-card border border-border overflow-hidden">
      <div className="px-4 sm:px-5 py-3 border-b border-border flex items-center justify-between gap-2">
        <div>
          <h3 className="text-[13px] font-medium text-foreground">{title} <span className="text-muted-foreground tabular-nums">{items.length}</span></h3>
          <p className="text-[11px] text-muted-foreground">{hint}</p>
        </div>
        {action}
      </div>
      {items.length === 0 ? <Empty text="Empty" /> : (
        <ul className="divide-y divide-border">
          {items.map((f) => (
            <li key={f.id}>
              <button onClick={() => onOpen(f)} className="w-full flex items-center gap-2 px-4 sm:px-5 py-2.5 text-left hover:bg-accent/50">
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] text-foreground truncate">{f.title}</span>
                  <span className="block text-[11px] text-muted-foreground truncate">{f.where}</span>
                </span>
                {statusOf && (statusOf(f) === "verified"
                  ? <span className="text-[11px] text-success inline-flex items-center gap-1 shrink-0"><ShieldCheck className="w-3.5 h-3.5" /> Verified</span>
                  : <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1 shrink-0"><Clock className="w-3.5 h-3.5" /> Pending</span>)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Diff({ changes }: { changes: Change[] }) {
  return (
    <div className="space-y-2">
      {changes.map((c) => (
        <div key={c.field} className="rounded-md bg-surface p-2.5 text-[12px]">
          <p className="text-[11px] text-muted-foreground mb-1">{c.field}</p>
          <p className="text-muted-foreground line-through decoration-muted-foreground/50 break-words">{c.before}</p>
          <p className="text-foreground break-words mt-0.5">{c.after}</p>
        </div>
      ))}
    </div>
  );
}

const Block = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p><div className="text-foreground">{children}</div></div>
);

function ActivityList({ log }: { log: LogEntry[] }) {
  const icon = { applied: Check, verified: ShieldCheck, dismissed: X, scan: History };
  return (
    <ul className="divide-y divide-border">
      {log.map((l, i) => {
        const I = icon[l.kind];
        return (
          <li key={i} className="px-4 sm:px-5 py-2.5 flex items-center gap-3">
            <I className={`w-3.5 h-3.5 shrink-0 ${l.kind === "verified" ? "text-success" : "text-muted-foreground"}`} />
            <span className="flex-1 min-w-0 text-[12px] text-foreground truncate">{l.text}</span>
            <span className="text-[11px] text-muted-foreground shrink-0">{l.at}</span>
          </li>
        );
      })}
    </ul>
  );
}

function BriefRow({ p }: { p: Product }) {
  const [open, setOpen] = useState(false);
  const missing = [!p.author && "Who is the author?", !p.language && "Which language(s)?", (p.description ?? "").length < 50 && "What makes this book worth reading? (your words)"].filter(Boolean) as string[];
  return (
    <li className="px-4 sm:px-5 py-4">
      <button onClick={() => setOpen(!open)} className="w-full flex items-start gap-3 text-left">
        <Sparkles className="w-4 h-4 text-muted-foreground mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-foreground">Product page: {p.name}</p>
          <p className="text-[12px] text-muted-foreground">{missing.length ? `${missing.length} questions before drafting` : "Ready to draft"}</p>
        </div>
        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div className="mt-3 ml-7 space-y-2 text-[12px]">
          <p className="text-muted-foreground">Known facts: {p.category} · {p.variants.map((v) => v.name).join(", ")} · from ₹{Math.min(...p.variants.map((v) => v.price), p.basePrice)}</p>
          {missing.map((q) => <p key={q} className="text-foreground">? {q}</p>)}
          <button onClick={() => toast("Draft generation is part of the full build")} className="h-8 px-3 rounded-md border border-border text-[12px] text-foreground">Draft from facts</button>
        </div>
      )}
    </li>
  );
}

function Rule({ label, desc, defaultOn, locked }: { label: string; desc: string; defaultOn?: boolean; locked?: boolean }) {
  const [on, setOn] = useState(!!defaultOn);
  return (
    <li className="px-4 sm:px-5 py-3 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[13px] text-foreground">{label}</p>
        <p className="text-[12px] text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={on} onCheckedChange={setOn} disabled={locked} />
    </li>
  );
}
