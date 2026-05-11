import { type LucideIcon } from "lucide-react";

interface FulfillmentCardProps {
  title: string;
  count: number;
  description: string;
  icon: LucideIcon;
  accent?: "neutral" | "warning" | "info";
  className?: string;
}

const accentMap: Record<string, string> = {
  neutral: "text-muted-foreground",
  warning: "text-warning",
  info: "text-info",
};

export function FulfillmentCard({
  title,
  count,
  description,
  icon: Icon,
  accent = "neutral",
  className = "",
}: FulfillmentCardProps) {
  return (
    <div className={`rounded-lg bg-card border border-border p-4 sm:p-5 hover:border-foreground/20 transition-colors ${className}`}>
      <div className="flex items-center justify-between mb-3 gap-2">
        <span className="text-[12px] sm:text-[13px] text-muted-foreground truncate">{title}</span>
        <Icon className={`w-4 h-4 shrink-0 ${accentMap[accent]}`} />
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-[22px] sm:text-[24px] font-semibold tracking-tight text-foreground tabular-nums">{count}</span>
        <span className="text-[11px] text-muted-foreground">orders</span>
      </div>
      <p className="text-[11px] text-muted-foreground line-clamp-2">{description}</p>
    </div>
  );
}
