import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[100px] w-full rounded-lg bg-white px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border border-slate-200 transition-colors focus-visible:outline-none focus-visible:border-[#6c5ce7] focus-visible:ring-2 focus-visible:ring-[#6c5ce7]/20 disabled:cursor-not-allowed disabled:opacity-50 resize-y",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
