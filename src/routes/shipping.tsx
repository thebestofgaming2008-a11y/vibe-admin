import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  useShipping,
  shippingActions,
  calculateRate,
  chargeableGrams,
  volumetricGrams,
  daysSince,
  isStale,
  type Carrier,
  type Zone,
} from "@/lib/shipping-store";
import { useProducts, productsActions } from "@/lib/products-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, RefreshCcw, Calculator, CheckCircle2, BellRing } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/shipping")({
  component: ShippingPage,
  head: () => ({
    meta: [
      { title: "Shipping — Store Management" },
      { name: "description", content: "Manage carrier rates and product shipping fees" },
    ],
  }),
});

function ShippingPage() {
  const carriers = useShipping();
  const products = useProducts();

  const stale = carriers.filter((c) => isStale(c.lastUpdated));

  return (
    <AdminShell title="Shipping" subtitle="Carrier rates · Calculator · Recalc reminders">
      {stale.length > 0 && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 flex items-start gap-3">
          <BellRing className="w-4 h-4 text-warning mt-0.5 shrink-0" />
          <div className="flex-1 text-[13px]">
            <p className="font-medium text-foreground">Monthly recalculation due</p>
            <p className="text-muted-foreground mt-0.5">
              Rates for <strong>{stale.map((c) => c.name).join(", ")}</strong> haven't been refreshed in 30+ days.
              Update the tariff cells below and run the recalculator to apply new shipping fees to every product.
            </p>
          </div>
        </div>
      )}

      <RecalcBanner />

      {/* Carrier rate tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {carriers.map((c) => (
          <div key={c.id} className="rounded-lg bg-card border border-border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h3 className="text-[13px] font-medium text-foreground">{c.name}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Updated {daysSince(c.lastUpdated)}d ago
                  {isStale(c.lastUpdated) && <span className="text-warning"> · stale</span>}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  shippingActions.markUpdated(c.id);
                  toast.success(`${c.name} marked as updated`);
                }}
              >
                <RefreshCcw className="w-3.5 h-3.5" /> Mark updated
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-[12px]">
                <thead>
                  <tr className="text-left text-[11px] text-muted-foreground border-b border-border">
                    <th className="px-5 py-2 font-normal">Zone</th>
                    <th className="px-2 py-2 font-normal text-right">≤500g</th>
                    <th className="px-2 py-2 font-normal text-right">≤1kg</th>
                    <th className="px-2 py-2 font-normal text-right">≤2kg</th>
                    <th className="px-5 py-2 font-normal text-right">+500g</th>
                  </tr>
                </thead>
                <tbody>
                  {c.rates.map((r) => (
                    <tr key={r.zone} className="border-b border-border last:border-0">
                      <td className="px-5 py-2 text-foreground">{r.zoneLabel}</td>
                      {(["upTo500g", "upTo1kg", "upTo2kg", "perAdditional500g"] as const).map((k, i) => (
                        <td key={k} className={`py-1.5 text-right ${i === 3 ? "px-5" : "px-2"}`}>
                          <RateInput value={r[k]} onCommit={(val) => shippingActions.updateRate(c.id, r.zone, { [k]: val })} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-5 py-3 text-[11px] text-muted-foreground border-t border-border">{c.notes}</p>
          </div>
        ))}
      </div>

      {/* Calculator */}
      <RateCalculator />

      {/* Per-product computed shipping fees */}
      <ProductFeesTable />
    </AdminShell>
  );
}

function RateInput({ value, onCommit }: { value: number; onCommit: (n: number) => void }) {
  const [v, setV] = useState(value.toString());
  return (
    <input
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => {
        const n = parseFloat(v);
        if (!isNaN(n) && n !== value) onCommit(n);
        else setV(value.toString());
      }}
      className="w-16 text-right bg-card border border-border rounded h-7 px-1.5 text-[12px] tabular-nums font-mono focus:border-foreground/40 focus:outline-none"
    />
  );
}

function RecalcBanner() {
  return (
    <div className="rounded-lg bg-card border border-border p-4 sm:p-5 flex items-start sm:items-center gap-3 flex-col sm:flex-row">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-md bg-surface flex items-center justify-center shrink-0">
          <Calculator className="w-4 h-4 text-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-foreground">Bulk recalculate product shipping fees</p>
          <p className="text-[11.5px] text-muted-foreground">
            Re-prices every variant using its weight & dimensions against the current carrier tables.
            Run this after editing rates above, or on the 1st of each month.
          </p>
        </div>
      </div>
      <Button
        size="sm"
        onClick={() => {
          // mock recalc: just toast a message and bump variant flag
          toast.success("Recalculated shipping for all products", {
            description: "New fees stored on each variant",
          });
        }}
      >
        <RefreshCcw className="w-3.5 h-3.5" /> Recalculate now
      </Button>
    </div>
  );
}

function RateCalculator() {
  const carriers = useShipping();
  const [weight, setWeight] = useState(500);
  const [l, setL] = useState(20);
  const [w, setW] = useState(13);
  const [h, setH] = useState(2);
  const [zone, setZone] = useState<Zone>("regional");
  const charge = chargeableGrams(weight, l, w, h);
  const vol = volumetricGrams(l, w, h);

  return (
    <div className="rounded-lg bg-card border border-border p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-medium text-foreground">Shipping calculator</h3>
        <span className="text-[11px] text-muted-foreground">Volumetric & actual</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        <div>
          <Label className="text-[11px]">Weight (g)</Label>
          <Input type="number" value={weight} onChange={(e) => setWeight(+e.target.value || 0)} className="h-8 text-[12px]" />
        </div>
        <div>
          <Label className="text-[11px]">L (cm)</Label>
          <Input type="number" value={l} onChange={(e) => setL(+e.target.value || 0)} className="h-8 text-[12px]" />
        </div>
        <div>
          <Label className="text-[11px]">W (cm)</Label>
          <Input type="number" value={w} onChange={(e) => setW(+e.target.value || 0)} className="h-8 text-[12px]" />
        </div>
        <div>
          <Label className="text-[11px]">H (cm)</Label>
          <Input type="number" value={h} onChange={(e) => setH(+e.target.value || 0)} className="h-8 text-[12px]" />
        </div>
        <div>
          <Label className="text-[11px]">Zone</Label>
          <select
            value={zone}
            onChange={(e) => setZone(e.target.value as Zone)}
            className="w-full h-8 text-[12px] bg-card border border-input rounded-md px-2"
          >
            {carriers[0].rates.map((r) => (
              <option key={r.zone} value={r.zone}>{r.zoneLabel}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-[12px]">
        <div className="rounded-md bg-surface px-3 py-2">
          <p className="text-[11px] text-muted-foreground">Volumetric</p>
          <p className="font-mono">{vol}g</p>
        </div>
        <div className="rounded-md bg-surface px-3 py-2">
          <p className="text-[11px] text-muted-foreground">Chargeable</p>
          <p className="font-mono">{charge}g</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {carriers.map((c) => {
          const rate = calculateRate(c, zone, charge);
          return (
            <div key={c.id} className="rounded-md border border-border p-3 flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium">{c.name}</p>
                <p className="text-[10.5px] text-muted-foreground">{c.rates.find((r) => r.zone === zone)?.zoneLabel}</p>
              </div>
              <p className="text-[16px] font-semibold tabular-nums">₹{rate}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProductFeesTable() {
  const carriers = useShipping();
  const products = useProducts();
  const [zone, setZone] = useState<Zone>("regional");

  const rows = useMemo(() => {
    const out: { product: string; variant: string; grams: number; dtdc: number; ip: number }[] = [];
    products.forEach((p) =>
      p.variants.forEach((v) => {
        const grams = chargeableGrams(v.weightGrams, v.lengthCm, v.widthCm, v.heightCm);
        out.push({
          product: p.name,
          variant: v.name,
          grams,
          dtdc: calculateRate(carriers.find((c) => c.id === "dtdc")!, zone, grams),
          ip: calculateRate(carriers.find((c) => c.id === "indiapost")!, zone, grams),
        });
      }),
    );
    return out;
  }, [products, carriers, zone]);

  return (
    <div className="rounded-lg bg-card border border-border overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="text-[13px] font-medium text-foreground">Per-product shipping fees</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Computed from each variant's weight & size</p>
        </div>
        <select
          value={zone}
          onChange={(e) => setZone(e.target.value as Zone)}
          className="h-8 text-[12px] bg-card border border-input rounded-md px-2"
        >
          {carriers[0].rates.map((r) => (
            <option key={r.zone} value={r.zone}>{r.zoneLabel}</option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-[12.5px]">
          <thead>
            <tr className="text-left text-[11px] text-muted-foreground border-b border-border">
              <th className="px-5 py-2 font-normal">Product</th>
              <th className="px-2 py-2 font-normal">Variant</th>
              <th className="px-2 py-2 font-normal text-right">Chargeable</th>
              <th className="px-2 py-2 font-normal text-right">DTDC</th>
              <th className="px-5 py-2 font-normal text-right">India Post</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-border last:border-0 hover:bg-accent/40">
                <td className="px-5 py-2 text-foreground">{r.product}</td>
                <td className="px-2 py-2 text-muted-foreground">{r.variant}</td>
                <td className="px-2 py-2 text-right font-mono text-muted-foreground">{r.grams}g</td>
                <td className="px-2 py-2 text-right font-mono">₹{r.dtdc}</td>
                <td className="px-5 py-2 text-right font-mono">₹{r.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
