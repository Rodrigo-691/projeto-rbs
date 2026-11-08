import { cn } from "@/lib/utils";
import { QUOTA_LABEL, type Quota } from "@/lib/portal";

/** Quota label. Master carries festival magenta; Subcota G carries an elegant soft orange; Subcota stays neutral. */
export function QuotaTag({
  quota,
  onDark = false,
  className,
}: {
  quota: Quota;
  onDark?: boolean;
  className?: string;
}) {
  const master = quota === "master";
  const subcotaG = quota === "subcota_g";

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center whitespace-nowrap rounded-full px-2.5 text-xs font-medium transition-colors",
        onDark
          ? master
            ? "bg-highlight/15 text-highlight border border-highlight/25"
            : subcotaG
              ? "bg-orange-500/15 text-orange-300 border border-orange-500/30"
              : "bg-sidebar-accent text-sidebar-foreground border border-sidebar-border"
          : master
            ? "bg-highlight-soft text-highlight-ink"
            : subcotaG
              ? "bg-orange-500/10 text-orange-800 dark:text-orange-300 border border-orange-500/20"
              : "bg-secondary text-secondary-foreground border border-border/50",
        className,
      )}
    >
      {QUOTA_LABEL[quota] ?? quota}
    </span>
  );
}
