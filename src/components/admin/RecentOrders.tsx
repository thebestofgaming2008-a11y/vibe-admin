import { Link } from "@tanstack/react-router";
import { useOrders, statusMeta } from "@/lib/orders-store";

function fmtAmount(n: number) {
  return `$${n.toFixed(2)}`;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function RecentOrders() {
  const orders = useOrders();
  const recent = orders.slice(0, 6);
  return (
    <div className="rounded-lg bg-card border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        <h3 className="text-[13px] font-medium text-foreground">Recent Orders</h3>
        <Link to="/orders" className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">
          View all →
        </Link>
      </div>

      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead>
            <tr className="border-t border-border">
              <th className="text-left text-[11px] font-normal text-muted-foreground px-6 py-2.5">Order</th>
              <th className="text-left text-[11px] font-normal text-muted-foreground px-6 py-2.5">Customer</th>
              <th className="text-left text-[11px] font-normal text-muted-foreground px-6 py-2.5 hidden md:table-cell">Product</th>
              <th className="text-right text-[11px] font-normal text-muted-foreground px-6 py-2.5">Amount</th>
              <th className="text-left text-[11px] font-normal text-muted-foreground px-6 py-2.5">Status</th>
              <th className="text-right text-[11px] font-normal text-muted-foreground px-6 py-2.5 hidden lg:table-cell">Date</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((order) => {
              const meta = statusMeta[order.status];
              return (
                <tr key={order.id} className="border-t border-border hover:bg-accent/50 transition-colors">
                  <td className="px-6 py-3 text-[13px] font-medium text-foreground font-mono">{order.id}</td>
                  <td className="px-6 py-3 text-[13px] text-foreground">{order.customer}</td>
                  <td className="px-6 py-3 text-[13px] text-muted-foreground hidden md:table-cell">{order.product}</td>
                  <td className="px-6 py-3 text-[13px] font-medium text-foreground text-right font-mono">{fmtAmount(order.amount)}</td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground whitespace-nowrap">
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-[12px] text-muted-foreground text-right hidden lg:table-cell">{fmtDate(order.date)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="sm:hidden border-t border-border divide-y divide-border">
        {recent.map((order) => {
          const meta = statusMeta[order.status];
          return (
            <li key={order.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[12px] font-mono text-muted-foreground">{order.id}</span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-[13px] font-medium text-foreground truncate">{order.customer}</p>
                  <p className="text-[12px] text-muted-foreground truncate">{order.product}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[13px] font-semibold text-foreground font-mono">{fmtAmount(order.amount)}</p>
                  <p className="text-[11px] text-muted-foreground">{fmtDate(order.date)}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
