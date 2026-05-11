import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useOrders } from "@/lib/orders-store";

export const Route = createFileRoute("/customers")({
  component: CustomersPage,
  head: () => ({
    meta: [
      { title: "Customers — Store Management" },
      { name: "description", content: "View and manage your customers" },
    ],
  }),
});

function CustomersPage() {
  const orders = useOrders();

  const customers = useMemo(() => {
    const map = new Map<string, { name: string; email: string; orders: number; spent: number; last: string }>();
    for (const o of orders) {
      const c = map.get(o.email) ?? { name: o.customer, email: o.email, orders: 0, spent: 0, last: o.date };
      c.orders += 1;
      c.spent += o.amount;
      if (new Date(o.date) > new Date(c.last)) c.last = o.date;
      map.set(o.email, c);
    }
    return Array.from(map.values()).sort((a, b) => b.spent - a.spent);
  }, [orders]);

  const totalSpent = customers.reduce((a, b) => a + b.spent, 0);

  return (
    <AdminShell title="Customers" subtitle={`${customers.length} total`}>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Stat label="Customers" value={customers.length.toString()} />
        <Stat label="Avg. lifetime value" value={`$${(totalSpent / Math.max(1, customers.length)).toFixed(2)}`} />
        <Stat label="Repeat buyers" value={customers.filter((c) => c.orders > 1).length.toString()} />
      </div>

      <div className="rounded-lg bg-card border border-border overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-border">
          <h3 className="text-[13px] font-medium text-foreground">All customers</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr>
                <th className="text-left text-[11px] font-normal text-muted-foreground px-6 py-2.5">Customer</th>
                <th className="text-left text-[11px] font-normal text-muted-foreground px-6 py-2.5 hidden md:table-cell">Email</th>
                <th className="text-right text-[11px] font-normal text-muted-foreground px-6 py-2.5">Orders</th>
                <th className="text-right text-[11px] font-normal text-muted-foreground px-6 py-2.5">Spent</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.email} className="border-t border-border hover:bg-accent/50 transition-colors">
                  <td className="px-6 py-3 text-[13px] text-foreground">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center text-[11px] font-medium text-surface-foreground">
                        {c.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}
                      </div>
                      {c.name}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-[12px] text-muted-foreground hidden md:table-cell">{c.email}</td>
                  <td className="px-6 py-3 text-[13px] text-muted-foreground text-right font-mono">{c.orders}</td>
                  <td className="px-6 py-3 text-[13px] font-medium text-foreground text-right font-mono">
                    ${c.spent.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-card border border-border p-4 sm:p-5">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <p className="text-[20px] font-semibold tracking-tight mt-1.5 tabular-nums text-foreground">{value}</p>
    </div>
  );
}
