import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      data-slot="textarea"
      ref={ref}
      className={cn(
        // Merged styles from both files
        "flex w-full min-h-16 md:text-sm rounded-md border border-input dark:bg-input/30 bg-transparent px-3 py-2 placeholder:text-muted-foreground text-sm ring-offset-background shadow-xs transition-[color,box-shadow] outline-none",
        "focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-[3px] focus-visible:border-ring focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "field-sizing-content", // If using custom CSS utilities
        className
      )}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
