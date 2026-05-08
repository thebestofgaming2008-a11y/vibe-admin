import { Search, Plus } from "lucide-react";

export function DashboardHeader() {
  return (
    <header className="flex items-center justify-between px-8 h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
        <p className="text-[13px] text-muted-foreground">Welcome back, here's what's happening</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search orders, products..."
            className="w-64 h-9 pl-9 pr-4 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-shadow"
          />
        </div>

        {/* Add product button */}
        <button className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Product</span>
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center text-xs font-medium text-surface-foreground cursor-pointer hover:border-primary/50 transition-colors">
          JD
        </div>
      </div>
    </header>
  );
}
