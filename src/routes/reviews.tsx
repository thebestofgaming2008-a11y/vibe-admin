import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { Star } from "lucide-react";

export const Route = createFileRoute("/reviews")({
  component: ReviewsPage,
  head: () => ({
    meta: [
      { title: "Reviews — Store Management" },
      { name: "description", content: "Customer reviews and feedback" },
      { property: "og:title", content: "Reviews — Store Management" },
      { property: "og:description", content: "Customer reviews and feedback" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const reviews = [
  { id: 1, customer: "Sarah Chen", product: "Wireless Headphones", rating: 5, body: "Sound is incredible and the battery lasts forever. Worth every cent." },
  { id: 2, customer: "James Wilson", product: "Laptop Stand Pro", rating: 4, body: "Solid build, my posture has noticeably improved." },
  { id: 3, customer: "Emily Park", product: "USB-C Hub", rating: 3, body: "Works well but runs a bit warm under heavy load." },
];

function ReviewsPage() {
  const avg = reviews.reduce((a, b) => a + b.rating, 0) / reviews.length;
  return (
    <AdminShell title="Reviews" subtitle={`${reviews.length} new`}>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Stat label="Average rating" value={avg.toFixed(1)} />
        <Stat label="5-star reviews" value={reviews.filter((r) => r.rating === 5).length.toString()} />
        <Stat label="Needs response" value="2" />
      </div>

      <div className="rounded-lg bg-card border border-border divide-y divide-border">
        {reviews.map((r) => (
          <div key={r.id} className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="text-[13px] font-medium text-foreground">{r.customer}</p>
                <p className="text-[11px] text-muted-foreground">{r.product}</p>
              </div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${i < r.rating ? "fill-warning text-warning" : "text-muted-foreground/30"}`}
                  />
                ))}
              </div>
            </div>
            <p className="text-[13px] text-foreground leading-relaxed">{r.body}</p>
            <div className="flex items-center gap-3 mt-3">
              <button className="text-[12px] font-medium text-foreground hover:underline">Reply</button>
              <button className="text-[12px] text-muted-foreground hover:text-foreground">Hide</button>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-card border border-border p-4 sm:p-5">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <p className="text-[20px] font-semibold tracking-tight mt-1.5 tabular-nums text-foreground">{value}</p>
    </div>
  );
}
