import { Search, Plus } from "lucide-react";

export function DashboardHeader() {
  return (
    <header className="flex items-center justify-between px-8 h-14 border-b border-border sticky top-0 z-10 bg-background">
      <h1 className="text-[15px] font-semibold text-foreground">Dashboard</h1>

      <div className="flex items-center gap-2.5">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="w-52 h-8 pl-8 pr-3 rounded-md bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-shadow"
          />
        </div>

        <button className="flex items-center gap-1.5 h-8 px-3 rounded-md bg-foreground text-background text-[13px] font-medium hover:bg-foreground/90 transition-colors">
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Product</span>
        </button>

        <div className="w-8 h-8 rounded-md bg-surface flex items-center justify-center text-[11px] font-medium text-surface-foreground">
          JD
        </div>
      </div>
    </header>
  );
}
