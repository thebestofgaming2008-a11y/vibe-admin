import type { ReactNode } from "react";

export function PlaceholderPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-lg bg-card border border-border p-8 sm:p-12 text-center">
      <h3 className="text-[14px] font-medium text-foreground mb-1">{title}</h3>
      <p className="text-[12px] text-muted-foreground max-w-md mx-auto">{description}</p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
