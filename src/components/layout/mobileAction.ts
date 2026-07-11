export interface MobileAction {
    /** Plain text label, shown verbatim on the desktop button and the mobile bar. */
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    /** Optional short status line above the bar button, e.g. "2 files ready". */
    context?: string;
}

export interface RegisteredAction extends MobileAction {
    id: number;
}

/** Register replaces whatever was current (last registration wins). */
export function applyRegister(
    _current: RegisteredAction | null,
    next: RegisteredAction,
): RegisteredAction {
    return next;
}

/**
 * Unregister clears the current action only if it is the one being removed.
 * This prevents an old component unmounting *after* a newer one mounted from
 * wiping the newer action.
 */
export function applyUnregister(
    current: RegisteredAction | null,
    id: number,
): RegisteredAction | null {
    return current && current.id === id ? null : current;
}
