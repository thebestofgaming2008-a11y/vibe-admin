import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: LucideIcon;
  className?: string;
}

export function StatCard({ title, value, change, trend, icon: Icon, className = "" }: StatCardProps) {
  return (
    <div className={`rounded-xl border border-border bg-card p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">{title}</span>
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
      <div className="flex items-end gap-3">
        <span className="text-2xl font-semibold tracking-tight text-card-foreground">{value}</span>
        <span
          className={`flex items-center gap-1 text-xs font-medium mb-1 ${
            trend === "up" ? "text-success" : "text-destructive"
          }`}
        >
          {trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change}
        </span>
      </div>
    </div>
  );
}
