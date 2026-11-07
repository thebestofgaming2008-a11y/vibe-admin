import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useOrders, statusMeta, ordersActions, type OrderStatus, type Order } from "@/lib/orders-store";
import { PackageOpen, AlertCircle, CheckCircle2, Search, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/orders")({
  component: OrdersPage,
  head: () => ({
    meta: [
      { title: "Orders — Store Management" },
      { name: "description", content: "Manage and fulfill customer orders" },
      { property: "og:title", content: "Orders — Store Management" },
      { property: "og:description", content: "Manage and fulfill customer orders" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type FilterKey = "all" | "unshipped" | "shipped_no_tracking" | "in_transit" | "delivered";

const filters: { key: FilterKey; label: string; description: string; icon: LucideIcon; status?: OrderStatus }[] = [
  { key: "unshipped", label: "Not shipped", description: "Awaiting fulfillment", icon: PackageOpen, status: "unshipped" },
  { key: "shipped_no_tracking", label: "No tracking", description: "Add a tracking ID", icon: AlertCircle, status: "shipped_no_tracking" },
  { key: "in_transit", label: "In transit", description: "On the way", icon: Truck, status: "in_transit" },
  { key: "delivered", label: "Delivered", description: "Arrived to customer", icon: CheckCircle2, status: "delivered" },
];

function fmtAmount(n: number) {
  return `$${n.toFixed(2)}`;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function OrdersPage() {
  const orders = useOrders();
  const [active, setActive] = useState<FilterKey>("unshipped");
  const [query, setQuery] = useState("");
  const [trackingFor, setTrackingFor] = useState<Order | null>(null);
  const [trackingValue, setTrackingValue] = useState("");

  const counts = useMemo(
    () => ({
      all: orders.length,
      unshipped: orders.filter((o) => o.status === "unshipped").length,
      shipped_no_tracking: orders.filter((o) => o.status === "shipped_no_tracking").length,
      in_transit: orders.filter((o) => o.status === "in_transit").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
    }),
    [orders],
  );

  const visible = useMemo(() => {
    const f = filters.find((x) => x.key === active);
    let list = f?.status ? orders.filter((o) => o.status === f.status) : orders;
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.customer.toLowerCase().includes(q) ||
          o.product.toLowerCase().includes(q) ||
          (o.tracking ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [orders, active, query]);

  function handleAction(o: Order) {
    if (o.status === "unshipped") {
      ordersActions.markShipped(o.id);
      toast.success(`Marked ${o.id} as shipped`);
    } else if (o.status === "shipped_no_tracking") {
      setTrackingFor(o);
      setTrackingValue("");
    } else if (o.status === "in_transit") {
      ordersActions.markDelivered(o.id);
      toast.success(`Marked ${o.id} as delivered`);
    }
  }

  function actionLabel(s: OrderStatus) {
    if (s === "unshipped") return "Mark shipped";
    if (s === "shipped_no_tracking") return "Add tracking";
    if (s === "in_transit") return "Mark delivered";
    return "View";
  }

  function submitTracking() {
    if (!trackingFor) return;
    if (trackingValue.trim().length < 5) {
      toast.error("Enter a valid tracking number");
      return;
    }
    ordersActions.addTracking(trackingFor.id, trackingValue.trim());
    toast.success(`Tracking added to ${trackingFor.id}`);
    setTrackingFor(null);
  }

  return (
    <AdminShell title="Orders" subtitle={`${orders.length} total`}>
      {/* Filter rectangles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {filters.map((f) => {
          const isActive = active === f.key;
          const Icon = f.icon;
          return (
            <button
              key={f.key}
              onClick={() => setActive(f.key)}
              className={`text-left rounded-lg border p-4 transition-all ${
                isActive
                  ? "bg-card border-foreground/30 shadow-sm"
                  : "bg-card border-border hover:border-foreground/20"
              }`}
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[12px] text-muted-foreground truncate">{f.label}</span>
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-foreground" : "text-muted-foreground/60"}`} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[22px] font-semibold tracking-tight text-foreground tabular-nums">
                  {counts[f.key]}
                </span>
                <span className="text-[11px] text-muted-foreground line-clamp-1">{f.description}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search + filter chip */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by order, customer, product, tracking…"
            className="w-full h-9 pl-8 pr-3 rounded-md bg-card border border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <button
          onClick={() => setActive("all")}
          className={`h-9 px-3 rounded-md border text-[12px] transition-colors ${
            active === "all"
              ? "bg-foreground text-background border-foreground"
              : "bg-card border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          All ({counts.all})
        </button>
      </div>

      {/* Orders table for active filter */}
      <div className="rounded-lg bg-card border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border">
          <h3 className="text-[13px] font-medium text-foreground">
            {filters.find((f) => f.key === active)?.label ?? "All orders"}
          </h3>
          <span className="text-[11px] text-muted-foreground">{visible.length} orders</span>
        </div>

        {visible.length === 0 ? (
          <div className="px-6 py-12 text-center text-[13px] text-muted-foreground">
            No orders match your filters.
          </div>
        ) : (
          <>
            {/* Desktop / tablet table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full min-w-[680px]">
                <thead>
                  <tr>
                    <th className="text-left text-[11px] font-normal text-muted-foreground px-6 py-2.5">Order</th>
                    <th className="text-left text-[11px] font-normal text-muted-foreground px-6 py-2.5">Customer</th>
                    <th className="text-left text-[11px] font-normal text-muted-foreground px-6 py-2.5 hidden md:table-cell">Product</th>
                    <th className="text-right text-[11px] font-normal text-muted-foreground px-6 py-2.5">Amount</th>
                    <th className="text-left text-[11px] font-normal text-muted-foreground px-6 py-2.5 hidden lg:table-cell">Tracking</th>
                    <th className="text-left text-[11px] font-normal text-muted-foreground px-6 py-2.5">Status</th>
                    <th className="text-right text-[11px] font-normal text-muted-foreground px-6 py-2.5">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((o) => {
                    const meta = statusMeta[o.status];
                    return (
                      <tr key={o.id} className="border-t border-border hover:bg-accent/50 transition-colors">
                        <td className="px-6 py-3 text-[13px] font-medium text-foreground font-mono">{o.id}</td>
                        <td className="px-6 py-3 text-[13px] text-foreground">
                          <div className="flex flex-col">
                            <span>{o.customer}</span>
                            <span className="text-[11px] text-muted-foreground">{fmtDate(o.date)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-[13px] text-muted-foreground hidden md:table-cell">{o.product}</td>
                        <td className="px-6 py-3 text-[13px] font-medium text-foreground text-right font-mono">{fmtAmount(o.amount)}</td>
                        <td className="px-6 py-3 text-[12px] text-muted-foreground font-mono hidden lg:table-cell">
                          {o.tracking ?? <span className="text-muted-foreground/50">—</span>}
                        </td>
                        <td className="px-6 py-3">
                          <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground whitespace-nowrap">
                            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <button
                            onClick={() => handleAction(o)}
                            className="text-[12px] font-medium text-foreground hover:underline whitespace-nowrap"
                          >
                            {actionLabel(o.status)}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <ul className="sm:hidden divide-y divide-border">
              {visible.map((o) => {
                const meta = statusMeta[o.status];
                return (
                  <li key={o.id} className="px-4 py-3.5">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[12px] font-mono text-muted-foreground">{o.id}</span>
                          <span className="text-[11px] text-muted-foreground">·</span>
                          <span className="text-[11px] text-muted-foreground">{fmtDate(o.date)}</span>
                        </div>
                        <p className="text-[13px] font-medium text-foreground truncate">{o.customer}</p>
                        <p className="text-[12px] text-muted-foreground truncate">{o.product}</p>
                      </div>
                      <span className="text-[13px] font-semibold text-foreground font-mono shrink-0">{fmtAmount(o.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                      <button
                        onClick={() => handleAction(o)}
                        className="text-[12px] font-medium text-foreground hover:underline"
                      >
                        {actionLabel(o.status)} →
                      </button>
                    </div>
                    {o.tracking && (
                      <p className="text-[11px] text-muted-foreground font-mono truncate mt-1">{o.tracking}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      <Dialog open={!!trackingFor} onOpenChange={(v) => !v && setTrackingFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add tracking ID</DialogTitle>
            <DialogDescription>
              {trackingFor && `For order ${trackingFor.id} — ${trackingFor.customer}`}
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={trackingValue}
            onChange={(e) => setTrackingValue(e.target.value)}
            placeholder="e.g. 1Z999AA10123456789"
            onKeyDown={(e) => e.key === "Enter" && submitTracking()}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTrackingFor(null)}>
              Cancel
            </Button>
            <Button onClick={submitTracking}>Save tracking</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
