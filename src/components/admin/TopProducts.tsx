import { topProductsData } from "@/lib/orders-store";

const max = Math.max(...topProductsData.map((p) => p.revenue));

export function TopProducts() {
  return (
    <div className="rounded-lg bg-card border border-border p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[13px] font-medium text-foreground">Top Products</h3>
        <span className="text-[11px] text-muted-foreground">Last 30 days</span>
      </div>

      <div className="space-y-4">
        {topProductsData.map((p) => (
          <div key={p.name} className="group">
            <div className="flex items-center justify-between mb-1.5 gap-2">
              <span className="text-[13px] text-foreground truncate">{p.name}</span>
              <span className="text-[12px] text-muted-foreground font-mono shrink-0">
                ${p.revenue.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 rounded-full bg-surface overflow-hidden">
                <div
                  className="h-full rounded-full bg-foreground/15 group-hover:bg-foreground/25 transition-colors"
                  style={{ width: `${(p.revenue / max) * 100}%` }}
                />
              </div>
              <span className="text-[11px] text-muted-foreground tabular-nums w-12 text-right">
                {p.sales} sold
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
