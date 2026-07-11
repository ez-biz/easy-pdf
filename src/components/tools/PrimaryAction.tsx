"use client";

import { type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { useRegisterMobileAction } from "@/components/layout/MobileActionContext";

interface PrimaryActionProps {
    /** Plain text label — used on the desktop button and the mobile bar. */
    children: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    /** Optional status line shown above the mobile bar button. */
    context?: string;
    /** Optional icon for the desktop button only (not shown in the bar). */
    icon?: ReactNode;
    className?: string;
}

/**
 * Renders the primary action as an inline Button on desktop (hidden on mobile),
 * and registers it with the MobileActionBar so it appears pinned on mobile.
 */
export function PrimaryAction({
    children, onClick, disabled, loading, context, icon, className,
}: PrimaryActionProps) {
    useRegisterMobileAction({ label: children, onClick, disabled, loading, context });

    return (
        <Button
            onClick={onClick}
            disabled={disabled}
            isLoading={loading}
            leftIcon={icon}
            size="lg"
            className={`max-md:hidden ${className ?? ""}`}
        >
            {children}
        </Button>
    );
}
