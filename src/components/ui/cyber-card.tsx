import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const CyberCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'sacred' | 'void' | 'neon'
    withMotion?: boolean
    glowEffect?: boolean
    sacredPattern?: boolean
  }
>(({ className, variant = 'default', withMotion = true, glowEffect = false, sacredPattern = false, children, ...props }, ref) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'sacred':
        return 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30 hover:border-yellow-500/50'
      case 'void':
        return 'bg-black/80 border-slate-700/50 hover:border-slate-600/50'
      case 'neon':
        return 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30 hover:border-purple-500/50'
      default:
        return 'bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border-cyan-500/30 hover:border-cyan-500/50'
    }
  }

  const cardContent = (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border backdrop-blur-sm transition-all duration-300 relative overflow-hidden group",
        getVariantClasses(),
        sacredPattern && "sacred-pattern",
        glowEffect && "hover:shadow-lg hover:shadow-cyan-500/20",
        className
      )}
      {...props}
    >
      {/* Sacred geometry background */}
      {sacredPattern && (
        <div className="absolute inset-0 opacity-20">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
              <pattern id="sacred-pattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                <circle cx="25" cy="25" r="15" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
                <circle cx="25" cy="25" r="10" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5"/>
                <circle cx="25" cy="25" r="5" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.7"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#sacred-pattern)" className="text-cyan-400"/>
          </svg>
        </div>
      )}

      {/* Enhanced holographic overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-cyan-400/5 via-purple-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      {/* Secondary shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-white/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200" />

      {/* Enhanced sacred geometry accent */}
      {glowEffect && (
        <div className="absolute top-2 right-2 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-60 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110 shadow-lg shadow-yellow-500/20">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs animate-pulse">∞</span>
          </div>
          {/* Pulsing ring */}
          <div className="absolute inset-0 rounded-full border border-yellow-400/40 animate-ping opacity-75 group-hover:opacity-100"></div>
        </div>
      )}

      {/* Corner energy indicators */}
      {glowEffect && (
        <>
          <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-cyan-400/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-purple-400/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100"></div>
          <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-yellow-400/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200"></div>
          <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-pink-400/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-300"></div>
        </>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )

  if (withMotion) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.3 }}
      >
        {cardContent}
      </motion.div>
    )
  }

  return cardContent
})
CyberCard.displayName = "CyberCard"

const CyberCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6 pb-4", className)}
    {...props}
  />
))
CyberCardHeader.displayName = "CyberCardHeader"

const CyberCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight text-cyan-100", className)}
    {...props}
  />
))
CyberCardTitle.displayName = "CyberCardTitle"

const CyberCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-slate-400", className)}
    {...props}
  />
))
CyberCardDescription.displayName = "CyberCardDescription"

const CyberCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CyberCardContent.displayName = "CyberCardContent"

const CyberCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CyberCardFooter.displayName = "CyberCardFooter"

export { 
  CyberCard, 
  CyberCardHeader, 
  CyberCardFooter, 
  CyberCardTitle, 
  CyberCardDescription, 
  CyberCardContent 
}
