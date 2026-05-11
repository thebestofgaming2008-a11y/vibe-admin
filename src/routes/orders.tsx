import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { orders, statusMeta, type OrderStatus } from "@/lib/orders-data";
import { PackageOpen, AlertCircle, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/orders")({
  component: OrdersPage,
  head: () => ({
    meta: [
      { title: "Orders — Store Management" },
      { name: "description", content: "Manage and fulfill customer orders" },
    ],
  }),
});

type FilterKey = "unshipped" | "shipped_no_tracking" | "delivered";

const filters: { key: FilterKey; label: string; description: string; icon: LucideIcon; status: OrderStatus }[] = [
  { key: "unshipped", label: "Not shipped yet", description: "Awaiting fulfillment", icon: PackageOpen, status: "unshipped" },
  { key: "shipped_no_tracking", label: "Shipped, no tracking", description: "Add a tracking ID", icon: AlertCircle, status: "shipped_no_tracking" },
  { key: "delivered", label: "Delivered", description: "Arrived to customer", icon: CheckCircle2, status: "delivered" },
];

function OrdersPage() {
  const [active, setActive] = useState<FilterKey>("unshipped");

  const counts = {
    unshipped: orders.filter((o) => o.status === "unshipped").length,
    shipped_no_tracking: orders.filter((o) => o.status === "shipped_no_tracking").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };

  const activeStatus = filters.find((f) => f.key === active)!.status;
  const visible = orders.filter((o) => o.status === activeStatus);

  return (
    <AdminShell title="Orders" subtitle={`${orders.length} total`}>
      {/* Filter rectangles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {filters.map((f) => {
          const isActive = active === f.key;
          const Icon = f.icon;
          return (
            <button
              key={f.key}
              onClick={() => setActive(f.key)}
              className={`text-left rounded-lg border p-4 sm:p-5 transition-all ${
                isActive
                  ? "bg-card border-foreground/30 shadow-sm"
                  : "bg-card border-border hover:border-foreground/20"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] text-muted-foreground">{f.label}</span>
                <Icon className={`w-4 h-4 ${isActive ? "text-foreground" : "text-muted-foreground/60"}`} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[24px] font-semibold tracking-tight text-foreground tabular-nums">
                  {counts[f.key]}
                </span>
                <span className="text-[11px] text-muted-foreground">{f.description}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Orders table for active filter */}
      <div className="rounded-lg bg-card border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border">
          <h3 className="text-[13px] font-medium text-foreground">
            {filters.find((f) => f.key === active)!.label}
          </h3>
          <span className="text-[11px] text-muted-foreground">{visible.length} orders</span>
        </div>

        {visible.length === 0 ? (
          <div className="px-6 py-12 text-center text-[13px] text-muted-foreground">
            No orders in this category.
          </div>
        ) : (
          <>
            {/* Desktop / tablet table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr>
                    <th className="text-left text-[11px] font-normal text-muted-foreground px-6 py-2.5">Order</th>
                    <th className="text-left text-[11px] font-normal text-muted-foreground px-6 py-2.5">Customer</th>
                    <th className="text-left text-[11px] font-normal text-muted-foreground px-6 py-2.5 hidden md:table-cell">Product</th>
                    <th className="text-right text-[11px] font-normal text-muted-foreground px-6 py-2.5">Amount</th>
                    <th className="text-left text-[11px] font-normal text-muted-foreground px-6 py-2.5 hidden lg:table-cell">Tracking</th>
                    <th className="text-right text-[11px] font-normal text-muted-foreground px-6 py-2.5">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((o) => {
                    const meta = statusMeta[o.status];
                    return (
                      <tr key={o.id} className="border-t border-border hover:bg-accent/50 transition-colors">
                        <td className="px-6 py-3 text-[13px] font-medium text-foreground font-mono">{o.id}</td>
                        <td className="px-6 py-3 text-[13px] text-foreground">{o.customer}</td>
                        <td className="px-6 py-3 text-[13px] text-muted-foreground hidden md:table-cell">{o.product}</td>
                        <td className="px-6 py-3 text-[13px] font-medium text-foreground text-right font-mono">{o.amount}</td>
                        <td className="px-6 py-3 text-[12px] text-muted-foreground font-mono hidden lg:table-cell">
                          {o.tracking ?? <span className="text-muted-foreground/50">—</span>}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <button className="text-[12px] font-medium text-foreground hover:underline whitespace-nowrap">
                            {o.status === "unshipped" && "Mark shipped"}
                            {o.status === "shipped_no_tracking" && "Add tracking"}
                            {o.status === "delivered" && "View"}
                          </button>
                          <span className="sr-only">{meta.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <ul className="sm:hidden divide-y divide-border">
              {visible.map((o) => (
                <li key={o.id} className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[12px] font-mono text-muted-foreground">{o.id}</span>
                        <span className="text-[11px] text-muted-foreground">·</span>
                        <span className="text-[11px] text-muted-foreground">{o.date}</span>
                      </div>
                      <p className="text-[13px] font-medium text-foreground truncate">{o.customer}</p>
                      <p className="text-[12px] text-muted-foreground truncate">{o.product}</p>
                    </div>
                    <span className="text-[13px] font-semibold text-foreground font-mono shrink-0">{o.amount}</span>
                  </div>
                  {o.tracking && (
                    <p className="text-[11px] text-muted-foreground font-mono truncate mb-2">{o.tracking}</p>
                  )}
                  <button className="text-[12px] font-medium text-foreground hover:underline">
                    {o.status === "unshipped" && "Mark shipped →"}
                    {o.status === "shipped_no_tracking" && "Add tracking →"}
                    {o.status === "delivered" && "View →"}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </AdminShell>
  );
}
