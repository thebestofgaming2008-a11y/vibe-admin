const data = [
  { month: "Jan", revenue: 4200, orders: 180 },
  { month: "Feb", revenue: 5800, orders: 220 },
  { month: "Mar", revenue: 4900, orders: 195 },
  { month: "Apr", revenue: 7200, orders: 310 },
  { month: "May", revenue: 6800, orders: 290 },
  { month: "Jun", revenue: 8400, orders: 360 },
  { month: "Jul", revenue: 9100, orders: 385 },
];

const maxRevenue = Math.max(...data.map((d) => d.revenue));

export function RevenueChart() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-medium text-card-foreground">Revenue</h3>
          <p className="text-[13px] text-muted-foreground mt-0.5">Last 7 months performance</p>
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Revenue
          </span>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-3 h-48">
        {data.map((item) => {
          const height = (item.revenue / maxRevenue) * 100;
          return (
            <div key={item.month} className="flex-1 flex flex-col items-center gap-2 group">
              <span className="text-[11px] font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                ${(item.revenue / 1000).toFixed(1)}k
              </span>
              <div className="w-full relative">
                <div
                  className="w-full rounded-t-md bg-primary/20 group-hover:bg-primary/30 transition-colors relative overflow-hidden"
                  style={{ height: `${height * 1.6}px` }}
                >
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-t-md bg-primary transition-all"
                    style={{ height: `${height * 0.7}px` }}
                  />
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground">{item.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
