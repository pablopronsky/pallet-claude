import * as React from "react";

import { cn } from "@/lib/utils";

const CHEVRON =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%239aa0a6'><path fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/></svg>";

const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, style, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-10 w-full appearance-none rounded-md border px-3 py-2 pr-10 text-sm text-foreground bg-no-repeat transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    style={{
      background: "var(--np-panel-2)",
      borderColor: "var(--np-line)",
      backgroundImage: `url("${CHEVRON}")`,
      backgroundPosition: "right 0.75rem center",
      backgroundSize: "1rem",
      backgroundRepeat: "no-repeat",
      ...style,
    }}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export { Select };
