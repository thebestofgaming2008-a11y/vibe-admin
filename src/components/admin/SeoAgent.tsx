import { useEffect, useState, type ReactNode } from "react";
import { ArrowUpRight, Check, ChevronRight, FileText, Pause, Play, RotateCcw, Search, ShieldCheck, ShoppingBag, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import booksImage from "@/assets/poetry-books.jpg";

/* Sample data only — this is a design mockup, nothing here is a real measurement. */
const trends = [
  { query: "bilingual poetry books", volume: "1.9k", growth: 340, competition: "Low", intent: "Ready to buy", points: [22, 23, 21, 21, 17, 15, 8, 3] },
  { query: "historical fiction india", volume: "2.4k", growth: 212, competition: "Medium", intent: "Ready to buy", points: [24, 23, 22, 19, 19, 13, 10, 6] },
  { query: "books for poetry lovers", volume: "880", growth: 126, competition: "Low", intent: "Gift buyer", points: [24, 21, 22, 17, 16, 12, 11, 8] },
  { query: "arabic edition novels", volume: "390", growth: 58, competition: "Medium", intent: "Ready to buy", points: [20, 15, 19, 13, 17, 10, 14, 9] },
  { query: "hardcover books online", volume: "720", growth: 41, competition: "High", intent: "Comparing", points: [21, 16, 20, 14, 19, 13, 15, 11] },
  { query: "poetry gifts for readers", volume: "3.1k", growth: 18, competition: "Low", intent: "Gift buyer", points: [18, 14, 18, 13, 17, 13, 15, 12] },
];
const steps = [
  { title: "Spot trends", note: "What people search" },
  { title: "Pick the winner", note: "Intent + competition" },
  { title: "Build the page", note: "Copy, FAQs, schema" },
  { title: "Publish", note: "Live + indexed" },
  { title: "Rank + sales", note: "Orders come in" },
];
const events = [
  { stage: 0, text: "Pulling Google search trends for books in India", time: "08:00:07" },
  { stage: 0, text: "Found 6 searches rising this week", time: "08:00:19" },
  { stage: 1, text: "Scoring each one on buyer intent and competition", time: "08:00:31" },
  { stage: 1, text: "Winner:", winner: true, time: "08:00:43" },
  { stage: 2, text: "Up 340%, ready-to-buy intent, only 2 weak pages ranking", time: "08:00:48" },
  { stage: 2, text: "Building a new collection page from your catalog", time: "08:00:55" },
  { stage: 2, text: "Writing the headline and copy in your tone of voice", time: "08:01:02" },
  { stage: 3, text: "Title, links, mobile and schema checks passed", time: "08:01:24" },
  { stage: 3, text: "Draft ready — waiting for your approval", time: "08:01:32" },
  { stage: 4, text: "Published (demo). Requested indexing, tracking rank", time: "08:02:01" },
];
const checks = [
  { label: "Title tag", at: 2 },
  { label: "Meta description", at: 3 },
  { label: "H1 match", at: 2 },
  { label: "Book schema", at: 3 },
  { label: "4 internal links", at: 2 },
  { label: "Mobile speed 98", at: 3 },
];
const kpis = [
  { label: "Pages built by agent", value: "47", delta: "+6 new", icon: FileText },
  { label: "Searches tracked", value: "318", delta: "+24", icon: Search },
  { label: "Top 3 on Google", value: "61", delta: "+8", icon: Trophy },
  { label: "Orders from search", value: "38", delta: "+12", icon: ShoppingBag },
];

function Spark({ points, strong }: { points: number[]; strong?: boolean }) {
  const d = points.map((y, i) => `${(i * 64) / (points.length - 1)},${y}`).join(" ");
  return (
    <svg viewBox="0 0 64 26" className={`h-5 w-14 ${strong ? "text-foreground" : "text-muted-foreground"}`} aria-hidden="true">
      <polyline points={d} fill="none" stroke="currentColor" strokeWidth={strong ? 1.6 : 1.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Card({ title, sub, badge, children, className = "" }: { title: string; sub: string; badge?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`flex min-w-0 flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-soft sm:p-6 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-medium tracking-tight text-foreground">{title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
        </div>
        {badge}
      </div>
      {children}
    </section>
  );
}

const Pill = ({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" }) => (
  <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] ${tone === "success" ? "border-success/25 bg-success/10 text-success" : "border-border bg-background text-muted-foreground"}`}>{children}</span>
);

export function SeoAgent({ onReview, onResults }: { onReview: () => void; onResults: () => void }) {
  const [stage, setStage] = useState(2);
  const [running, setRunning] = useState(true);
  const [selected, setSelected] = useState(0);
  const [detail, setDetail] = useState<number | null>(null);
  const [preview, setPreview] = useState(false);
  const [history, setHistory] = useState(false);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    if (!running || stage >= 3) return;
    const timer = window.setTimeout(() => setStage((s) => Math.min(3, s + 1)), 6000);
    return () => window.clearTimeout(timer);
  }, [stage, running]);

  const topic = trends[selected] ?? trends[0];
  const slug = topic.query.replaceAll(" ", "-");
  const activity = events.filter((e) => e.stage <= stage);
  const restart = () => { setStage(0); setPublished(false); setRunning(true); };
  const publish = () => { setPublished(true); setStage(4); setPreview(false); };
  const status = !running ? "Paused" : published ? "Monitoring" : stage === 3 ? "Needs your approval" : "Agent running";
  const builderBadge = published ? <Pill tone="success">Live · demo</Pill> : stage >= 3 ? <Pill tone="success">Ready to review</Pill> : <Pill>Drafting</Pill>;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Workflow */}
      <section className="rounded-2xl border border-border/70 bg-card px-4 pb-5 pt-4 shadow-soft sm:px-6 sm:pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">Today’s run · started 08:00</p>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-border bg-background px-3 py-1 text-[11px] text-muted-foreground sm:inline">Next scan in <span className="font-medium text-foreground">5h 12m</span></span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-[11px] text-foreground">
              <span className={`h-1.5 w-1.5 rounded-full ${running ? "bg-success" : "bg-muted-foreground"}`} />{status}
            </span>
            <Button variant="outline" size="icon" className="h-7 w-7 rounded-full" aria-label={running ? "Pause agent" : "Resume agent"} onClick={() => setRunning(!running)}>
              {running ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </Button>
          </div>
        </div>
        <ol className="seo-steps mt-5 grid grid-cols-5" aria-label="Agent progress">
          {steps.map((step, i) => (
            <li key={step.title} data-done={i < stage} aria-current={i === stage ? "step" : undefined} className="relative min-w-0 px-1 text-center">
              <span className={`relative z-10 mx-auto grid h-7 w-7 place-items-center rounded-full border text-[11px] font-medium transition-colors ${i < stage ? "border-success bg-success text-success-foreground" : i === stage ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground"}`}>
                {i < stage ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <p className={`mt-2.5 text-[11px] leading-tight sm:text-[13px] ${i <= stage ? "font-medium text-foreground" : "text-muted-foreground"}`}>{step.title}</p>
              <p className="mt-1 hidden text-[11px] text-muted-foreground sm:block">{step.note}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Three working panels */}
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2 2xl:grid-cols-[1fr_0.95fr_1.15fr]">
        <Card title="Trending near you" sub="Google searches · last 7 days · India" badge={<Pill tone="success">1 picked</Pill>}>
          <div className="mt-5 grid grid-cols-[minmax(0,1fr)_36px_56px_52px] gap-2 px-3 text-[10px] uppercase tracking-wide text-muted-foreground">
            <span>Search</span><span className="text-right">Vol/mo</span><span className="text-center">Trend</span><span className="text-right">7 days</span>
          </div>
          <ul className="mt-2 space-y-1">
            {trends.map((t, i) => {
              const on = selected === i;
              return (
                <li key={t.query}>
                  <button type="button" onClick={() => setDetail(i)} className={`grid w-full grid-cols-[minmax(0,1fr)_36px_56px_52px] items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-all ${on ? "border-border bg-card shadow-lift" : "border-transparent hover:bg-muted/60"}`}>
                    <span className={`min-w-0 truncate text-[13px] ${on ? "font-medium text-foreground" : "text-foreground/80"}`}>{t.query}</span>
                    <span className="text-right text-[11px] tabular-nums text-muted-foreground">{t.volume}</span>
                    <span className="flex justify-center"><Spark points={t.points} strong={on} /></span>
                    <span className="flex justify-end">
                      {on ? <span className="rounded-full bg-success px-2 py-0.5 text-[10px] font-medium tabular-nums text-success-foreground">+{t.growth}%</span> : <span className="text-[11px] tabular-nums text-muted-foreground">+{t.growth}%</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-4 text-[11px] text-muted-foreground" style={{ marginTop: "1.25rem" }}>
            <span><span className="font-medium text-foreground">312</span> searches every 6 hours</span>
            <span>1 page queued</span>
          </div>
        </Card>

        <Card title="Agent activity" sub="Runs on its own · you approve what goes live" badge={<Pill tone="success"><span className={`h-1.5 w-1.5 rounded-full bg-success ${running ? "animate-pulse" : ""}`} />{running ? "Live" : "Paused"}</Pill>}>
          <ol className="mt-6 flex flex-1 flex-col justify-end space-y-4">
            {activity.map((e, i) => {
              const last = i === activity.length - 1;
              return (
                <li key={e.time} className="grid grid-cols-[16px_minmax(0,1fr)] gap-3 animate-fade-in">
                  {last && !published
                    ? <span className="mt-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-foreground"><span className="h-1.5 w-1.5 rounded-full bg-background" /></span>
                    : <span className="mt-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-success"><Check className="h-2.5 w-2.5 text-success-foreground" strokeWidth={3} /></span>}
                  <div className="min-w-0">
                    <p className={`text-[13px] leading-5 ${last ? "font-medium text-foreground" : "text-foreground/75"}`}>
                      {e.text}{e.winner && <> <mark className="rounded-sm bg-highlight px-1 font-medium text-foreground">{topic.query}</mark></>}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">{e.time}</p>
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="mt-5 flex gap-2 border-t border-border pt-4">
            {stage === 3 && !published && <Button size="sm" className="flex-1 rounded-full" onClick={() => setPreview(true)}>Review draft <ChevronRight /></Button>}
            <Button variant="ghost" size="sm" className="flex-1 rounded-full text-muted-foreground" onClick={() => setHistory(true)}>Full history</Button>
          </div>
        </Card>

        <Card title="Page builder" sub="Written from your catalog facts · nothing invented" badge={builderBadge} className="lg:col-span-2 2xl:col-span-1">
          <div className="mt-5 overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center gap-1.5 border-b border-border bg-muted/50 px-3 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" /><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" /><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
              <span className="ml-2 min-w-0 truncate font-mono text-[10px] text-muted-foreground">yourstore.com/collections/<span className="text-foreground">{slug}</span></span>
            </div>
            <div className="bg-preview p-4 text-preview-foreground sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-serif text-sm font-semibold">The Bookshop.</span>
                <span className="hidden gap-3 text-[9px] text-preview-foreground/60 sm:flex"><span>Books</span><span>Authors</span><span>Gifts</span></span>
                <span className="rounded-full bg-preview-foreground px-2 py-0.5 text-[9px] font-medium text-preview">Free shipping ₹999+</span>
              </div>
              <p className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-preview-foreground/10 px-2 py-0.5 text-[9px] text-preview-foreground/80"><span className="h-1 w-1 rounded-full bg-success" />New collection · 12 books</p>
              <h4 className={`mt-2 font-serif text-xl capitalize leading-tight transition-opacity sm:text-2xl ${stage >= 2 ? "opacity-100" : "opacity-30"}`}>{topic.query}</h4>
              <p className="mt-2 max-w-sm text-[11px] leading-4 text-preview-foreground/65">Poetry that reads in two languages. Hardcover and Arabic editions, shipped from our shop.</p>
              <div className="mt-4 flex gap-2">
                <span className="rounded-full bg-cta px-3 py-1 text-[10px] font-medium text-cta-foreground">Shop the collection</span>
                <span className="rounded-full border border-preview-foreground/30 px-3 py-1 text-[10px]">Read a sample</span>
              </div>
            </div>
            <img src={booksImage} alt="Sage and blush hardcover poetry books" width={992} height={672} className="aspect-[3] w-full object-cover" />
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {checks.map((c) => {
              const ok = stage >= c.at || published;
              return <span key={c.label} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${ok ? "border-border bg-card text-foreground" : "border-dashed border-border text-muted-foreground"}`}>{ok && <Check className="h-3 w-3 text-success" />}{c.label}</span>;
            })}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3">
            <div className="min-w-0"><p className="truncate text-[13px] font-medium">{topic.query}</p><p className="text-[11px] text-muted-foreground">Google position</p></div>
            <span className="shrink-0 text-xs text-muted-foreground">{published ? <span className="text-foreground">Tracking · demo</span> : "not live yet —"}</span>
          </div>
        </Card>
      </div>

      {/* Outcome metrics */}
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground sm:text-xs"><k.icon className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{k.label}</span></p>
              <span className="hidden shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-[10px] text-success sm:inline">{k.delta}</span>
            </div>
            <p className="mt-3 text-3xl font-light tabular-nums tracking-tight sm:text-4xl">{k.value}</p>
            <p className="mt-1 text-[10px] text-success sm:hidden">{k.delta}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />Sample data. Safe fixes run on their own — new pages always wait for your approval.</p>
        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground" onClick={restart}><RotateCcw /> Replay</Button>
          <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground" onClick={onReview}>Controls</Button>
          <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground" onClick={onResults}>Results <ArrowUpRight /></Button>
        </div>
      </div>

      <Dialog open={detail !== null} onOpenChange={(open) => { if (!open) setDetail(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="capitalize">{detail !== null ? trends[detail]?.query : "Search"}</DialogTitle><DialogDescription>Sample research · India · last 7 days</DialogDescription></DialogHeader>
          {detail !== null && <>
            <div className="grid grid-cols-3 gap-4 rounded-xl border border-border p-4">
              <div><p className="text-[11px] text-muted-foreground">Searches/mo</p><p className="mt-1 text-lg font-light">{trends[detail]?.volume}</p></div>
              <div><p className="text-[11px] text-muted-foreground">Growth</p><p className="mt-1 text-lg font-light text-success">+{trends[detail]?.growth}%</p></div>
              <div><p className="text-[11px] text-muted-foreground">Competition</p><p className="mt-1 text-lg font-light">{trends[detail]?.competition}</p></div>
            </div>
            <p className="text-sm text-muted-foreground">Intent: {trends[detail]?.intent}. Matches books you already sell. The agent checks the pages ranking today before it writes anything.</p>
            <Button className="rounded-full" onClick={() => { setSelected(detail); setStage(2); setPublished(false); setRunning(true); setDetail(null); }}>Build a page for this</Button>
          </>}
        </DialogContent>
      </Dialog>

      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="max-h-[85dvh] max-w-xl overflow-y-auto">
          <DialogHeader><DialogTitle>Review page draft</DialogTitle><DialogDescription className="font-mono text-[11px]">/collections/{slug}</DialogDescription></DialogHeader>
          <img src={booksImage} width={992} height={672} alt="Hardcover poetry collection" className="aspect-[2] w-full rounded-xl object-cover" />
          <h3 className="font-serif text-2xl capitalize">{topic.query}</h3>
          <p className="text-sm leading-6 text-muted-foreground">Poetry that reads in two languages. Browse Whispers of Dawn in English and Arabic, plus every edition we stock.</p>
          <div className="flex flex-wrap gap-1.5">{checks.map((c) => <span key={c.label} className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px]"><Check className="h-3 w-3 text-success" />{c.label}</span>)}</div>
          <p className="text-xs text-muted-foreground">Publishing here only updates this demo. No live website is changed.</p>
          <Button className="rounded-full" onClick={publish} disabled={published || stage < 3}>{published ? "Published in demo" : "Approve & publish"}</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={history} onOpenChange={setHistory}>
        <DialogContent className="max-h-[85dvh] max-w-md overflow-y-auto">
          <DialogHeader><DialogTitle>Today’s activity</DialogTitle><DialogDescription>Every step the agent took, in order.</DialogDescription></DialogHeader>
          <div className="divide-y divide-border">{activity.map((e) => <div key={e.time} className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 py-3 text-[13px]"><span className="font-mono text-[11px] text-muted-foreground">{e.time}</span><p>{e.text}{e.winner && ` ${topic.query}`}</p></div>)}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
