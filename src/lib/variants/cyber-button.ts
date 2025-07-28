import { cva } from "class-variance-authority";

export const cyberButtonVariants = cva(
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
); 