import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        // Helps avoid hydration warnings caused by browser extensions injecting attributes (e.g. fdprocessedid)
        suppressHydrationWarning
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-slate-950 cursor-pointer gap-2",
          {
            "bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500":
              variant === "primary",
            "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-600":
              variant === "secondary",
            "border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-100":
              variant === "outline",
            "hover:bg-slate-800 text-slate-100": variant === "ghost",
            "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600":
              variant === "danger",

            "h-9 px-4 text-sm": size === "sm",
            "h-11 px-6 text-base": size === "md",
            "h-14 px-8 text-lg": size === "lg",
          },
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
