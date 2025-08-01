import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent text-white hover:opacity-90",
        warning:
          "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80 dark:bg-yellow-900 dark:text-yellow-100",
        running:
          "border-transparent text-white hover:opacity-90",
        stopped:
          "border-transparent text-white hover:opacity-90",
        error:
          "border-transparent text-white hover:opacity-90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  const getStatusStyles = () => {
    switch (variant) {
      case 'running':
        return { backgroundColor: '#22c55e' }
      case 'stopped':
        return { backgroundColor: '#9ca3af' }
      case 'error':
        return { backgroundColor: '#ef4444' }
      case 'success':
        return { backgroundColor: '#22c55e' }
      default:
        return {}
    }
  }

  return (
    <div 
      className={cn(badgeVariants({ variant }), className)} 
      style={getStatusStyles()}
      {...props} 
    />
  )
}

export { Badge, badgeVariants }
