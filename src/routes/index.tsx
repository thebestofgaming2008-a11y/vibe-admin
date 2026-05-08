import { createFileRoute } from "@tanstack/react-router";
import { DollarSign, ShoppingCart, Users, Package } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { DashboardHeader } from "@/components/admin/DashboardHeader";
import { StatCard } from "@/components/admin/StatCard";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { RecentOrders } from "@/components/admin/RecentOrders";
import { TopProducts } from "@/components/admin/TopProducts";

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
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />

        <main className="flex-1 p-8 space-y-6 overflow-y-auto">
          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Revenue"
              value="$46,289"
              change="+12.5%"
              trend="up"
              icon={DollarSign}
              className="animate-fade-in"
            />
            <StatCard
              title="Orders"
              value="1,234"
              change="+8.2%"
              trend="up"
              icon={ShoppingCart}
              className="animate-fade-in-delay-1"
            />
            <StatCard
              title="Customers"
              value="892"
              change="+4.1%"
              trend="up"
              icon={Users}
              className="animate-fade-in-delay-2"
            />
            <StatCard
              title="Products"
              value="156"
              change="-2.3%"
              trend="down"
              icon={Package}
              className="animate-fade-in-delay-3"
            />
          </div>

          {/* Chart + Top Products */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 animate-fade-in-delay-2">
              <RevenueChart />
            </div>
            <div className="lg:col-span-2 animate-fade-in-delay-3">
              <TopProducts />
            </div>
          </div>

          {/* Recent Orders */}
          <div className="animate-fade-in-delay-4">
            <RecentOrders />
          </div>
        </main>
      </div>
    </div>
  );
}
