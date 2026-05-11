const data = [
  { month: "Jan", revenue: 4200 },
  { month: "Feb", revenue: 5800 },
  { month: "Mar", revenue: 4900 },
  { month: "Apr", revenue: 7200 },
  { month: "May", revenue: 6800 },
  { month: "Jun", revenue: 8400 },
  { month: "Jul", revenue: 9100 },
];

const maxRevenue = Math.max(...data.map((d) => d.revenue));

export function RevenueChart() {
  return (
    <div className="rounded-lg bg-card border border-border p-5 sm:p-6">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <h3 className="text-[13px] font-medium text-foreground">Revenue</h3>
        <span className="text-[11px] text-muted-foreground">Last 7 months</span>
      </div>

      <div className="flex items-end gap-1.5 sm:gap-2 h-32 sm:h-40">
        {data.map((item) => {
          const height = (item.revenue / maxRevenue) * 100;
          return (
            <div key={item.month} className="flex-1 flex flex-col items-center gap-2 group">
              <span className="text-[10px] font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                ${(item.revenue / 1000).toFixed(1)}k
              </span>
              <div
                className="w-full rounded-sm bg-foreground/8 group-hover:bg-foreground/15 transition-colors"
                style={{ height: `${height * 1.4}px` }}
              />
              <span className="text-[10px] text-muted-foreground">{item.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
