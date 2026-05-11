import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DayPoint } from "@/lib/orders-store";

interface TrendChartProps {
  data: DayPoint[];
  dataKey: keyof DayPoint;
  height?: number;
  variant?: "area" | "bar";
  formatValue?: (n: number) => string;
}

const defaultFmt = (n: number) => n.toLocaleString();

export function TrendChart({
  data,
  dataKey,
  height = 200,
  variant = "area",
  formatValue = defaultFmt,
}: TrendChartProps) {
  // Reduce x-axis tick density on long ranges
  const tickGap = data.length > 30 ? Math.ceil(data.length / 8) : data.length > 10 ? 3 : 1;
  const ticks = data.filter((_, i) => i % tickGap === 0).map((d) => d.label);

  const Chart = variant === "bar" ? BarChart : AreaChart;

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <Chart data={data} margin={{ top: 6, right: 4, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-foreground)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--color-foreground)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            ticks={ticks}
            tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            width={42}
            tickFormatter={(v) => (typeof v === "number" && v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
          />
          <Tooltip
            cursor={{ fill: "var(--color-accent)", opacity: 0.5 }}
            contentStyle={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 12,
              padding: "8px 10px",
            }}
            labelStyle={{ color: "var(--color-muted-foreground)", fontSize: 11, marginBottom: 2 }}
            formatter={(value) => [formatValue(value as number), ""]}
            separator=""
          />
          {variant === "bar" ? (
            <Bar dataKey={dataKey as string} fill="var(--color-foreground)" fillOpacity={0.85} radius={[2, 2, 0, 0]} />
          ) : (
            <Area
              type="monotone"
              dataKey={dataKey as string}
              stroke="var(--color-foreground)"
              strokeWidth={1.5}
              fill="url(#trendFill)"
            />
          )}
        </Chart>
      </ResponsiveContainer>
    </div>
  );
}
