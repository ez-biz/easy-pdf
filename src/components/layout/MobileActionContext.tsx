"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { applyRegister, applyUnregister, type MobileAction, type RegisteredAction } from "./mobileAction";

interface MobileActionContextValue {
    current: RegisteredAction | null;
    register: (action: MobileAction) => number;
    update: (id: number, action: MobileAction) => void;
    unregister: (id: number) => void;
}

const MobileActionCtx = createContext<MobileActionContextValue | null>(null);

export function MobileActionProvider({ children }: { children: ReactNode }) {
    const [current, setCurrent] = useState<RegisteredAction | null>(null);
    const nextId = useRef(0);

    const register = useCallback((action: MobileAction) => {
        const id = ++nextId.current;
        setCurrent((c) => applyRegister(c, { id, ...action }));
        return id;
    }, []);

    const update = useCallback((id: number, action: MobileAction) => {
        setCurrent((c) => (c && c.id === id ? { id, ...action } : c));
    }, []);

    const unregister = useCallback((id: number) => {
        setCurrent((c) => applyUnregister(c, id));
    }, []);

    return (
        <MobileActionCtx.Provider value={{ current, register, update, unregister }}>
            {children}
        </MobileActionCtx.Provider>
    );
}

/** Read the currently registered action (used by the bar). */
export function useMobileActionBar(): RegisteredAction | null {
    return useContext(MobileActionCtx)?.current ?? null;
}

/**
 * Register `action` with the provider while the calling component is mounted.
 * onClick is wrapped in a stable function that always calls the latest handler,
 * so the bar never invokes a stale closure. Pass null to register nothing.
 */
export function useRegisterMobileAction(action: MobileAction | null) {
    const ctx = useContext(MobileActionCtx);
    const actionRef = useRef(action);
    actionRef.current = action;
    const idRef = useRef<number | null>(null);

    const stableClick = useCallback(() => {
        actionRef.current?.onClick();
    }, []);

    const active = !!action;
    const label = action?.label;
    const disabled = action?.disabled;
    const loading = action?.loading;
    const context = action?.context;

    // Register once on mount (and when toggling active); unregister on unmount.
    useEffect(() => {
        if (!ctx || !active || label == null) return;
        const id = ctx.register({ label, onClick: stableClick, disabled, loading, context });
        idRef.current = id;
        return () => {
            if (idRef.current != null) {
                ctx.unregister(idRef.current);
                idRef.current = null;
            }
        };
        // Intentionally mount/active-only; field changes are synced by the effect below.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ctx, active]);

    // Keep the registered action's fields in sync as they change.
    useEffect(() => {
        if (ctx && active && label != null && idRef.current != null) {
            ctx.update(idRef.current, { label, onClick: stableClick, disabled, loading, context });
        }
    }, [ctx, active, label, disabled, loading, context, stableClick]);
}
