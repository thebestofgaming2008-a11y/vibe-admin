import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatCard } from "@/components/admin/StatCard";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { DollarSign, ShoppingCart, Users, Repeat } from "lucide-react";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
  head: () => ({
    meta: [
      { title: "Analytics — Store Management" },
      { name: "description", content: "Sales and customer analytics for your store" },
    ],
  }),
});

const channels = [
  { name: "Direct", value: 42 },
  { name: "Organic search", value: 28 },
  { name: "Email", value: 16 },
  { name: "Social", value: 9 },
  { name: "Referral", value: 5 },
];

function AnalyticsPage() {
  return (
    <AdminShell title="Analytics" subtitle="Last 30 days">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Revenue" value="$46,289" change="+12.5%" trend="up" icon={DollarSign} className="animate-fade-in" />
        <StatCard title="Orders" value="1,234" change="+8.2%" trend="up" icon={ShoppingCart} className="animate-fade-in-delay-1" />
        <StatCard title="New customers" value="312" change="+4.1%" trend="up" icon={Users} className="animate-fade-in-delay-2" />
        <StatCard title="Repeat rate" value="38%" change="-2.3%" trend="down" icon={Repeat} className="animate-fade-in-delay-3" />
      </div>

      <div className="animate-fade-in-delay-2">
        <RevenueChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg bg-card border border-border p-5 sm:p-6 animate-fade-in-delay-3">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[13px] font-medium text-foreground">Conversion funnel</h3>
            <span className="text-[11px] text-muted-foreground hidden sm:inline">Last 30 days</span>
          </div>
          <div className="space-y-4">
            {[
              { label: "Visitors", value: 48210, pct: 100 },
              { label: "Product views", value: 21340, pct: 44 },
              { label: "Added to cart", value: 5820, pct: 12 },
              { label: "Checkout started", value: 2410, pct: 5 },
              { label: "Purchased", value: 1234, pct: 2.6 },
            ].map((step) => (
              <div key={step.label}>
                <div className="flex items-center justify-between mb-1.5 text-[12px] gap-2">
                  <span className="text-foreground truncate">{step.label}</span>
                  <span className="text-muted-foreground font-mono shrink-0">
                    {step.value.toLocaleString()} <span className="opacity-60">· {step.pct}%</span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                  <div className="h-full rounded-full bg-foreground/20" style={{ width: `${step.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-card border border-border p-5 sm:p-6 animate-fade-in-delay-4">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[13px] font-medium text-foreground">Traffic sources</h3>
            <span className="text-[11px] text-muted-foreground hidden sm:inline">Share of sessions</span>
          </div>
          <div className="space-y-4">
            {channels.map((c) => (
              <div key={c.name}>
                <div className="flex items-center justify-between mb-1.5 text-[12px] gap-2">
                  <span className="text-foreground truncate">{c.name}</span>
                  <span className="text-muted-foreground font-mono shrink-0">{c.value}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                  <div className="h-full rounded-full bg-foreground/20" style={{ width: `${c.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
