import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PackageOpen, Truck, Clock, AlertCircle, ArrowRight } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { FulfillmentCard } from "@/components/admin/FulfillmentCard";
import { RecentOrders } from "@/components/admin/RecentOrders";
import { TopProducts } from "@/components/admin/TopProducts";
import { RangeToggle } from "@/components/admin/RangeToggle";
import { TrendChart } from "@/components/admin/TrendChart";
import { useOrders, summarizeRange, getRangeData, type RangeKey } from "@/lib/orders-store";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Store Management" },
      { name: "description", content: "Modern admin dashboard for webshop management" },
      { property: "og:title", content: "Admin Dashboard — Store Management" },
      { property: "og:description", content: "Modern admin dashboard for webshop management" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function Dashboard() {
  const orders = useOrders();
  const [range, setRange] = useState<RangeKey>("7d");
  const summary = summarizeRange(range);
  const data = getRangeData(range);

  const unshipped = orders.filter((o) => o.status === "unshipped").length;
  const shippedNoTracking = orders.filter((o) => o.status === "shipped_no_tracking").length;
  const inTransit = orders.filter((o) => o.status === "in_transit").length;
  const awaitingAction = unshipped + shippedNoTracking;

  return (
    <AdminShell title="Dashboard" subtitle="Fulfillment overview">
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[12px] font-medium uppercase tracking-widest text-muted-foreground">
            Needs your attention
          </h2>
          <Link to="/orders" className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            Go to orders <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <FulfillmentCard title="Awaiting shipment" count={unshipped} description="Orders not yet sent" icon={PackageOpen} accent="warning" className="animate-fade-in" />
          <FulfillmentCard title="Missing tracking" count={shippedNoTracking} description="Shipped without tracker" icon={AlertCircle} accent="info" className="animate-fade-in-delay-1" />
          <FulfillmentCard title="In transit" count={inTransit} description="On the way" icon={Truck} className="animate-fade-in-delay-2" />
          <FulfillmentCard title="To action" count={awaitingAction} description="Unshipped + missing tracking" icon={Clock} className="animate-fade-in-delay-3" />
        </div>
      </section>

      <div className="rounded-lg bg-card border border-border p-5 sm:p-6 animate-fade-in-delay-2">
        <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
          <div>
            <h3 className="text-[13px] font-medium text-foreground">Revenue</h3>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[22px] font-semibold tracking-tight text-foreground tabular-nums">
                ${summary.revenue.value.toLocaleString()}
              </span>
              <ChangeBadge value={summary.revenue.change} />
            </div>
          </div>
          <RangeToggle value={range} onChange={setRange} />
        </div>
        <TrendChart data={data} dataKey="revenue" height={160} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 animate-fade-in-delay-2 min-w-0">
          <RecentOrders />
        </div>
        <div className="lg:col-span-2 animate-fade-in-delay-3 min-w-0">
          <TopProducts />
        </div>
      </div>
    </AdminShell>
  );
}

function ChangeBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span className={`text-[11px] font-medium tabular-nums ${positive ? "text-success" : "text-destructive"}`}>
      {positive ? "+" : ""}{value.toFixed(1)}%
    </span>
  );
}
