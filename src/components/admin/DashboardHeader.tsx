import { Search, Menu } from "lucide-react";

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  onMenuClick?: () => void;
}

export function DashboardHeader({ title = "Dashboard", subtitle, onMenuClick }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 h-14 border-b border-border sticky top-0 z-30 bg-background">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="md:hidden text-muted-foreground hover:text-foreground -ml-1 p-1"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-baseline gap-2 min-w-0">
          <h1 className="text-[15px] font-semibold text-foreground truncate">{title}</h1>
          {subtitle && <span className="text-[12px] text-muted-foreground hidden sm:inline truncate">{subtitle}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="w-52 h-8 pl-8 pr-3 rounded-md bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-shadow"
          />
        </div>

        <button
          className="md:hidden text-muted-foreground hover:text-foreground p-1"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        <div className="w-8 h-8 rounded-md bg-surface flex items-center justify-center text-[11px] font-medium text-surface-foreground">
          JD
        </div>
      </div>
    </header>
  );
}
