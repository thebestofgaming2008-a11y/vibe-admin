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
    <div className={`rounded-lg bg-card border border-border p-5 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] text-muted-foreground">{title}</span>
        <Icon className="w-4 h-4 text-muted-foreground/50" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[22px] font-semibold tracking-tight text-foreground">{value}</span>
        <span
          className={`flex items-center gap-0.5 text-[11px] font-medium ${
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
