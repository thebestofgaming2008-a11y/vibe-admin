const orders = [
  { id: "#3421", customer: "Sarah Chen", product: "Wireless Headphones", amount: "$129.99", status: "Completed", time: "2m ago" },
  { id: "#3420", customer: "James Wilson", product: "Laptop Stand Pro", amount: "$79.50", status: "Processing", time: "15m ago" },
  { id: "#3419", customer: "Emily Park", product: "USB-C Hub", amount: "$45.00", status: "Completed", time: "1h ago" },
  { id: "#3418", customer: "Michael Brown", product: "Mechanical Keyboard", amount: "$159.00", status: "Shipped", time: "2h ago" },
  { id: "#3417", customer: "Lisa Rodriguez", product: "Monitor Light Bar", amount: "$54.99", status: "Pending", time: "3h ago" },
];

const statusStyles: Record<string, string> = {
  Completed: "bg-success/15 text-success",
  Processing: "bg-info/15 text-info",
  Shipped: "bg-primary/15 text-primary",
  Pending: "bg-muted text-muted-foreground",
};

export function RecentOrders() {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between p-6 pb-4">
        <div>
          <h3 className="text-sm font-medium text-card-foreground">Recent Orders</h3>
          <p className="text-[13px] text-muted-foreground mt-0.5">Latest transactions</p>
        </div>
        <button className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
          View all
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-t border-border">
              <th className="text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground px-6 py-3">Order</th>
              <th className="text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground px-6 py-3">Customer</th>
              <th className="text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground px-6 py-3 hidden sm:table-cell">Product</th>
              <th className="text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground px-6 py-3">Amount</th>
              <th className="text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground px-6 py-3">Status</th>
              <th className="text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground px-6 py-3 hidden md:table-cell">Time</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-border hover:bg-surface/50 transition-colors">
                <td className="px-6 py-3.5 text-sm font-medium text-card-foreground">{order.id}</td>
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center text-[11px] font-medium text-surface-foreground">
                      {order.customer.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <span className="text-sm text-card-foreground">{order.customer}</span>
                  </div>
                </td>
                <td className="px-6 py-3.5 text-sm text-muted-foreground hidden sm:table-cell">{order.product}</td>
                <td className="px-6 py-3.5 text-sm font-medium text-card-foreground text-right">{order.amount}</td>
                <td className="px-6 py-3.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${statusStyles[order.status] || ""}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-[13px] text-muted-foreground text-right hidden md:table-cell">{order.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
