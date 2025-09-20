"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check, CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    data-slot="checkbox"
    className={cn(
      // Merged styles from both components
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background",
      "rounded-[4px] border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      "dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "focus-visible:border-ring focus-visible:ring-ring/50",
      "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
      "shadow-xs transition-shadow outline-none disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      data-slot="checkbox-indicator"
      className="flex items-center justify-center text-current transition-none"
    >
      {/* Use only one of these icons: */}
      {/* <CheckIcon className="size-3.5" /> */}
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))

Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
