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
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  icon: LucideIcon;
  label: string;
  to?: string;
  badge?: number;
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
      { icon: ShoppingCart, label: "Orders", to: "/orders", badge: 12 },
      { icon: Package, label: "Products" },
      { icon: Tag, label: "Discounts" },
    ],
  },
  {
    label: "People",
    items: [
      { icon: Users, label: "Customers" },
      { icon: MessageSquare, label: "Reviews", badge: 3 },
    ],
  },
  {
    label: "System",
    items: [{ icon: Settings, label: "Settings" }],
  },
];

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside
      className={`flex flex-col bg-sidebar-bg border-r border-sidebar-border transition-all duration-200 shrink-0 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-sidebar-border">
        <div className="w-7 h-7 rounded-md bg-foreground flex items-center justify-center">
          <span className="text-[11px] font-bold text-background">S</span>
        </div>
        {!collapsed && (
          <span className="text-[13px] font-semibold text-foreground truncate">Store</span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-2 mb-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                {group.label}
              </p>
            )}
            <ul className="space-y-px">
              {group.items.map((item) => {
                const active = item.to ? pathname === item.to : false;
                const content = (
                  <>
                    <item.icon className="w-[15px] h-[15px] shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge && (
                          <span className="text-[10px] font-medium text-muted-foreground bg-surface px-1.5 py-0.5 rounded">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </>
                );
                const cls = `flex items-center gap-2.5 w-full rounded-md px-2.5 py-[7px] text-[13px] transition-colors ${
                  active
                    ? "bg-accent text-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                } ${collapsed ? "justify-center" : ""}`;
                return (
                  <li key={item.label}>
                    {item.to ? (
                      <Link to={item.to} className={cls}>{content}</Link>
                    ) : (
                      <button className={cls}>{content}</button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-2 space-y-px">
        <button
          className={`flex items-center gap-2.5 w-full rounded-md px-2.5 py-[7px] text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors ${collapsed ? "justify-center" : ""}`}
        >
          <Bell className="w-[15px] h-[15px]" />
          {!collapsed && <span>Notifications</span>}
        </button>
        <button
          className={`flex items-center gap-2.5 w-full rounded-md px-2.5 py-[7px] text-[13px] text-muted-foreground hover:bg-accent hover:text-destructive transition-colors ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut className="w-[15px] h-[15px]" />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>

      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full rounded-md py-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </aside>
  );
}
