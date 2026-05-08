const orders = [
  { id: "#3421", customer: "Sarah Chen", product: "Wireless Headphones", amount: "$129.99", status: "Completed", time: "2m ago" },
  { id: "#3420", customer: "James Wilson", product: "Laptop Stand Pro", amount: "$79.50", status: "Processing", time: "15m ago" },
  { id: "#3419", customer: "Emily Park", product: "USB-C Hub", amount: "$45.00", status: "Completed", time: "1h ago" },
  { id: "#3418", customer: "Michael Brown", product: "Mechanical Keyboard", amount: "$159.00", status: "Shipped", time: "2h ago" },
  { id: "#3417", customer: "Lisa Rodriguez", product: "Monitor Light Bar", amount: "$54.99", status: "Pending", time: "3h ago" },
];

const statusDot: Record<string, string> = {
  Completed: "bg-success",
  Processing: "bg-info",
  Shipped: "bg-foreground",
  Pending: "bg-muted-foreground/40",
};

export function RecentOrders() {
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
            <th className="text-right text-[11px] font-normal text-muted-foreground px-6 py-2.5 hidden md:table-cell">Time</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-t border-border hover:bg-accent/50 transition-colors">
              <td className="px-6 py-3 text-[13px] font-medium text-foreground font-mono">{order.id}</td>
              <td className="px-6 py-3 text-[13px] text-foreground">{order.customer}</td>
              <td className="px-6 py-3 text-[13px] text-muted-foreground hidden sm:table-cell">{order.product}</td>
              <td className="px-6 py-3 text-[13px] font-medium text-foreground text-right font-mono">{order.amount}</td>
              <td className="px-6 py-3">
                <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
                  <span className={`w-1.5 h-1.5 rounded-full ${statusDot[order.status] || ""}`} />
                  {order.status}
                </span>
              </td>
              <td className="px-6 py-3 text-[12px] text-muted-foreground text-right hidden md:table-cell">{order.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
