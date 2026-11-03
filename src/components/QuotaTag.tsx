import { cn } from "@/lib/utils";
import { QUOTA_LABEL, type Quota } from "@/lib/portal";

/** Quota label. Master carries the festival magenta; the other quotas stay neutral. */
export function QuotaTag({ quota, onDark = false, className }: { quota: Quota; onDark?: boolean; className?: string }) {
  const master = quota === "master";
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center whitespace-nowrap rounded-full px-2.5 text-xs font-medium",
        onDark
          ? master
            ? "bg-highlight/15 text-highlight"
            : "bg-sidebar-accent text-sidebar-foreground"
          : master
            ? "bg-highlight-soft text-highlight-ink"
            : "bg-secondary text-secondary-foreground",
        className,
      )}
    >
      {QUOTA_LABEL[quota] ?? quota}
    </span>
  );
}
