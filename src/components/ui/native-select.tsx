import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { fieldClass } from "@/components/ui/input";

/** Native select styled like the rest of the form vocabulary. */
const NativeSelect = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(
  ({ className, children, ...props }, ref) => (
    <div className={cn("relative", className)}>
      <select ref={ref} className={cn(fieldClass, "h-9 cursor-pointer appearance-none pr-9")} {...props}>
        {children}
      </select>
      <ChevronDown aria-hidden className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
    </div>
  ),
);
NativeSelect.displayName = "NativeSelect";

export { NativeSelect };
