import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  RefreshCw, AlertTriangle, AlertOctagon, Lightbulb, Globe, Plug, ShieldCheck,
  ChevronRight, FileText, Clock, Eye, X, Check, History, Sparkles, Search,
  BarChart3, FileBarChart, CircleCheck, CircleDot, Circle, Minus, ArrowUpRight,
  Download, BookOpen, Link2, LayoutGrid, ListChecks, Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { SeoAgent } from "@/components/admin/SeoAgent";
import { Button } from "@/components/ui/button";
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
  { name: "Search Console", state: "Connected" },
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

type Section = "overview" | "tasks" | "findings" | "queue" | "technical" | "pages" | "keywords" | "content" | "competitors" | "performance" | "reports" | "settings";

/* ---------- demo search data (fake, for the design) ---------- */
function trafficSeries(): DayPoint[] {
  const out: DayPoint[] = [];
  const t = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(t);
    d.setDate(d.getDate() - i);
    const w = d.getDay() === 0 || d.getDay() === 6 ? 8 : 0;
    const clicks = Math.round(28 + (29 - i) * 0.6 + Math.sin(i / 3) * 6 + w);
    out.push({ date: d.toISOString().slice(0, 10), label: d.toLocaleDateString([], { day: "numeric", month: "short" }), visitors: clicks, orders: 0, revenue: clicks * 31 + 200 });
  }
  return out;
}
const rankings = [
  { q: "the lost compass book", pos: 2, change: 1, page: "/products/the-lost-compass", clicks: 184, impr: 1240 },
  { q: "bilingual poetry book", pos: 6, change: 3, page: "/products/whispers-of-dawn", clicks: 96, impr: 2310 },
  { q: "historical fiction books india", pos: 11, change: 4, page: "/collections/books", clicks: 72, impr: 4820 },
  { q: "silent tides thriller", pos: 4, change: 0, page: "/products/silent-tides", clicks: 61, impr: 690 },
  { q: "arabic edition novels", pos: 18, change: -2, page: "/products/the-lost-compass", clicks: 14, impr: 1930 },
  { q: "buy books online india", pos: 47, change: 5, page: "/", clicks: 3, impr: 6120 },
];
const pages = [
  { url: "/", title: "Home", type: "Page", indexed: true, clicks: 212, position: 9.4, issues: 0 },
  { url: "/collections/books", title: "Books", type: "Collection", indexed: true, clicks: 148, position: 11.2, issues: 1 },
  { url: "/products/the-lost-compass", title: "The Lost Compass", type: "Product", indexed: true, clicks: 231, position: 3.1, issues: 1 },
  { url: "/products/whispers-of-dawn", title: "Whispers of Dawn", type: "Product", indexed: true, clicks: 104, position: 6.8, issues: 2 },
  { url: "/products/silent-tides", title: "Silent Tides", type: "Product", indexed: true, clicks: 66, position: 4.6, issues: 1 },
  { url: "/collections/new-arrivals", title: "New arrivals", type: "Collection", indexed: false, clicks: 0, position: 0, issues: 1 },
  { url: "/about", title: "About us", type: "Page", indexed: true, clicks: 12, position: 22.5, issues: 0 },
  { url: "/shipping-policy", title: "Shipping policy", type: "Page", indexed: false, clicks: 0, position: 0, issues: 1 },
];
const competitors = [
  { domain: "bookwallah.in", overlap: 62, note: "Ranks above you for 'historical fiction books india'. Has a written collection intro." },
  { domain: "kitabghar.com", overlap: 41, note: "Strong author pages — a gap you could fill." },
  { domain: "readersnook.in", overlap: 27, note: "Gets most traffic from gift-guide posts." },
];
const backlinks = [
  { from: "indianbookblog.com/best-of-2026", to: "/products/the-lost-compass", date: "3 Nov", status: "New" },
  { from: "poetrycircle.in/reviews", to: "/products/whispers-of-dawn", date: "29 Oct", status: "New" },
  { from: "citynews.in/local-shops", to: "/", date: "21 Oct", status: "New" },
  { from: "oldforum.net/thread/112", to: "/", date: "18 Oct", status: "Lost" },
];
const calendar = [
  { month: "Nov", day: 10, title: "Books collection intro", kind: "Collection copy", status: "Ready" },
  { month: "Nov", day: 17, title: "Author page: The Lost Compass", kind: "New page", status: "Draft" },
  { month: "Nov", day: 24, title: "Gift guide: books for poetry lovers", kind: "Blog post", status: "Idea" },
  { month: "Dec", day: 1, title: "FAQ block on product pages", kind: "Page update", status: "Idea" },
];

function SectionHead({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 className="text-[17px] font-semibold text-foreground">{title}</h2>
      <p className="text-[13px] text-muted-foreground mt-0.5">{desc}</p>
    </div>
  );
}
function SubTabs({ value, onChange, items }: { value: string; onChange: (v: string) => void; items: [string, string][] }) {
  return (
    <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
      <div className="inline-flex gap-1 p-1 rounded-lg bg-surface border border-border w-max">
        {items.map(([v, l]) => (
          <Button variant="ghost" key={v} onClick={() => onChange(v)}
            className={`h-8 px-3 rounded-md text-[12px] whitespace-nowrap transition-colors ${value === v ? "bg-card text-foreground font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{l}</Button>
        ))}
      </div>
    </div>
  );
}
function Kpi({ label, value, delta, negative }: { label: string; value: string; delta?: string; negative?: boolean }) {
  return (
    <div className="border-b border-border py-4 min-w-0">
      <p className="text-[12px] text-muted-foreground truncate">{label}</p>
      <p className="text-[20px] font-semibold tabular-nums text-foreground mt-1">{value}</p>
      {delta && <p className={`text-[11px] tabular-nums ${negative ? "text-destructive" : "text-success"}`}>{delta} vs last 30d</p>}
    </div>
  );
}
function Pill({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return <span className={`text-[11px] border border-border rounded px-1.5 py-0.5 shrink-0 whitespace-nowrap ${tone ?? "text-muted-foreground"}`}>{children}</span>;
}

/* ---------- page ---------- */
function SeoPage() {
  const products = useProducts();
  const [tab, setTab] = useState<Section>("overview");
  const [sub, setSub] = useState("");
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
  const traffic = useMemo(trafficSeries, []);

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
      { id: "t-gsc", title: "Review Search Console connection", detail: "Demo connection · no real data is synced", priority: "High", source: "Autopilot", finding: null },
      { id: "t-intro", title: "Write the Books collection intro", detail: "Brief is ready in the Content tab", priority: "Medium", source: "Autopilot", finding: null },
      { id: "t-weekly", title: "Review this week's scan", detail: "Every Monday · 5 min", priority: "Low", source: "Routine", finding: null },
      { id: "t-new", title: "Check new products for missing SEO fields", detail: "Runs after every catalog change", priority: "Low", source: "Routine", finding: null },
    ];
    return [...fromFindings, ...standing];
  }, [open]);

  const openTasks = tasks.filter((t) => !done[t.id]);
  const allChecks = techGroups.flatMap((g) => g.checks);
  const totalClicks = traffic.reduce((a, d) => a + d.visitors, 0);
  const totalImpr = traffic.reduce((a, d) => a + d.revenue, 0);

  const groups: { label: string; sections: { id: Section; label: string }[] }[] = [
    { label: "Agent", sections: [{ id: "overview", label: "Live agent" }] },
    { label: "Website", sections: [{ id: "technical", label: "Site health" }, { id: "pages", label: "Pages" }, { id: "findings", label: "Findings" }] },
    { label: "Growth", sections: [{ id: "keywords", label: "Keywords" }, { id: "content", label: "Content" }, { id: "competitors", label: "Competitors & links" }] },
    { label: "Results", sections: [{ id: "performance", label: "Performance" }, { id: "reports", label: "Reports" }] },
    { label: "Controls", sections: [{ id: "queue", label: "Review queue" }, { id: "tasks", label: "To-do" }, { id: "settings", label: "Settings" }] },
  ];
  const activeGroup = groups.find((group) => group.sections.some((section) => section.id === tab)) ?? groups[0];
  const go = (s: Section, sub?: string) => { setTab(s); setSub(sub ?? ""); };

  return (
    <AdminShell title="SEO Autopilot">
      <div className="seo-workspace mx-auto w-full max-w-[1500px] space-y-7">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0 flex items-center gap-2 text-xs text-muted-foreground"><Globe className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{DOMAIN}</span><span className="shrink-0 border-l border-border pl-2">Demo workspace</span></div>
          <Button variant="ghost" size="sm" onClick={runScan} disabled={scanning} className="text-muted-foreground"><RefreshCw className={scanning ? "animate-spin" : ""} /><span>{scanning ? "Scanning…" : "Scan site"}</span></Button>
        </div>
        <nav aria-label="SEO sections" className="grid grid-cols-5 border-b border-border">
          {groups.map((group) => <Button key={group.label} variant="ghost" onClick={() => go(group.sections[0].id)} aria-pressed={activeGroup.label === group.label} className={`h-11 rounded-none px-1 text-xs sm:text-sm hover:bg-transparent ${activeGroup.label === group.label ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"}`}>{group.label}</Button>)}
        </nav>
        {activeGroup.sections.length > 1 && <nav aria-label={`${activeGroup.label} sections`} className="flex flex-wrap gap-2">{activeGroup.sections.map((section) => <Button key={section.id} variant={tab === section.id ? "secondary" : "ghost"} size="sm" aria-pressed={tab === section.id} onClick={() => go(section.id)}>{section.label}</Button>)}</nav>}
        <div className="min-w-0 space-y-6">
          {tab === "overview" && <SeoAgent onReview={() => go("settings", "rules")} onResults={() => go("performance")} />}

          {/* TO-DO */}
          {tab === "tasks" && (
            <>
              <SectionHead title="To-do" desc="Your weekly work list. Built from the latest scan plus standing routines." />
              <SubTabs value={sub || "open"} onChange={setSub} items={[["open", `Open · ${openTasks.length}`], ["done", `Done · ${tasks.length - openTasks.length}`]]} />
              <Panel title={sub === "done" ? "Completed" : "Open tasks"}>
                {(() => {
                  const list = tasks.filter((t) => (sub === "done" ? done[t.id] : !done[t.id]));
                  if (!list.length) return <Empty text={sub === "done" ? "Nothing checked off yet." : "All done — nice."} />;
                  return (
                    <ul className="divide-y divide-border">
                      {list.map((t) => {
                        const isDone = !!done[t.id];
                        return (
                          <li key={t.id} className="px-4 sm:px-5 py-3.5 flex items-start gap-3">
                            <Button variant="ghost" onClick={() => { setDone((d) => ({ ...d, [t.id]: !d[t.id] })); if (!isDone) addLog(`Task done: ${t.title}`, "applied"); }}
                              className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground" aria-label={isDone ? "Mark not done" : "Mark done"}>
                              {isDone ? <CircleCheck className="w-[18px] h-[18px] text-success" /> : <Circle className="w-[18px] h-[18px]" />}
                            </Button>
                            <div className="flex-1 min-w-0">
                              <p className={`text-[13px] ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}>{t.title}</p>
                              <p className="text-[12px] text-muted-foreground">{t.detail}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Pill tone={t.priority === "High" ? "text-destructive" : t.priority === "Medium" ? "text-warning" : "text-muted-foreground"}>{t.priority}</Pill>
                              {t.finding && <Button variant="ghost" onClick={() => setDetail(t.finding)} className="text-[12px] text-foreground underline underline-offset-2">Open</Button>}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  );
                })()}
              </Panel>
            </>
          )}

          {/* FINDINGS */}
          {tab === "findings" && (
            <>
              <SectionHead title="Findings" desc={`Everything the scan from ${lastScan} found. Tap one to see evidence and the fix.`} />
              <SubTabs value={sub || "all"} onChange={setSub} items={[
                ["all", `All · ${open.length}`], ["error", `Errors · ${count("error")}`], ["warning", `Warnings · ${count("warning")}`], ["opportunity", `Opportunities · ${count("opportunity")}`],
              ]} />
              <Panel title="Results">
                {(() => {
                  const f0 = sub || "all";
                  const list = open.filter((f) => f0 === "all" || f.severity === f0).sort((a, b) => order(a) - order(b));
                  return list.length === 0 ? <Empty text="No findings in this group." /> : (
                    <ul className="divide-y divide-border">{list.map((f) => <FindingRow key={f.id} f={f} onClick={() => setDetail(f)} showSource />)}</ul>
                  );
                })()}
              </Panel>
            </>
          )}

          {/* FIX QUEUE */}
          {tab === "queue" && (() => {
            const lanes = {
              now: { title: "Fix now", hint: "Safe and reversible — one approval applies them.", items: open.filter((f) => f.safe) },
              review: { title: "Needs your review", hint: "Changes URLs, facts or your own words.", items: open.filter((f) => !f.safe && f.source === "Store catalog") },
              access: { title: "Waiting for access", hint: "Needs a developer or a store setting.", items: open.filter((f) => f.source === "Public crawl") },
              applied: { title: "Applied", hint: "Confirmed live on the next scan.", items: all.filter((f) => st(f) === "verifying" || st(f) === "verified") },
            } as const;
            const k = (sub || "now") as keyof typeof lanes;
            return (
              <>
                <SectionHead title="Fix queue" desc="Fixes sorted by how much attention they need from you." />
                <SubTabs value={k} onChange={setSub} items={(Object.keys(lanes) as (keyof typeof lanes)[]).map((x) => [x, `${lanes[x].title} · ${lanes[x].items.length}`])} />
                <Lane title={lanes[k].title} hint={lanes[k].hint} items={[...lanes[k].items]} onOpen={setDetail} statusOf={k === "applied" ? st : undefined}
                  action={k === "now" && safeBatch.length ? <Button variant="ghost" onClick={() => setReview(safeBatch)} className="h-8 px-3 rounded-md bg-foreground text-background text-[12px] font-medium">Review all</Button> : null} />
              </>
            );
          })()}

          {/* TECHNICAL */}
          {tab === "technical" && (() => {
            const g = techGroups.find((x) => x.label === sub) ?? techGroups[0];
            return (
              <>
                <SectionHead title="Technical health" desc="Can Google crawl, understand and load your store quickly?" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Stat label="Passed" value={allChecks.filter((c) => c.status === "pass").length} tone="text-success" />
                  <Stat label="Warnings" value={allChecks.filter((c) => c.status === "warn").length} tone="text-warning" />
                  <Stat label="Failing" value={allChecks.filter((c) => c.status === "fail").length} tone="text-destructive" />
                  <Stat label="Needs access" value={allChecks.filter((c) => c.status === "locked").length} tone="text-muted-foreground" />
                </div>
                <SubTabs value={g.label} onChange={setSub} items={techGroups.map((x) => [x.label, x.label])} />
                <Panel title={g.label}>
                  <ul className="divide-y divide-border">
                    {g.checks.map((c) => (
                      <li key={c.name} className="px-4 sm:px-5 py-3.5 flex items-start gap-3">
                        <CheckIcon status={c.status} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-foreground">{c.name}</p>
                          <p className="text-[12px] text-muted-foreground">{c.detail}</p>
                        </div>
                        {c.note && <Pill>{c.note}</Pill>}
                      </li>
                    ))}
                  </ul>
                </Panel>
              </>
            );
          })()}

          {/* PAGES */}
          {tab === "pages" && (() => {
            const f0 = sub || "all";
            const list = pages.filter((p) => f0 === "all" || (f0 === "issues" ? p.issues > 0 : p.type === f0));
            return (
              <>
                <SectionHead title="Pages" desc="Every public page, its search status and how it performs." />
                <SubTabs value={f0} onChange={setSub} items={[["all", `All · ${pages.length}`], ["issues", `With issues · ${pages.filter((p) => p.issues).length}`], ["Product", "Products"], ["Collection", "Collections"], ["Page", "Other"]]} />
                <Panel title={`${list.length} pages`}>
                  <div className="hidden md:grid grid-cols-[minmax(0,1fr)_90px_80px_70px_70px] gap-3 px-5 py-2 text-[11px] uppercase text-muted-foreground border-b border-border">
                    <span>Page</span><span>Index</span><span className="text-right">Clicks</span><span className="text-right">Position</span><span className="text-right">Issues</span>
                  </div>
                  <ul className="divide-y divide-border">
                    {list.map((p) => (
                      <li key={p.url} className="px-4 sm:px-5 py-3 md:grid md:grid-cols-[minmax(0,1fr)_90px_80px_70px_70px] md:gap-3 md:items-center">
                        <div className="min-w-0">
                          <p className="text-[13px] text-foreground truncate">{p.title}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{p.url} · {p.type}</p>
                        </div>
                        <div className="flex md:contents items-center gap-3 mt-1.5 md:mt-0 text-[12px]">
                          <span className={p.indexed ? "text-success" : "text-warning"}>{p.indexed ? "Indexed" : "Not indexed"}</span>
                          <span className="md:text-right tabular-nums text-foreground">{p.clicks} <span className="md:hidden text-muted-foreground">clicks</span></span>
                          <span className="md:text-right tabular-nums text-muted-foreground">{p.position ? `#${p.position}` : "—"}</span>
                          <span className={`md:text-right tabular-nums ${p.issues ? "text-destructive" : "text-muted-foreground"}`}>{p.issues || "—"}<span className="md:hidden"> issues</span></span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Panel>
              </>
            );
          })()}

          {/* KEYWORDS */}
          {tab === "keywords" && (
            <>
              <SectionHead title="Keywords" desc="What people search, where you rank, and what to target next." />
              <SubTabs value={sub || "rankings"} onChange={setSub} items={[["rankings", "Rankings"], ["opportunities", "Opportunities"]]} />
              {(sub || "rankings") === "rankings" ? (
                <Panel title="Tracked keywords">
                  <ul className="divide-y divide-border">
                    {rankings.map((r) => (
                      <li key={r.q} className="px-4 sm:px-5 py-3 flex items-center gap-3">
                        <div className="w-10 text-[15px] font-semibold tabular-nums text-foreground">#{r.pos}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-foreground truncate">{r.q}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{r.page} · {r.clicks} clicks · {r.impr.toLocaleString()} impressions</p>
                        </div>
                        <span className={`text-[12px] tabular-nums shrink-0 ${r.change > 0 ? "text-success" : r.change < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                          {r.change > 0 ? `▲ ${r.change}` : r.change < 0 ? `▼ ${-r.change}` : "—"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Panel>
              ) : (
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
                          <Pill tone={k.intent === "Buy" ? "text-success" : undefined}>{k.intent}</Pill>
                          <span className="hidden sm:inline"><Pill>Fit: {k.fit}</Pill></span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}
            </>
          )}

          {/* CONTENT */}
          {tab === "content" && (
            <>
              <SectionHead title="Content" desc="Briefs built only from your catalog facts, gaps to fill, and a simple plan." />
              <SubTabs value={sub || "briefs"} onChange={setSub} items={[["briefs", "Briefs"], ["gaps", "Gaps"], ["calendar", "Calendar"]]} />
              {(sub || "briefs") === "briefs" && (
                <Panel title="Content briefs"><ul className="divide-y divide-border">{products.map((p) => <BriefRow key={p.id} p={p} />)}</ul></Panel>
              )}
              {sub === "gaps" && (
                <Panel title="Content gaps">
                  <ul className="divide-y divide-border">
                    {contentGaps.map((g) => (
                      <li key={g.title} className="px-4 sm:px-5 py-3.5 flex items-start gap-3">
                        <BookOpen className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-foreground">{g.title}</p>
                          <p className="text-[12px] text-muted-foreground">{g.detail}</p>
                        </div>
                        <Pill>{g.effort} effort</Pill>
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}
              {sub === "calendar" && (
                <Panel title="Next 4 weeks">
                  <ul className="divide-y divide-border">
                    {calendar.map((c) => (
                      <li key={c.title} className="px-4 sm:px-5 py-3.5 flex items-center gap-4">
                        <div className="w-14 shrink-0 text-center">
                          <p className="text-[10px] uppercase text-muted-foreground">{c.month}</p>
                          <p className="text-[18px] font-semibold tabular-nums text-foreground leading-tight">{c.day}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-foreground">{c.title}</p>
                          <p className="text-[12px] text-muted-foreground">{c.kind}</p>
                        </div>
                        <Pill tone={c.status === "Ready" ? "text-success" : c.status === "Draft" ? "text-warning" : undefined}>{c.status}</Pill>
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}
            </>
          )}

          {/* COMPETITORS & LINKS */}
          {tab === "competitors" && (
            <>
              <SectionHead title="Competitors & links" desc="Who you share searches with, and where trust and links can come from." />
              <SubTabs value={sub || "competitors"} onChange={setSub} items={[["competitors", "Competitors"], ["links", "Backlinks"], ["local", "Local & social"]]} />
              {(sub || "competitors") === "competitors" && (
                <Panel title="Sharing your keywords">
                  <ul className="divide-y divide-border">
                    {competitors.map((c) => (
                      <li key={c.domain} className="px-4 sm:px-5 py-3.5">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[13px] text-foreground truncate">{c.domain}</p>
                          <span className="text-[12px] text-muted-foreground tabular-nums shrink-0">{c.overlap}% overlap</span>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-surface overflow-hidden"><div className="h-full bg-foreground/70" style={{ width: `${c.overlap}%` }} /></div>
                        <p className="text-[12px] text-muted-foreground mt-2">{c.note}</p>
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}
              {sub === "links" && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <Kpi label="Referring sites" value="23" delta="+3" />
                    <Kpi label="Total links" value="61" delta="+7" />
                    <Kpi label="Lost · 30d" value="2" />
                  </div>
                  <Panel title="Newest links">
                    <ul className="divide-y divide-border">
                      {backlinks.map((b) => (
                        <li key={b.from} className="px-4 sm:px-5 py-3 flex items-center gap-3">
                          <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] text-foreground truncate">{b.from}</p>
                            <p className="text-[11px] text-muted-foreground truncate">→ {b.to} · {b.date}</p>
                          </div>
                          <Pill tone={b.status === "Lost" ? "text-destructive" : "text-success"}>{b.status}</Pill>
                        </li>
                      ))}
                    </ul>
                  </Panel>
                </>
              )}
              {sub === "local" && (
                <Panel title="Local & social presence">
                  <ul className="divide-y divide-border">
                    {[
                      { t: "Google Business Profile", d: "Not linked. Create and verify a profile for brand searches.", s: "To do" },
                      { t: "Instagram link in bio", d: "Points to homepage — a focused landing page converts better.", s: "Improve" },
                      { t: "Directory listings", d: "Same name, address and link on 2–3 relevant directories.", s: "2 of 3" },
                      { t: "Reviews on Google", d: "No reviews yet. Ask recent buyers after delivery.", s: "To do" },
                    ].map((r) => (
                      <li key={r.t} className="px-4 sm:px-5 py-3.5 flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-foreground">{r.t}</p>
                          <p className="text-[12px] text-muted-foreground">{r.d}</p>
                        </div>
                        <Pill>{r.s}</Pill>
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}
            </>
          )}

          {/* PERFORMANCE */}
          {tab === "performance" && (
            <>
              <SectionHead title="Performance" desc="Sample search results and SEO health trends." />
              <SubTabs value={sub || "search"} onChange={setSub} items={[["search", "Search traffic"], ["health", "SEO health"]]} />
              {(sub || "search") === "search" ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Kpi label="Clicks" value={totalClicks.toLocaleString()} delta="+18%" />
                    <Kpi label="Impressions" value={`${(totalImpr / 1000).toFixed(1)}k`} delta="+24%" />
                    <Kpi label="Click rate" value={`${((totalClicks / totalImpr) * 100).toFixed(1)}%`} delta="-0.2%" negative />
                    <Kpi label="Avg. position" value="14.2" delta="+2.1" />
                  </div>
                  <Panel title="Clicks · 30 days"><div className="p-4"><TrendChart data={traffic} dataKey="visitors" height={200} formatValue={(n) => `${n} clicks`} /></div></Panel>
                  <Panel title="Top searches">
                    <ul className="divide-y divide-border">
                      {rankings.slice(0, 5).map((r) => (
                        <li key={r.q} className="px-4 sm:px-5 py-3 flex items-center gap-3">
                          <p className="flex-1 min-w-0 text-[13px] text-foreground truncate">{r.q}</p>
                          <span className="text-[12px] tabular-nums text-foreground w-14 text-right">{r.clicks}</span>
                          <span className="text-[12px] tabular-nums text-muted-foreground w-16 text-right hidden sm:inline">{r.impr.toLocaleString()}</span>
                        </li>
                      ))}
                    </ul>
                  </Panel>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Stat label="Health score" value={score} tone="text-info" />
                    <Stat label="Fixes applied" value={log.filter((l) => l.kind === "applied").length} tone="text-success" />
                    <Stat label="Verified live" value={log.filter((l) => l.kind === "verified").length} tone="text-success" />
                    <Stat label="Scans run" value={log.filter((l) => l.kind === "scan").length} tone="text-foreground" />
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <Panel title="Health score · 30 days"><div className="p-4"><TrendChart data={series} dataKey="visitors" height={180} formatValue={(n) => `${n}/100`} /></div></Panel>
                    <Panel title="Fixes applied · 30 days"><div className="p-4"><TrendChart data={series} dataKey="orders" height={180} variant="bar" formatValue={(n) => `${n} fixed`} /></div></Panel>
                  </div>
                </>
              )}
            </>
          )}

          {/* REPORTS */}
          {tab === "reports" && (
            <>
              <SectionHead title="Reports" desc="Weekly progress, and a plain-language summary for the store owner." />
              <SubTabs value={sub || "weekly"} onChange={setSub} items={[["weekly", "Weekly"], ["summary", "Client summary"]]} />
              {(sub || "weekly") === "weekly" ? (
                <Panel title="Weekly reports">
                  <ul className="divide-y divide-border">
                    {reports.map((r) => (
                      <li key={r.week} className="px-4 sm:px-5 py-4 flex items-center gap-4">
                        <div className="w-12 shrink-0 text-center">
                          <p className="text-[18px] font-semibold tabular-nums text-foreground leading-none">{r.score}</p>
                          <p className={`text-[11px] tabular-nums mt-1 ${r.delta > 0 ? "text-success" : "text-muted-foreground"}`}>{r.delta > 0 ? `+${r.delta}` : "—"}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-foreground">{r.week}</p>
                          <p className="text-[12px] text-muted-foreground">{r.fixes} fixes · {r.highlight}</p>
                        </div>
                        <Button variant="ghost" onClick={() => toast("PDF export is part of the full build")} className="h-8 px-2.5 rounded-md border border-border text-[12px] text-foreground inline-flex items-center gap-1.5 shrink-0">
                          <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">PDF</span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </Panel>
              ) : (
                <Panel title="Client summary">
                  <div className="p-4 sm:p-5 space-y-4">
                    <div className="rounded-md bg-surface p-4 sm:p-5 text-[13px] text-foreground space-y-2.5 leading-relaxed">
                      <p className="font-medium">Week of {lastScan}</p>
                      <p>Your store scored {score}/100 on our checks. {totalClicks} people clicked through to your store from Google this month — 18% more than last month.</p>
                      <p>We found {count("error")} errors and {count("warning")} warnings, and prepared {safeBatch.length} fixes you can approve with one tap.</p>
                      <p>Biggest win: {reports[0].highlight}.</p>
                    </div>
                    <div className="flex justify-end">
                      <Button variant="ghost" onClick={() => toast("Email sharing is part of the full build")} className="h-9 px-3 rounded-md bg-foreground text-background text-[13px] font-medium inline-flex items-center gap-1.5">
                        <ArrowUpRight className="w-3.5 h-3.5" /> Send to client
                      </Button>
                    </div>
                  </div>
                </Panel>
              )}
            </>
          )}

          {/* SETTINGS */}
          {tab === "settings" && (
            <>
              <SectionHead title="Settings" desc="Where data comes from, what the autopilot may do alone, and every change it made." />
              <SubTabs value={sub || "sources"} onChange={setSub} items={[["sources", "Data sources"], ["rules", "Automation"], ["history", "History"]]} />
              {(sub || "sources") === "sources" && (
                <Panel title="Data sources">
                  <ul className="divide-y divide-border">
                    {sources.map((s) => (
                      <li key={s.name} className="px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Plug className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-[13px] text-foreground">{s.name}</p>
                            <p className="text-[12px] text-muted-foreground">{s.state}</p>
                          </div>
                        </div>
                        {s.state === "Connected"
                          ? <span className="text-[12px] text-success inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Active</span>
                          : <Button variant="ghost" onClick={() => toast("Connection flow is part of the full build")} className="h-8 px-3 rounded-md border border-border text-[12px] text-foreground">Connect</Button>}
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}
              {sub === "rules" && (
                <Panel title="Automation rules">
                  <ul className="divide-y divide-border">
                    <Rule label="Weekly scan" desc="Every Monday at 06:00. Results land in Findings." defaultOn />
                    <Rule label="Auto-apply alt text" desc="Fill missing image alt text without asking." />
                    <Rule label="Auto-apply search titles & descriptions" desc="Only for products with none set. Never overwrites your text." />
                    <Rule label="Always ask before changing URLs" desc="URL changes need a redirect and can't be auto-applied." defaultOn locked />
                    <Rule label="Never touch prices, stock or descriptions" desc="Autopilot can only suggest these." defaultOn locked />
                    <Rule label="Never invent facts" desc="Drafts use only catalog data. Missing info becomes a question." defaultOn locked />
                  </ul>
                </Panel>
              )}
              {sub === "history" && <Panel title="Change history"><ActivityList log={log} /></Panel>}
            </>
          )}
        </div>
      </div>

      {/* finding detail */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg max-h-[85dvh] overflow-y-auto">
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
                  {s === "open" && <Button variant="ghost" onClick={() => dismiss(detail)} className="h-9 px-3 rounded-md border border-border text-[13px] text-muted-foreground">Not applicable</Button>}
                  {s === "open" && detail.changes && !detail.needsHuman && (
                    <Button variant="ghost" onClick={() => apply([detail])} className="h-9 px-3 rounded-md bg-foreground text-background text-[13px] font-medium">
                      {detail.safe ? "Approve & apply" : "I've checked — apply"}
                    </Button>
                  )}
                  {s === "open" && detail.needsHuman && <Button variant="ghost" onClick={() => { setDetail(null); setTab("content"); setSub("briefs"); }} className="h-9 px-3 rounded-md bg-foreground text-background text-[13px] font-medium">Open brief</Button>}
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
            <DialogDescription className="text-[12px]">Only empty or off-length fields are filled. Your descriptions, URLs, prices and stock are not touched. Every change is logged in this demo.</DialogDescription>
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
            <Button variant="ghost" onClick={() => setReview(null)} className="h-9 px-3 rounded-md border border-border text-[13px] text-muted-foreground">Cancel</Button>
            <Button variant="ghost" onClick={() => review && apply(review)} className="h-9 px-3 rounded-md bg-foreground text-background text-[13px] font-medium">Apply {review?.length}</Button>
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
    <div className="border-b border-border py-4 min-w-0">
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

function Panel({ title, children, className = "", action }: { title: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <div className={`border-y border-border overflow-hidden ${className}`}>
      <div className="px-1 py-4 border-b border-border grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><h3 className="min-w-0 text-[13px] font-medium text-foreground">{title}</h3>{action}</div>
      {children}
    </div>
  );
}

const Empty = ({ text }: { text: string }) => <p className="px-5 py-8 text-center text-[12px] text-muted-foreground">{text}</p>;

function FindingRow({ f, onClick, showSource }: { f: Finding; onClick: () => void; showSource?: boolean }) {
  const m = sevMeta[f.severity];
  return (
    <li>
      <Button variant="ghost" onClick={onClick} className="w-full flex items-start gap-3 px-4 sm:px-5 py-3 text-left hover:bg-accent/50">
        <m.icon className={`w-4 h-4 mt-0.5 shrink-0 ${m.cls}`} />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-foreground">{f.title}</p>
          <p className="text-[12px] text-muted-foreground truncate">{f.where}{f.affected > 1 ? ` · ${f.affected} URLs` : ""}{showSource ? ` · ${f.source}` : ""}</p>
        </div>
        {f.safe && <span className="hidden sm:inline text-[11px] text-muted-foreground border border-border rounded px-1.5 py-0.5 shrink-0">Safe fix</span>}
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
      </Button>
    </li>
  );
}

function Lane({ title, hint, items, onOpen, action, statusOf }: {
  title: string; hint: string; items: Finding[]; onOpen: (f: Finding) => void; action?: React.ReactNode; statusOf?: (f: Finding) => FixState;
}) {
  return (
    <div className="border-y border-border overflow-hidden">
      <div className="px-4 sm:px-5 py-3 border-b border-border flex items-center justify-between gap-2">
        <div>
          <h3 className="min-w-0 text-[13px] font-medium text-foreground">{title} <span className="text-muted-foreground tabular-nums">{items.length}</span></h3>
          <p className="text-[11px] text-muted-foreground">{hint}</p>
        </div>
        {action}
      </div>
      {items.length === 0 ? <Empty text="Empty" /> : (
        <ul className="divide-y divide-border">
          {items.map((f) => (
            <li key={f.id}>
              <Button variant="ghost" onClick={() => onOpen(f)} className="w-full flex items-center gap-2 px-4 sm:px-5 py-2.5 text-left hover:bg-accent/50">
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] text-foreground truncate">{f.title}</span>
                  <span className="block text-[11px] text-muted-foreground truncate">{f.where}</span>
                </span>
                {statusOf && (statusOf(f) === "verified"
                  ? <span className="text-[11px] text-success inline-flex items-center gap-1 shrink-0"><ShieldCheck className="w-3.5 h-3.5" /> Verified</span>
                  : <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1 shrink-0"><Clock className="w-3.5 h-3.5" /> Pending</span>)}
              </Button>
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
  <div><p className="text-[11px] uppercase text-muted-foreground mb-0.5">{label}</p><div className="text-foreground">{children}</div></div>
);

function ActivityList({ log }: { log: LogEntry[] }) {
  const icon = { applied: Check, verified: ShieldCheck, dismissed: X, scan: History };
  return (
    <ul className="divide-y divide-border">
      {log.map((l, i) => {
        const I = icon[l.kind];
        return (
          <li key={i} className="px-4 sm:px-5 py-2.5 grid grid-cols-[16px_minmax(0,1fr)] gap-3">
            <I className={`w-3.5 h-3.5 shrink-0 ${l.kind === "verified" ? "text-success" : "text-muted-foreground"}`} />
            <span className="min-w-0 text-[12px] text-foreground break-words">{l.text}</span>
            <span className="col-start-2 text-[11px] text-muted-foreground">{l.at}</span>
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
      <Button variant="ghost" onClick={() => setOpen(!open)} className="w-full flex items-start gap-3 text-left">
        <Sparkles className="w-4 h-4 text-muted-foreground mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-foreground">Product page: {p.name}</p>
          <p className="text-[12px] text-muted-foreground">{missing.length ? `${missing.length} questions before drafting` : "Ready to draft"}</p>
        </div>
        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
      </Button>
      {open && (
        <div className="mt-3 ml-7 space-y-2 text-[12px]">
          <p className="text-muted-foreground">Known facts: {p.category} · {p.variants.map((v) => v.name).join(", ")} · from ₹{Math.min(...p.variants.map((v) => v.price), p.basePrice)}</p>
          {missing.map((q) => <p key={q} className="text-foreground">? {q}</p>)}
          <Button variant="ghost" onClick={() => toast("Draft generation is part of the full build")} className="h-8 px-3 rounded-md border border-border text-[12px] text-foreground">Draft from facts</Button>
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
