import type { RangeKey } from "@/lib/orders-store";

const options: { key: RangeKey; label: string }[] = [
  { key: "7d", label: "7d" },
  { key: "30d", label: "30d" },
  { key: "90d", label: "90d" },
];

interface RangeToggleProps {
  value: RangeKey;
  onChange: (v: RangeKey) => void;
}

export function RangeToggle({ value, onChange }: RangeToggleProps) {
  return (
    <div className="inline-flex items-center rounded-md border border-border bg-card p-0.5">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`px-2.5 h-6 text-[11px] font-medium rounded transition-colors ${
            value === o.key
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
