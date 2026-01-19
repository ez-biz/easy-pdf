"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant = "primary",
            size = "md",
            isLoading = false,
            leftIcon,
            rightIcon,
            children,
            disabled,
            ...props
        },
        ref
    ) => {
        const baseStyles =
            "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

        const variants = {
            primary:
                "bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 focus:ring-primary-500",
            secondary:
                "bg-surface-100 dark:bg-surface-700 text-surface-900 dark:text-surface-100 hover:bg-surface-200 dark:hover:bg-surface-600 focus:ring-surface-500",
            ghost:
                "hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-300 focus:ring-surface-500",
            danger:
                "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25 focus:ring-red-500",
            outline:
                "border-2 border-surface-300 dark:border-surface-600 hover:border-primary-500 dark:hover:border-primary-500 text-surface-700 dark:text-surface-300 hover:text-primary-600 dark:hover:text-primary-400 focus:ring-primary-500",
        };

        const sizes = {
            sm: "px-3 py-1.5 text-sm",
            md: "px-5 py-2.5 text-sm",
            lg: "px-6 py-3 text-base",
        };

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    leftIcon
                )}
                {children}
                {!isLoading && rightIcon}
            </button>
        );
    }
);

Button.displayName = "Button";
