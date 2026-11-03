import * as React from "react";

import { cn } from "@/lib/utils";

export const fieldClass =
  "w-full rounded-md border border-input bg-card px-3 text-base text-foreground transition-[border-color,box-shadow] duration-150 placeholder:text-muted-foreground/80 hover:border-[color-mix(in_oklab,var(--input)_70%,var(--graphite))] focus-visible:outline-none focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/20 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:hover:border-input aria-invalid:border-destructive md:text-sm";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          fieldClass,
          "flex h-9 py-1 file:mr-3 file:h-7 file:rounded file:border-0 file:bg-secondary file:px-2.5 file:text-[13px] file:font-medium file:text-foreground",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
