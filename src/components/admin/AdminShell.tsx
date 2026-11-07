import { useState, type ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { DashboardHeader } from "./DashboardHeader";

interface AdminShellProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  mainClassName?: string;
}

export function AdminShell({ title, subtitle, children, mainClassName = "" }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader
          title={title}
          subtitle={subtitle}
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className={`flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto ${mainClassName}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
