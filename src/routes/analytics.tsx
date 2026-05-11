import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { RangeToggle } from "@/components/admin/RangeToggle";
import { TrendChart } from "@/components/admin/TrendChart";
import {
  summarizeRange,
  getRangeData,
  trafficSources,
  topProductsData,
  type RangeKey,
} from "@/lib/orders-store";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
  head: () => ({
    meta: [
      { title: "Analytics — Store Management" },
      { name: "description", content: "Sales and customer analytics for your store" },
    ],
  }),
});

type Metric = "revenue" | "orders" | "visitors";

const metricMeta: Record<Metric, { label: string; format: (n: number) => string }> = {
  revenue: { label: "Revenue", format: (n) => `$${n.toLocaleString()}` },
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
  label,
  value,
  change,
  active,
  onClick,
}: {
  label: string;
  value: string;
  change: number;
  active?: boolean;
  onClick?: () => void;
}) {
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

  return (
    <AdminShell title="Analytics" subtitle="Store performance">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[12px] text-muted-foreground">
          Compared to previous {range === "7d" ? "7" : range === "30d" ? "30" : "90"} days
        </p>
        <RangeToggle value={range} onChange={setRange} />
      </div>

      {/* KPI cards: clicking a card swaps the chart metric */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="Revenue"
          value={`$${summary.revenue.value.toLocaleString()}`}
          change={summary.revenue.change}
          active={metric === "revenue"}
          onClick={() => setMetric("revenue")}
        />
        <KpiCard
          label="Orders"
          value={summary.orders.value.toLocaleString()}
          change={summary.orders.change}
          active={metric === "orders"}
          onClick={() => setMetric("orders")}
        />
        <KpiCard
          label="Visitors"
          value={summary.visitors.value.toLocaleString()}
          change={summary.visitors.change}
          active={metric === "visitors"}
          onClick={() => setMetric("visitors")}
        />
        <KpiCard
          label="Avg order value"
          value={`$${summary.aov.value.toFixed(2)}`}
          change={summary.aov.change}
        />
      </div>

      {/* Main chart */}
      <div className="rounded-lg bg-card border border-border p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
          <div>
            <h3 className="text-[13px] font-medium text-foreground">{metricMeta[metric].label} over time</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Conversion rate {summary.conversion.value.toFixed(2)}%{" "}
              <ChangeBadge value={summary.conversion.change} />
            </p>
          </div>
        </div>
        <TrendChart
          data={data}
          dataKey={metric}
          variant={metric === "orders" ? "bar" : "area"}
          height={240}
          formatValue={metricMeta[metric].format}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
                      ${p.revenue.toLocaleString()} <span className="opacity-60">· {p.sales}</span>
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

        <div className="rounded-lg bg-card border border-border p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[13px] font-medium text-foreground">Traffic sources</h3>
            <span className="text-[11px] text-muted-foreground">Share of sessions</span>
          </div>
          <ul className="space-y-3.5">
            {trafficSources.map((c) => (
              <li key={c.name}>
                <div className="flex items-center justify-between mb-1.5 gap-2 text-[12px]">
                  <span className="text-foreground truncate">{c.name}</span>
                  <span className="text-muted-foreground font-mono shrink-0">{c.value}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                  <div className="h-full rounded-full bg-foreground/20" style={{ width: `${c.value}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

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
