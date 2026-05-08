const products = [
  { name: "Wireless Headphones", sales: 284, revenue: "$36,876", progress: 92 },
  { name: "Laptop Stand Pro", sales: 196, revenue: "$15,582", progress: 74 },
  { name: "USB-C Hub", sales: 165, revenue: "$7,425", progress: 58 },
  { name: "Mechanical Keyboard", sales: 142, revenue: "$22,578", progress: 48 },
  { name: "Monitor Light Bar", sales: 98, revenue: "$5,390", progress: 32 },
];

export function TopProducts() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-medium text-card-foreground">Top Products</h3>
          <p className="text-[13px] text-muted-foreground mt-0.5">Best sellers this month</p>
        </div>
      </div>

      <div className="space-y-4">
        {products.map((product, i) => (
          <div key={product.name} className="group">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-mono text-muted-foreground w-4">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm text-card-foreground group-hover:text-primary transition-colors">
                  {product.name}
                </span>
              </div>
              <div className="flex items-center gap-4 text-[13px]">
                <span className="text-muted-foreground">{product.sales} sales</span>
                <span className="font-medium text-card-foreground w-20 text-right">{product.revenue}</span>
              </div>
            </div>
            <div className="ml-6.5 h-1.5 rounded-full bg-surface overflow-hidden">
              <div
                className="h-full rounded-full bg-primary/60 transition-all group-hover:bg-primary"
                style={{ width: `${product.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
