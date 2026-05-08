const products = [
  { name: "Wireless Headphones", sales: 284, revenue: "$36,876", progress: 92 },
  { name: "Laptop Stand Pro", sales: 196, revenue: "$15,582", progress: 74 },
  { name: "USB-C Hub", sales: 165, revenue: "$7,425", progress: 58 },
  { name: "Mechanical Keyboard", sales: 142, revenue: "$22,578", progress: 48 },
  { name: "Monitor Light Bar", sales: 98, revenue: "$5,390", progress: 32 },
];

export function TopProducts() {
  return (
    <div className="rounded-lg bg-card border border-border p-6">
      <h3 className="text-[13px] font-medium text-foreground mb-5">Top Products</h3>

      <div className="space-y-4">
        {products.map((product) => (
          <div key={product.name} className="group">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13px] text-foreground">{product.name}</span>
              <span className="text-[12px] text-muted-foreground font-mono">{product.revenue}</span>
            </div>
            <div className="h-1 rounded-full bg-surface overflow-hidden">
              <div
                className="h-full rounded-full bg-foreground/15 group-hover:bg-foreground/25 transition-colors"
                style={{ width: `${product.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
