import { useEffect, useState } from "react";
import { ArrowUpRight, Check, ChevronRight, Circle, Clock3, ExternalLink, Pause, Play, RotateCcw, ShieldCheck, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import booksImage from "@/assets/poetry-books.jpg";

const trends = [
  { query: "bilingual poetry books", volume: "1.9k", growth: 340, competition: "Low", intent: "Buy", points: "0,23 10,24 20,21 30,22 40,16 50,17 60,7 70,3" },
  { query: "historical fiction india", volume: "2.4k", growth: 212, competition: "Medium", intent: "Buy", points: "0,25 10,23 20,23 30,19 40,20 50,12 60,10 70,5" },
  { query: "books for poetry lovers", volume: "880", growth: 126, competition: "Low", intent: "Buy", points: "0,25 10,21 20,22 30,16 40,17 50,10 60,12 70,6" },
  { query: "arabic edition novels", volume: "390", growth: 58, competition: "Medium", intent: "Buy", points: "0,23 10,18 20,21 30,15 40,18 50,10 60,14 70,8" },
  { query: "hardcover books online", volume: "720", growth: 41, competition: "High", intent: "Buy", points: "0,24 10,21 20,23 30,17 40,21 50,15 60,16 70,11" },
  { query: "poetry gifts for readers", volume: "3.1k", growth: 18, competition: "Low", intent: "Compare", points: "0,22 10,18 20,21 30,17 40,20 50,16 60,17 70,12" },
];
const steps = [
  { title: "Spot trends", note: "What people search" },
  { title: "Pick the winner", note: "Intent + competition" },
  { title: "Build the page", note: "Copy, links, schema" },
  { title: "Publish", note: "Checks + approval" },
  { title: "Track results", note: "Rankings + sales" },
];
const events = [
  { stage: 0, text: "Checked rising searches against your book catalog", time: "08:00:07" },
  { stage: 1, text: "Found 6 relevant searches trending this week", time: "08:00:19" },
  { stage: 1, text: "Compared buyer intent and competing pages", time: "08:00:31" },
  { stage: 2, text: "Selected bilingual poetry books", time: "08:00:43" },
  { stage: 2, text: "Up 340% · strong buyer intent · low competition", time: "08:00:48" },
  { stage: 2, text: "Built a collection page from your catalog facts", time: "08:01:03" },
  { stage: 3, text: "Title, links, mobile layout and schema checks passed", time: "08:01:24" },
  { stage: 3, text: "Draft ready. Waiting for your publishing approval", time: "08:01:32" },
  { stage: 4, text: "Demo page published. Ranking monitoring scheduled", time: "08:02:01" },
];

export function SeoAgent({ onReview, onResults }: { onReview: () => void; onResults: () => void }) {
  const [stage, setStage] = useState(2);
  const [running, setRunning] = useState(true);
  const [selected, setSelected] = useState(0);
  const [detail, setDetail] = useState<number | null>(null);
  const [preview, setPreview] = useState(false);
  const [published, setPublished] = useState(false);
  const [view, setView] = useState("run");
  useEffect(() => {
    if (!running || stage >= 3) return;
    const timer = window.setTimeout(() => setStage((s) => Math.min(3, s + 1)), 6500);
    return () => window.clearTimeout(timer);
  }, [stage, running]);
  const topic = trends[selected] ?? trends[0];
  const activity = events.filter((e) => e.stage <= stage);
  const restart = () => { setStage(0); setPublished(false); setRunning(true); };
  const publish = () => { setPublished(true); setStage(4); setPreview(false); };

  return (
    <div className="space-y-7">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:justify-between sm:items-center">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold text-foreground">SEO Agent</h2>
          <p className="mt-1 text-sm text-muted-foreground">Your next opportunity, already in motion.</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden xl:inline text-xs text-muted-foreground">Next scan in <span className="text-foreground">5h 12m</span></span>
          <span className="flex items-center gap-2 text-xs text-muted-foreground"><span className={`h-1.5 w-1.5 rounded-full ${running ? "bg-success" : "bg-muted-foreground"}`} />{!running ? "Paused" : stage === 3 ? "Awaiting review" : stage === 4 ? "Monitoring" : "Agent running"}</span>
          <Button variant="outline" size="icon" aria-label={running ? "Pause agent" : "Resume agent"} title={running ? "Pause agent" : "Resume agent"} onClick={() => setRunning(!running)}>{running ? <Pause /> : <Play />}</Button>
        </div>
      </header>

      <nav aria-label="Agent views" className="flex gap-6 border-b border-border">
        {[['run', 'Live run'], ['history', 'Activity history']].map(([id, label]) => <Button key={id} variant="ghost" onClick={() => setView(id)} aria-pressed={view === id} className={`rounded-none px-0 pb-4 hover:bg-transparent ${view === id ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"}`}>{label}</Button>)}
      </nav>

      {view === "run" ? <>
        <ol className="seo-steps grid grid-cols-5 gap-2 py-2" aria-label="Autopilot progress">
          {steps.map((step, i) => <li key={step.title} aria-current={i === stage ? "step" : undefined} className="relative min-w-0 text-center">
            <span className={`relative z-10 mx-auto mb-3 grid h-8 w-8 place-items-center rounded-full border text-xs font-medium ${i < stage ? "bg-success text-success-foreground border-success" : i === stage ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground border-border"}`}>{i < stage ? <Check className="h-4 w-4" /> : i + 1}</span>
            <p className={`text-xs font-medium sm:text-[13px] ${i <= stage ? "text-foreground" : "text-muted-foreground"}`}>{step.title}</p>
            <p className="mt-1 hidden sm:block text-[11px] text-muted-foreground">{step.note}</p>
          </li>)}
        </ol>

        <div className="grid min-w-0 grid-cols-1 divide-y divide-border xl:grid-cols-[1fr_0.95fr_1.15fr] xl:divide-x xl:divide-y-0 border-y border-border">
          <section className="min-w-0 py-6 xl:pr-6">
            <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">Trending searches</h3><span className="text-[11px] text-success">1 selected</span></div>
            <p className="mt-1 text-xs text-muted-foreground">India · last 7 days · matched to your catalog</p>
            <div className="mt-6 grid grid-cols-[minmax(0,1fr)_38px_48px_48px] gap-2 text-[10px] text-muted-foreground"><span>Search</span><span className="text-right">Volume</span><span className="text-center">Trend</span><span className="text-right">7 days</span></div>
            <ul className="mt-2 space-y-1">
              {trends.map((t, i) => <li key={t.query}><Button variant="ghost" onClick={() => setDetail(i)} className={`grid h-auto w-full grid-cols-[minmax(0,1fr)_38px_48px_48px] gap-2 rounded-md border px-2 py-3 text-left font-normal ${selected === i ? "border-border bg-accent/60" : "border-transparent"}`}>
                <span className="min-w-0 whitespace-normal text-xs leading-5">{t.query}</span><span className="text-right text-[11px] text-muted-foreground">{t.volume}</span>
                <svg viewBox="0 0 70 30" className="h-6 w-12 text-muted-foreground" aria-hidden="true"><polyline points={t.points} fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
                <span className={`text-right text-[11px] ${selected === i ? "font-semibold text-success" : "text-muted-foreground"}`}>+{t.growth}%</span>
              </Button></li>)}
            </ul>
            <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-[11px] text-muted-foreground"><span>312 searches checked</span><span>1 page queued</span></div>
          </section>

          <section className="min-w-0 py-6 xl:px-6">
            <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Agent activity</h3><span className="text-[11px] text-success">{running ? "Live" : "Paused"}</span></div>
            <p className="mt-1 text-xs text-muted-foreground">Today’s run · started at 08:00</p>
            <ol className="mt-7 space-y-5">
              {activity.map((e, i) => <li key={e.text} className="relative grid grid-cols-[16px_minmax(0,1fr)] gap-3">
                {i < activity.length - 1 && <span className="absolute left-[7px] top-5 h-[calc(100%+4px)] border-l border-border" />}
                {i === activity.length - 1 ? <Circle className="mt-0.5 h-3.5 w-3.5 text-foreground" /> : <Check className="mt-0.5 h-3.5 w-3.5 text-success" />}
                <div className="min-w-0"><p className={`text-xs leading-5 ${i === activity.length - 1 ? "font-medium text-foreground" : "text-muted-foreground"}`}>{e.text.replace("bilingual poetry books", topic.query)}</p><p className="mt-1 text-[10px] tabular-nums text-muted-foreground">{e.time}</p></div>
              </li>)}
            </ol>
            {stage === 3 && <Button variant="outline" size="sm" onClick={() => setPreview(true)} className="mt-5 w-full">Review draft <ChevronRight /></Button>}
          </section>

          <section className="min-w-0 py-6 xl:pl-6">
            <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">Page builder</h3><span className="rounded border border-border px-2 py-0.5 text-[10px] text-muted-foreground">{published ? "Published · demo" : stage >= 3 ? "Ready for review" : "Drafting"}</span></div>
            <p className="mt-1 text-xs text-muted-foreground">A new collection, built from your products.</p>
            <div className="mt-6 overflow-hidden rounded-md border border-border">
              <div className="flex items-center gap-1 border-b border-border bg-surface px-3 py-2"><span className="h-1 w-1 rounded-full bg-muted-foreground/40" /><span className="h-1 w-1 rounded-full bg-muted-foreground/40" /><span className="h-1 w-1 rounded-full bg-muted-foreground/40" /><span className="ml-2 min-w-0 truncate text-[9px] text-muted-foreground">yourstore.com/collections/{topic.query.replaceAll(' ', '-')}</span></div>
              <div className="bg-card p-4">
                <div className="flex items-center justify-between border-b border-border pb-3"><span className="font-serif text-base font-semibold">The Bookshop.</span><span className="text-[9px] text-muted-foreground">Books &nbsp; Authors &nbsp; About</span></div>
                <p className="mt-4 text-[9px] uppercase text-muted-foreground">A collection for curious readers</p>
                <h4 className="mt-2 font-serif text-xl capitalize leading-tight">{topic.query}</h4>
                <p className="mt-2 text-[10px] leading-4 text-muted-foreground">Discover poetry in more than one language. Explore editions from our independent book collection.</p>
                <img src={booksImage} alt="Sage and blush hardcover poetry books" width={992} height={672} className="mt-3 aspect-[1.8] w-full object-cover" />
                <div className="mt-3 flex items-center justify-between"><span className="text-[10px] text-muted-foreground">Whispers of Dawn · English & Arabic</span><span className="text-[10px] font-medium">Explore books →</span></div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2 text-[10px] text-muted-foreground">{["Title tag", "Meta description", "Internal links", "Mobile layout"].map((check) => <span className="inline-flex items-center gap-1" key={check}><Check className="h-3 w-3 text-success" />{check}</span>)}</div>
            <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border pt-4"><div className="min-w-0"><p className="text-xs truncate">{topic.query}</p><p className="mt-1 text-[10px] text-muted-foreground">Google position</p></div><span className="text-xs text-muted-foreground">{published ? "Monitoring" : "Not live yet"} —</span></div>
            <Button variant="ghost" size="sm" onClick={() => setPreview(true)} className="mt-2 w-full text-muted-foreground">Open page preview <ExternalLink /></Button>
          </section>
        </div>

        <div className="grid grid-cols-2 gap-y-6 sm:grid-cols-4 sm:divide-x sm:divide-border">
          {[{ label: "Pages improved", value: "47", delta: "+6 this week" }, { label: "Searches tracked", value: "318", delta: "+24 this week" }, { label: "Top 3 on Google", value: "61", delta: "+8 this month" }, { label: "Organic orders", value: "38", delta: "+12 this month" }].map((m, i) => <div key={m.label} className={`min-w-0 ${i ? "sm:pl-6" : ""}`}><p className="text-xs text-muted-foreground">{m.label}</p><div className="mt-2 flex flex-wrap items-baseline gap-3"><p className="text-3xl font-medium tabular-nums">{m.value}</p><span className="text-[10px] text-success">{m.delta}</span></div></div>)}
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t border-border pt-5"><div className="min-w-0 flex items-start gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-muted-foreground" /><p className="text-xs leading-5 text-muted-foreground">Safe updates run automatically. New pages need your approval.</p></div><Button variant="ghost" size="sm" onClick={onReview}>Controls <ChevronRight /></Button></div>
        <div className="flex justify-between gap-3"><Button variant="ghost" size="sm" onClick={restart} className="text-muted-foreground"><RotateCcw /> Replay demo</Button><Button variant="ghost" size="sm" onClick={onResults} className="text-muted-foreground">View results <ArrowUpRight /></Button></div>
      </> : <section><h3 className="text-sm font-semibold">Today’s activity</h3><div className="mt-4 divide-y divide-border">{activity.map((e) => <div key={e.text} className="grid grid-cols-[60px_minmax(0,1fr)] gap-4 py-4 text-xs"><span className="tabular-nums text-muted-foreground">{e.time}</span><p>{e.text}</p></div>)}</div></section>}

      <Dialog open={detail !== null} onOpenChange={(open) => { if (!open) setDetail(null); }}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>{detail !== null ? trends[detail]?.query : "Search opportunity"}</DialogTitle><DialogDescription>Sample research · India · last 7 days</DialogDescription></DialogHeader>{detail !== null && <><div className="grid grid-cols-3 gap-4 border-y border-border py-5"><div><p className="text-xs text-muted-foreground">Volume / month</p><p className="mt-2 font-semibold">{trends[detail]?.volume}</p></div><div><p className="text-xs text-muted-foreground">Growth</p><p className="mt-2 font-semibold text-success">+{trends[detail]?.growth}%</p></div><div><p className="text-xs text-muted-foreground">Competition</p><p className="mt-2 font-semibold">{trends[detail]?.competition}</p></div></div><p className="text-sm text-muted-foreground">Intent: {trends[detail]?.intent}. Matched to your existing books. The agent checks competing pages before preparing a draft.</p><Button onClick={() => { setSelected(detail); setStage(2); setPublished(false); setRunning(true); setDetail(null); }}>Use this opportunity <TrendingUp /></Button></>}</DialogContent></Dialog>
      <Dialog open={preview} onOpenChange={setPreview}><DialogContent className="max-w-xl max-h-[85dvh] overflow-y-auto"><DialogHeader><DialogTitle>Review page draft</DialogTitle><DialogDescription>Demo preview · /collections/{topic.query.replaceAll(' ', '-')}</DialogDescription></DialogHeader><img src={booksImage} width={992} height={672} alt="Hardcover poetry collection" className="aspect-[2] w-full rounded-md object-cover" /><h3 className="font-serif text-2xl capitalize">{topic.query}</h3><p className="text-sm leading-6 text-muted-foreground">Discover poetry in more than one language. Browse Whispers of Dawn in English and Arabic, and explore the available editions in our collection.</p><div className="border-y border-border py-4 text-xs text-muted-foreground">Title ✓ &nbsp; Description ✓ &nbsp; Internal links ✓ &nbsp; Mobile layout ✓</div><p className="text-xs text-muted-foreground">Publishing here only updates this demo. No live website is changed.</p><Button onClick={publish} disabled={published || stage < 3}>{published ? <Check /> : <Play />}{published ? "Published in demo" : stage < 3 ? "Checks in progress…" : "Approve & publish demo"}</Button></DialogContent></Dialog>
    </div>
  );
}