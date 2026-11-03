import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Tag,
  MessageSquare,
  Bell,
  LogOut,
  X,
  Truck,
  Layers,
  Search,
  type LucideIcon,
} from "lucide-react";
import { useShipping, isStale } from "@/lib/shipping-store";
import { useOrders } from "@/lib/orders-store";

interface NavItem {
  icon: LucideIcon;
  label: string;
  to: string;
  badgeKey?: "orders" | "reviews" | "shipping";
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", to: "/" },
      { icon: BarChart3, label: "Analytics", to: "/analytics" },
    ],
  },
  {
    label: "Commerce",
    items: [
      { icon: ShoppingCart, label: "Orders", to: "/orders", badgeKey: "orders" },
      { icon: Package, label: "Products", to: "/products" },
      { icon: Layers, label: "Collections", to: "/collections" },
      { icon: Truck, label: "Shipping", to: "/shipping", badgeKey: "shipping" },
      { icon: Tag, label: "Discounts", to: "/discounts" },
      { icon: Search, label: "SEO Autopilot", to: "/seo" },
    ],
  },
  {
    label: "People",
    items: [
      { icon: Users, label: "Customers", to: "/customers" },
      { icon: MessageSquare, label: "Reviews", to: "/reviews", badgeKey: "reviews" },
    ],
  },
  {
    label: "System",
    items: [{ icon: Settings, label: "Settings", to: "/settings" }],
  },
];

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AdminSidebar({ mobileOpen = false, onMobileClose }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const orders = useOrders();
  const carriers = useShipping();
  const badges = {
    orders: orders.filter((o) => o.status === "unshipped" || o.status === "shipped_no_tracking").length,
    reviews: 3,
    shipping: carriers.filter((c) => isStale(c.lastUpdated)).length,
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-foreground/30 backdrop-blur-sm z-40 animate-fade-in"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`
          flex flex-col bg-sidebar-bg border-r border-sidebar-border transition-all duration-200 shrink-0
          fixed md:static inset-y-0 left-0 z-50
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
          ${collapsed ? "md:w-16" : "md:w-56"}
          w-60
        `}
      >
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-sidebar-border">
          <div className="w-7 h-7 rounded-md bg-foreground flex items-center justify-center">
            <span className="text-[11px] font-bold text-background">S</span>
          </div>
          {(!collapsed || mobileOpen) && (
            <span className="text-[13px] font-semibold text-foreground truncate flex-1">Store</span>
          )}
          <button
            onClick={onMobileClose}
            className="md:hidden text-muted-foreground hover:text-foreground p-1"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
          {navGroups.map((group) => (
            <div key={group.label}>
              {(!collapsed || mobileOpen) && (
                <p className="px-2 mb-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  {group.label}
                </p>
              )}
              <ul className="space-y-px">
                {group.items.map((item) => {
                  const active = pathname === item.to;
                  const showLabels = !collapsed || mobileOpen;
                  const badge = item.badgeKey ? badges[item.badgeKey] : 0;
                  const cls = `flex items-center gap-2.5 w-full rounded-md px-2.5 py-[7px] text-[13px] transition-colors ${
                    active
                      ? "bg-accent text-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  } ${!showLabels ? "justify-center" : ""}`;
                  return (
                    <li key={item.label}>
                      <Link to={item.to} className={cls} onClick={onMobileClose}>
                        <item.icon className="w-[15px] h-[15px] shrink-0" />
                        {showLabels && (
                          <>
                            <span className="flex-1 text-left">{item.label}</span>
                            {badge > 0 && (
                              <span className="text-[10px] font-medium text-muted-foreground bg-surface px-1.5 py-0.5 rounded">
                                {badge}
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-2 space-y-px">
          <button
            className={`flex items-center gap-2.5 w-full rounded-md px-2.5 py-[7px] text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors ${collapsed && !mobileOpen ? "justify-center" : ""}`}
          >
            <Bell className="w-[15px] h-[15px]" />
            {(!collapsed || mobileOpen) && <span>Notifications</span>}
          </button>
          <button
            className={`flex items-center gap-2.5 w-full rounded-md px-2.5 py-[7px] text-[13px] text-muted-foreground hover:bg-accent hover:text-destructive transition-colors ${collapsed && !mobileOpen ? "justify-center" : ""}`}
          >
            <LogOut className="w-[15px] h-[15px]" />
            {(!collapsed || mobileOpen) && <span>Log out</span>}
          </button>
        </div>

        <div className="border-t border-sidebar-border p-2 hidden md:block">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full rounded-md py-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>
      </aside>
    </>
  );
}
