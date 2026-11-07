import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { PlaceholderPanel } from "@/components/admin/PlaceholderPanel";
import { Plus, Tag } from "lucide-react";

export const Route = createFileRoute("/discounts")({
  component: DiscountsPage,
  head: () => ({
    meta: [
      { title: "Discounts — Store Management" },
      { name: "description", content: "Create and manage discount codes" },
      { property: "og:title", content: "Discounts — Store Management" },
      { property: "og:description", content: "Create and manage discount codes" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const codes = [
  { code: "WELCOME10", type: "10% off", uses: 248, status: "Active" },
  { code: "FREESHIP", type: "Free shipping", uses: 132, status: "Active" },
  { code: "SUMMER25", type: "25% off", uses: 0, status: "Scheduled" },
  { code: "VIP50", type: "$50 off", uses: 18, status: "Expired" },
];

function DiscountsPage() {
  return (
    <AdminShell title="Discounts" subtitle="4 codes">
      <div className="rounded-lg bg-card border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border">
          <h3 className="text-[13px] font-medium text-foreground">Discount codes</h3>
          <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-foreground text-background text-[12px] font-medium hover:bg-foreground/90 transition-colors">
            <Plus className="w-3.5 h-3.5" /> New code
          </button>
        </div>
        <ul className="divide-y divide-border">
          {codes.map((c) => (
            <li key={c.code} className="flex items-center justify-between px-4 sm:px-6 py-3 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-md bg-surface flex items-center justify-center shrink-0">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-mono font-medium text-foreground">{c.code}</p>
                  <p className="text-[11px] text-muted-foreground">{c.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-[12px] text-muted-foreground tabular-nums hidden sm:inline">{c.uses} uses</span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full ${
                    c.status === "Active"
                      ? "bg-success/10 text-success"
                      : c.status === "Scheduled"
                        ? "bg-info/10 text-info"
                        : "bg-surface text-muted-foreground"
                  }`}
                >
                  {c.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <PlaceholderPanel
        title="Automatic discounts"
        description="Set up rules like buy-X-get-Y, tiered pricing, or first-order discounts. Coming soon."
      />
    </AdminShell>
  );
}
