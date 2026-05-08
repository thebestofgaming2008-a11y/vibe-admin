import { createFileRoute } from "@tanstack/react-router";
import { PackageOpen, Truck, Clock, AlertCircle } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { DashboardHeader } from "@/components/admin/DashboardHeader";
import { FulfillmentCard } from "@/components/admin/FulfillmentCard";
import { RecentOrders } from "@/components/admin/RecentOrders";
import { TopProducts } from "@/components/admin/TopProducts";
import { orders } from "@/lib/orders-data";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Store Management" },
      { name: "description", content: "Modern admin dashboard for webshop management" },
    ],
  }),
});

function Dashboard() {
  const unshipped = orders.filter((o) => o.status === "unshipped").length;
  const shippedNoTracking = orders.filter((o) => o.status === "shipped_no_tracking").length;
  const inTransit = orders.filter((o) => o.status === "in_transit").length;
  const awaitingAction = unshipped + shippedNoTracking;

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader title="Dashboard" subtitle="Fulfillment overview" />

        <main className="flex-1 p-8 space-y-6 overflow-y-auto">
          <section>
            <h2 className="text-[12px] font-medium uppercase tracking-widest text-muted-foreground mb-3">
              Needs your attention
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <FulfillmentCard
                title="Awaiting shipment"
                count={unshipped}
                description="Orders not yet sent out"
                icon={PackageOpen}
                accent="warning"
                className="animate-fade-in"
              />
              <FulfillmentCard
                title="Missing tracking ID"
                count={shippedNoTracking}
                description="Shipped without a tracker"
                icon={AlertCircle}
                accent="info"
                className="animate-fade-in-delay-1"
              />
              <FulfillmentCard
                title="In transit"
                count={inTransit}
                description="On the way to customer"
                icon={Truck}
                className="animate-fade-in-delay-2"
              />
              <FulfillmentCard
                title="Total to action"
                count={awaitingAction}
                description="Unshipped + missing tracking"
                icon={Clock}
                className="animate-fade-in-delay-3"
              />
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 animate-fade-in-delay-2">
              <RecentOrders />
            </div>
            <div className="lg:col-span-2 animate-fade-in-delay-3">
              <TopProducts />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
