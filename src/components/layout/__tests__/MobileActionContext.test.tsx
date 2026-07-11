import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act, createElement as h, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
    MobileActionProvider,
    useMobileActionBar,
    useRegisterMobileAction,
} from "../MobileActionContext";
import type { MobileAction, RegisteredAction } from "../mobileAction";

// React 19's act() requires this flag to drive effects synchronously in tests.
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const noop = () => {};

// --- Probes shared across tests ---------------------------------------------
// A component that registers an action for as long as it is mounted.
function Registrar({ action }: { action: MobileAction }) {
    useRegisterMobileAction(action);
    return null;
}

// Records every render of the bar consumer plus the latest value it saw, so
// tests can assert both the registered action AND how often consumers re-render
// (the whole point of the split dispatch/value context is to bound this).
let barRenders = 0;
let lastBar: RegisteredAction | null = null;
function BarProbe() {
    const bar = useMobileActionBar();
    barRenders++;
    lastBar = bar;
    return null;
}

// Flexible tree: 0-2 registrars (to exercise last-wins / stale-unmount) plus the
// bar probe, all under one provider instance that persists across re-renders.
function Tree({ first, second }: { first?: MobileAction | null; second?: MobileAction | null }) {
    const children: ReactNode[] = [];
    if (first) children.push(h(Registrar, { key: "a", action: first }));
    if (second) children.push(h(Registrar, { key: "b", action: second }));
    children.push(h(BarProbe, { key: "bar" }));
    return h(MobileActionProvider, null, ...children);
}

let container: HTMLDivElement;
let root: Root;

function render(props: { first?: MobileAction | null; second?: MobileAction | null }) {
    act(() => {
        root.render(h(Tree, props));
    });
}

beforeEach(() => {
    barRenders = 0;
    lastBar = null;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
});

afterEach(() => {
    act(() => {
        root.unmount();
    });
    container.remove();
});

describe("MobileActionProvider integration", () => {
    it("exposes a registered action to the bar", () => {
        render({ first: { label: "Go", onClick: noop } });
        expect(lastBar?.label).toBe("Go");
    });

    it("registers nothing when the action is null", () => {
        render({ first: null });
        expect(lastBar).toBeNull();
    });

    it("clears the bar when the registering component unmounts", () => {
        render({ first: { label: "Go", onClick: noop } });
        expect(lastBar?.label).toBe("Go");
        render({ first: null });
        expect(lastBar).toBeNull();
    });

    it("last registration wins when two components register", () => {
        render({
            first: { label: "First", onClick: noop },
            second: { label: "Second", onClick: noop },
        });
        expect(lastBar?.label).toBe("Second");
    });

    it("a stale unmount does not wipe a newer action", () => {
        render({
            first: { label: "First", onClick: noop },
            second: { label: "Second", onClick: noop },
        });
        expect(lastBar?.label).toBe("Second");
        // Remove only the first registrar; the newer action must survive.
        render({ second: { label: "Second", onClick: noop } });
        expect(lastBar?.label).toBe("Second");
    });

    it("propagates field updates without remounting", () => {
        render({ first: { label: "Go", onClick: noop, disabled: false } });
        expect(lastBar?.disabled).toBeFalsy();
        render({ first: { label: "Go", onClick: noop, disabled: true } });
        expect(lastBar?.disabled).toBe(true);
        expect(lastBar?.label).toBe("Go");
    });

    it("the bar always invokes the latest onClick, not a stale closure", () => {
        const calls: string[] = [];
        render({ first: { label: "Go", onClick: () => calls.push("v1") } });
        // Update the handler in place (same component position → no remount).
        render({ first: { label: "Go", onClick: () => calls.push("v2") } });
        act(() => {
            lastBar?.onClick();
        });
        expect(calls).toEqual(["v2"]);
    });

    it("registering an action settles in a bounded number of consumer renders (no render loop)", () => {
        render({ first: { label: "Go", onClick: noop } });
        // Initial render + one re-render for the async registration effect.
        // A broken (looping) provider would blow far past this and likely hang.
        expect(barRenders).toBeLessThanOrEqual(3);
    });

    it("updating a field does not re-run the registration and settles bounded", () => {
        render({ first: { label: "Go", onClick: noop, disabled: false } });
        barRenders = 0;
        render({ first: { label: "Go", onClick: noop, disabled: true } });
        expect(lastBar?.disabled).toBe(true);
        expect(barRenders).toBeLessThanOrEqual(3);
    });
});
