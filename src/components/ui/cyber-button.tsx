import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const cyberButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group backdrop-blur-sm",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg hover:shadow-cyan-500/25 border border-cyan-500/30",
        destructive: "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg hover:shadow-red-500/25 border border-red-500/30",
        outline: "border border-cyan-500/30 bg-black/50 text-cyan-100 hover:bg-cyan-500/10 hover:border-cyan-500/50",
        secondary: "bg-gradient-to-r from-slate-700 to-slate-600 text-slate-100 hover:from-slate-600 hover:to-slate-500 border border-slate-600/30",
        ghost: "text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-100 border border-transparent hover:border-cyan-500/20",
        sacred: "bg-gradient-to-r from-yellow-500 to-orange-500 text-black shadow-lg hover:shadow-yellow-500/25 border border-yellow-500/30",
        cyber: "bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-lg hover:shadow-cyan-400/25 border border-cyan-400/30",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
      glow: {
        none: "",
        cyber: "hover:shadow-cyan-500/50",
        sacred: "hover:shadow-yellow-500/50",
        neon: "hover:shadow-purple-500/50",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      glow: "none",
    },
  }
)

export interface CyberButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof cyberButtonVariants> {
  asChild?: boolean
  withMotion?: boolean
  glowEffect?: boolean
}

const CyberButton = React.forwardRef<HTMLButtonElement, CyberButtonProps>(
  ({ className, variant, size, glow, asChild = false, withMotion = true, glowEffect = false, children, ...props }, ref) => {

    if (asChild) {
      return (
        <Slot
          className={cn(cyberButtonVariants({ variant, size, glow, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      )
    }

    const buttonContent = (
      <button
        className={cn(cyberButtonVariants({ variant, size, glow, className }))}
        ref={ref}
        {...props}
      >
        {/* Enhanced animated background overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 via-purple-400/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

        {/* Secondary shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-white/5 to-transparent translate-x-full group-hover:-translate-x-full transition-transform duration-1200 delay-200" />

        {/* Enhanced sacred geometry accent */}
        {glowEffect && (
          <div className="absolute top-0 right-0 w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-60 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110 shadow-lg shadow-yellow-500/30">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs animate-pulse">∞</span>
            </div>
            {/* Pulsing ring around accent */}
            <div className="absolute inset-0 rounded-full border border-yellow-400/50 animate-ping opacity-75"></div>
          </div>
        )}

        {/* Corner energy particles */}
        {glowEffect && (
          <>
            <div className="absolute -top-1 -left-1 w-1 h-1 bg-cyan-400/60 rounded-full animate-pulse delay-100"></div>
            <div className="absolute -bottom-1 -right-1 w-1 h-1 bg-purple-400/60 rounded-full animate-pulse delay-300"></div>
          </>
        )}

        {/* Content */}
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
      </button>
    )

    if (withMotion) {
      return (
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.1 }}
        >
          {buttonContent}
        </motion.div>
      )
    }

    return buttonContent
  }
)
CyberButton.displayName = "CyberButton"

export { CyberButton, cyberButtonVariants }
