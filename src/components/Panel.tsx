import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The single container of the signed-in screens: a white surface with a quiet border,
 * a header row (title, optional description, actions) and a body. Never nest panels.
 * Use `flush` when the body is a list whose rows run edge to edge.
 */
export function Panel({
  title,
  description,
  actions,
  children,
  flush = false,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  flush?: boolean;
  className?: string;
  bodyClassName?: string;
}) {
  const hasHeader = title || description || actions;
  return (
    <section className={cn("bg-card rounded-lg border", className)}>
      {hasHeader && (
        <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-5 pb-3 pt-4">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold">{title}</h2>}
            {description && <p className="text-muted-foreground mt-0.5 text-sm leading-relaxed">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn(flush ? "" : "px-5 pb-5", !hasHeader && !flush && "pt-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Row list used inside a flush panel. */
export function PanelList({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cn("divide-y border-t", className)}>{children}</ul>;
}

/** Explanatory line for loading, empty and error states inside a panel. */
export function PanelNote({
  children,
  tone = "muted",
  className,
}: {
  children: ReactNode;
  tone?: "muted" | "error";
  className?: string;
}) {
  return (
    <p
      role={tone === "error" ? "alert" : undefined}
      className={cn("px-5 py-4 text-sm", tone === "error" ? "text-destructive" : "text-muted-foreground", className)}
    >
      {children}
    </p>
  );
}

/** Screen title row: one h1, an optional sentence, and the screen's actions. */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-6 gap-y-3", className)}>
      <div className="min-w-0 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px] sm:leading-9">{title}</h1>
        {description && <p className="text-muted-foreground mt-1.5 text-[15px] leading-relaxed">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
