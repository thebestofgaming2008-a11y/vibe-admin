import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { topProductsData } from "@/lib/orders-store";
import { Plus, Package } from "lucide-react";

export const Route = createFileRoute("/products")({
  component: ProductsPage,
  head: () => ({
    meta: [
      { title: "Products — Store Management" },
      { name: "description", content: "Manage your store catalog" },
    ],
  }),
});

const stockMap: Record<string, number> = {
  "Wireless Headphones": 42,
  "Mechanical Keyboard": 18,
  "Laptop Stand Pro": 7,
  "USB-C Hub": 0,
  "Monitor Light Bar": 25,
};

function ProductsPage() {
  const inventoryAlert = topProductsData.filter((p) => (stockMap[p.name] ?? 0) <= 10).length;

  return (
    <AdminShell title="Products" subtitle={`${topProductsData.length} active`}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Stat label="Active products" value={topProductsData.length.toString()} />
        <Stat label="Low / out of stock" value={inventoryAlert.toString()} accent="warning" />
        <Stat label="Avg. price" value="$78" />
        <Stat label="Sold (30d)" value={topProductsData.reduce((a, b) => a + b.sales, 0).toString()} />
      </div>

      <div className="rounded-lg bg-card border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border">
          <h3 className="text-[13px] font-medium text-foreground">Catalog</h3>
          <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-foreground text-background text-[12px] font-medium hover:bg-foreground/90 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add product
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr>
                <th className="text-left text-[11px] font-normal text-muted-foreground px-6 py-2.5">Product</th>
                <th className="text-right text-[11px] font-normal text-muted-foreground px-6 py-2.5">Sold</th>
                <th className="text-right text-[11px] font-normal text-muted-foreground px-6 py-2.5">Revenue</th>
                <th className="text-right text-[11px] font-normal text-muted-foreground px-6 py-2.5">Stock</th>
              </tr>
            </thead>
            <tbody>
              {topProductsData.map((p) => {
                const stock = stockMap[p.name] ?? 20;
                const low = stock <= 10;
                const out = stock === 0;
                return (
                  <tr key={p.name} className="border-t border-border hover:bg-accent/50 transition-colors">
                    <td className="px-6 py-3 text-[13px] text-foreground">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-surface flex items-center justify-center">
                          <Package className="w-4 h-4 text-muted-foreground" />
                        </div>
                        {p.name}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-[13px] text-muted-foreground text-right font-mono">{p.sales}</td>
                    <td className="px-6 py-3 text-[13px] font-medium text-foreground text-right font-mono">
                      ${p.revenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span
                        className={`text-[12px] font-mono ${
                          out ? "text-destructive" : low ? "text-warning" : "text-muted-foreground"
                        }`}
                      >
                        {out ? "Out of stock" : `${stock} in stock`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: "warning" }) {
  return (
    <div className="rounded-lg bg-card border border-border p-4 sm:p-5">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <p className={`text-[20px] font-semibold tracking-tight mt-1.5 tabular-nums ${accent === "warning" ? "text-warning" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}
