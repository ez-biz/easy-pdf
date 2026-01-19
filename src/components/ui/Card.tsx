"use client";

import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "glass" | "hover";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = "default", children, ...props }, ref) => {
        const variants = {
            default:
                "bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-card",
            glass: "glass-card",
            hover:
                "bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300",
        };

        return (
            <div
                ref={ref}
                className={cn("rounded-2xl p-6", variants[variant], className)}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = "Card";

type CardHeaderProps = HTMLAttributes<HTMLDivElement>;

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("mb-4", className)} {...props} />
    )
);

CardHeader.displayName = "CardHeader";

type CardTitleProps = HTMLAttributes<HTMLHeadingElement>;

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
    ({ className, ...props }, ref) => (
        <h3
            ref={ref}
            className={cn(
                "text-xl font-semibold text-surface-900 dark:text-white",
                className
            )}
            {...props}
        />
    )
);

CardTitle.displayName = "CardTitle";

type CardDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

export const CardDescription = forwardRef<
    HTMLParagraphElement,
    CardDescriptionProps
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-surface-500 dark:text-surface-400", className)}
        {...props}
    />
));

CardDescription.displayName = "CardDescription";

type CardContentProps = HTMLAttributes<HTMLDivElement>;

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("", className)} {...props} />
    )
);

CardContent.displayName = "CardContent";

type CardFooterProps = HTMLAttributes<HTMLDivElement>;

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn("mt-4 flex items-center gap-2", className)}
            {...props}
        />
    )
);

CardFooter.displayName = "CardFooter";
