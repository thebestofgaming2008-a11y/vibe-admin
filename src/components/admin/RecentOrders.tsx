import { orders, statusMeta } from "@/lib/orders-data";

export function RecentOrders() {
  const recent = orders.slice(0, 6);
  return (
    <div className="rounded-lg bg-card border border-border">
      <div className="flex items-center justify-between px-6 py-4">
        <h3 className="text-[13px] font-medium text-foreground">Recent Orders</h3>
        <button className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">
          View all →
        </button>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-t border-border">
            <th className="text-left text-[11px] font-normal text-muted-foreground px-6 py-2.5">Order</th>
            <th className="text-left text-[11px] font-normal text-muted-foreground px-6 py-2.5">Customer</th>
            <th className="text-left text-[11px] font-normal text-muted-foreground px-6 py-2.5 hidden sm:table-cell">Product</th>
            <th className="text-right text-[11px] font-normal text-muted-foreground px-6 py-2.5">Amount</th>
            <th className="text-left text-[11px] font-normal text-muted-foreground px-6 py-2.5">Status</th>
            <th className="text-right text-[11px] font-normal text-muted-foreground px-6 py-2.5 hidden md:table-cell">Date</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((order) => {
            const meta = statusMeta[order.status];
            return (
              <tr key={order.id} className="border-t border-border hover:bg-accent/50 transition-colors">
                <td className="px-6 py-3 text-[13px] font-medium text-foreground font-mono">{order.id}</td>
                <td className="px-6 py-3 text-[13px] text-foreground">{order.customer}</td>
                <td className="px-6 py-3 text-[13px] text-muted-foreground hidden sm:table-cell">{order.product}</td>
                <td className="px-6 py-3 text-[13px] font-medium text-foreground text-right font-mono">{order.amount}</td>
                <td className="px-6 py-3">
                  <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                </td>
                <td className="px-6 py-3 text-[12px] text-muted-foreground text-right hidden md:table-cell">{order.date}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
