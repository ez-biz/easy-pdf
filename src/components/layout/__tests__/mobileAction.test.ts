import { describe, it, expect } from "vitest";
import { applyRegister, applyUnregister, type RegisteredAction } from "../mobileAction";

const noop = () => {};
const a = (id: number, label: string): RegisteredAction => ({ id, label, onClick: noop });

describe("mobileAction helpers", () => {
    it("register replaces the current action (last wins)", () => {
        expect(applyRegister(null, a(1, "A"))).toEqual(a(1, "A"));
        expect(applyRegister(a(1, "A"), a(2, "B")).label).toBe("B");
    });

    it("unregister clears only when the id matches the current action", () => {
        expect(applyUnregister(a(1, "A"), 1)).toBeNull();
    });

    it("unregister of a stale id leaves a newer action intact", () => {
        // old (id 1) unmounts after new (id 2) registered → must NOT clear id 2
        expect(applyUnregister(a(2, "B"), 1)).toEqual(a(2, "B"));
    });

    it("unregister on empty state is a no-op", () => {
        expect(applyUnregister(null, 1)).toBeNull();
    });
});
