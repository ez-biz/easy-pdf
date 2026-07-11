"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { applyRegister, applyUnregister, type MobileAction, type RegisteredAction } from "./mobileAction";

interface MobileActionDispatch {
    register: (action: MobileAction) => number;
    update: (id: number, action: MobileAction) => void;
    unregister: (id: number) => void;
}

// Stable dispatch (identity never changes) so registration effects don't re-run
// when the current action changes. Value context holds the current action.
const MobileActionDispatchCtx = createContext<MobileActionDispatch | null>(null);
const MobileActionValueCtx = createContext<RegisteredAction | null>(null);

export function MobileActionProvider({ children }: { children: ReactNode }) {
    const [current, setCurrent] = useState<RegisteredAction | null>(null);
    const nextId = useRef(0);

    const dispatch = useMemo<MobileActionDispatch>(
        () => ({
            register: (action) => {
                const id = ++nextId.current;
                setCurrent((c) => applyRegister(c, { id, ...action }));
                return id;
            },
            update: (id, action) => {
                setCurrent((c) => (c && c.id === id ? { id, ...action } : c));
            },
            unregister: (id) => {
                setCurrent((c) => applyUnregister(c, id));
            },
        }),
        [],
    );

    return (
        <MobileActionDispatchCtx.Provider value={dispatch}>
            <MobileActionValueCtx.Provider value={current}>{children}</MobileActionValueCtx.Provider>
        </MobileActionDispatchCtx.Provider>
    );
}

/** Read the currently registered action (used by the bar). */
export function useMobileActionBar(): RegisteredAction | null {
    return useContext(MobileActionValueCtx);
}

/**
 * Register `action` with the provider while the calling component is mounted.
 * onClick is wrapped in a stable function that always calls the latest handler,
 * so the bar never invokes a stale closure. Pass null to register nothing.
 */
export function useRegisterMobileAction(action: MobileAction | null) {
    const dispatch = useContext(MobileActionDispatchCtx);
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
        if (!dispatch || !active || label == null) return;
        const id = dispatch.register({ label, onClick: stableClick, disabled, loading, context });
        idRef.current = id;
        return () => {
            if (idRef.current != null) {
                dispatch.unregister(idRef.current);
                idRef.current = null;
            }
        };
        // Intentionally mount/active-only; field changes are synced by the effect below.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch, active]);

    // Keep the registered action's fields in sync as they change.
    useEffect(() => {
        if (dispatch && active && label != null && idRef.current != null) {
            dispatch.update(idRef.current, { label, onClick: stableClick, disabled, loading, context });
        }
    }, [dispatch, active, label, disabled, loading, context, stableClick]);
}
