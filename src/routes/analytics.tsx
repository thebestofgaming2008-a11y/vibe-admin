import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { RangeToggle } from "@/components/admin/RangeToggle";
import { TrendChart } from "@/components/admin/TrendChart";
import {
  summarizeRange,
  getRangeData,
  instagramSources,
  topInstagramPosts,
  repeatCustomerData,
  topProductsData,
  type RangeKey,
} from "@/lib/orders-store";
import { Instagram, Repeat, Heart } from "lucide-react";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
  head: () => ({
    meta: [
      { title: "Analytics — Store Management" },
      { name: "description", content: "Sales and customer analytics for your store" },
      { property: "og:title", content: "Analytics — Store Management" },
      { property: "og:description", content: "Sales and customer analytics for your store" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type Metric = "revenue" | "orders" | "visitors";

const metricMeta: Record<Metric, { label: string; format: (n: number) => string }> = {
  revenue: { label: "Revenue", format: (n) => `₹${n.toLocaleString()}` },
  orders: { label: "Orders", format: (n) => n.toLocaleString() },
  visitors: { label: "Visitors", format: (n) => n.toLocaleString() },
};

function ChangeBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span className={`text-[11px] font-medium tabular-nums ${positive ? "text-success" : "text-destructive"}`}>
      {positive ? "+" : ""}{value.toFixed(1)}%
    </span>
  );
}

function KpiCard({
  label, value, change, active, onClick,
}: { label: string; value: string; change: number; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-lg border p-4 sm:p-5 transition-all ${
        active ? "bg-card border-foreground/30 shadow-sm" : "bg-card border-border hover:border-foreground/20"
      }`}
    >
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-2 mt-1.5">
        <span className="text-[20px] font-semibold tracking-tight text-foreground tabular-nums">{value}</span>
        <ChangeBadge value={change} />
      </div>
    </button>
  );
}

function AnalyticsPage() {
  const [range, setRange] = useState<RangeKey>("30d");
  const [metric, setMetric] = useState<Metric>("revenue");
  const summary = summarizeRange(range);
  const data = getRangeData(range);

  const totalProductRevenue = topProductsData.reduce((a, b) => a + b.revenue, 0);
  const totalIgOrders = instagramSources.reduce((a, b) => a + b.orders, 0);

  return (
    <AdminShell title="Analytics" subtitle="Store performance">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[12px] text-muted-foreground">
          Compared to previous {range === "7d" ? "7" : range === "30d" ? "30" : "90"} days
        </p>
        <RangeToggle value={range} onChange={setRange} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Revenue" value={`₹${summary.revenue.value.toLocaleString()}`} change={summary.revenue.change} active={metric === "revenue"} onClick={() => setMetric("revenue")} />
        <KpiCard label="Orders" value={summary.orders.value.toLocaleString()} change={summary.orders.change} active={metric === "orders"} onClick={() => setMetric("orders")} />
        <KpiCard label="Visitors" value={summary.visitors.value.toLocaleString()} change={summary.visitors.change} active={metric === "visitors"} onClick={() => setMetric("visitors")} />
        <KpiCard label="Avg order value" value={`₹${summary.aov.value.toFixed(0)}`} change={summary.aov.change} />
      </div>

      <div className="rounded-lg bg-card border border-border p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
          <div>
            <h3 className="text-[13px] font-medium text-foreground">{metricMeta[metric].label} over time</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Conversion rate {summary.conversion.value.toFixed(2)}% <ChangeBadge value={summary.conversion.change} />
            </p>
          </div>
        </div>
        <TrendChart data={data} dataKey={metric} variant={metric === "orders" ? "bar" : "area"} height={240} formatValue={metricMeta[metric].format} />
      </div>

      {/* Instagram performance — primary acquisition channel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="rounded-lg bg-card border border-border p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Instagram className="w-4 h-4 text-foreground" />
              <h3 className="text-[13px] font-medium text-foreground">Instagram channels</h3>
            </div>
            <span className="text-[11px] text-muted-foreground">{totalIgOrders} orders</span>
          </div>
          <ul className="space-y-3.5">
            {instagramSources.map((s) => (
              <li key={s.name}>
                <div className="flex items-center justify-between mb-1.5 gap-2 text-[12px]">
                  <div className="min-w-0">
                    <span className="text-foreground truncate block">{s.name}</span>
                    <span className="text-[10.5px] text-muted-foreground">{s.note}</span>
                  </div>
                  <span className="text-muted-foreground font-mono shrink-0">
                    {s.orders} <span className="opacity-60">· {s.value}%</span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                  <div className="h-full rounded-full bg-foreground/25" style={{ width: `${s.value}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg bg-card border border-border p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-foreground" />
              <h3 className="text-[13px] font-medium text-foreground">Top performing posts</h3>
            </div>
            <span className="text-[11px] text-muted-foreground">By orders driven</span>
          </div>
          <ul className="space-y-3">
            {topInstagramPosts.map((p, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-1">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded bg-surface text-muted-foreground">{p.type}</span>
                    <span className="text-[12px] text-foreground truncate">{p.caption}</span>
                  </div>
                  <span className="text-[10.5px] text-muted-foreground">
                    Reach {p.reach.toLocaleString()} · CVR {(p.cvr * 100).toFixed(1)}%
                  </span>
                </div>
                <span className="text-[13px] font-semibold tabular-nums text-foreground shrink-0">{p.orders}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* New: customer retention block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="rounded-lg bg-card border border-border p-5 sm:p-6 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Repeat className="w-4 h-4 text-foreground" />
            <h3 className="text-[13px] font-medium text-foreground">Customer retention</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] text-muted-foreground">Repeat rate</span>
                <span className="text-[18px] font-semibold tabular-nums text-foreground">{repeatCustomerData.repeatRate}%</span>
              </div>
              <div className="h-1.5 mt-1.5 rounded-full bg-surface overflow-hidden">
                <div className="h-full bg-foreground/30" style={{ width: `${repeatCustomerData.repeatRate}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <p className="text-[11px] text-muted-foreground">New customers</p>
                <p className="text-[15px] font-medium tabular-nums">{repeatCustomerData.newCustomers}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Returning</p>
                <p className="text-[15px] font-medium tabular-nums">{repeatCustomerData.returning}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[11px] text-muted-foreground">Avg orders / customer</p>
                <p className="text-[15px] font-medium tabular-nums">{repeatCustomerData.avgOrdersPerCustomer.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-card border border-border p-5 sm:p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[13px] font-medium text-foreground">Top repeat customers</h3>
            <span className="text-[11px] text-muted-foreground">Last 90 days</span>
          </div>
          <ul className="space-y-3">
            {repeatCustomerData.topRepeat.map((c) => (
              <li key={c.name} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center text-[11px] font-medium text-foreground">
                    {c.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <span className="text-[13px] text-foreground truncate">{c.name}</span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-[12px] text-muted-foreground font-mono">{c.orders} orders</span>
                  <span className="text-[13px] font-medium tabular-nums">₹{c.spent}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Top products */}
      <div className="rounded-lg bg-card border border-border p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[13px] font-medium text-foreground">Top products</h3>
          <span className="text-[11px] text-muted-foreground">By revenue</span>
        </div>
        <ul className="space-y-3.5">
          {topProductsData.map((p) => {
            const pct = (p.revenue / totalProductRevenue) * 100;
            return (
              <li key={p.name}>
                <div className="flex items-center justify-between mb-1.5 gap-2 text-[12px]">
                  <span className="text-foreground truncate">{p.name}</span>
                  <span className="text-muted-foreground font-mono shrink-0">
                    ₹{p.revenue.toLocaleString()} <span className="opacity-60">· {p.sales}</span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                  <div className="h-full rounded-full bg-foreground/25" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Conversion funnel — pushed down */}
      <div className="rounded-lg bg-card border border-border p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[13px] font-medium text-foreground">Conversion funnel</h3>
          <span className="text-[11px] text-muted-foreground">Visitors → Buyers</span>
        </div>
        {(() => {
          const visitors = summary.visitors.value;
          const productViews = Math.round(visitors * 0.44);
          const addToCart = Math.round(visitors * 0.12);
          const checkout = Math.round(visitors * 0.05);
          const purchased = summary.orders.value;
          const steps = [
            { label: "Visitors", value: visitors },
            { label: "Product views", value: productViews },
            { label: "Added to cart", value: addToCart },
            { label: "Checkout started", value: checkout },
            { label: "Purchased", value: purchased },
          ];
          return (
            <div className="space-y-3.5">
              {steps.map((s) => {
                const pct = (s.value / Math.max(1, visitors)) * 100;
                return (
                  <div key={s.label}>
                    <div className="flex items-center justify-between mb-1.5 text-[12px] gap-2">
                      <span className="text-foreground truncate">{s.label}</span>
                      <span className="text-muted-foreground font-mono shrink-0">
                        {s.value.toLocaleString()} <span className="opacity-60">· {pct.toFixed(1)}%</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                      <div className="h-full rounded-full bg-foreground/20" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </AdminShell>
  );
}
