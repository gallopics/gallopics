import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full resize-none rounded-md border border-input bg-card px-4 py-3 text-base leading-relaxed text-foreground transition-all outline-none placeholder:text-muted-foreground hover:border-muted-foreground/50 focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/8 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-50 aria-invalid:border-destructive md:text-sm dark:aria-invalid:border-destructive/50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
