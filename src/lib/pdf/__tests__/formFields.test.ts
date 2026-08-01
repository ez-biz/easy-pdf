import { describe, it, expect } from "vitest";
import {
    PDFDocument,
    PDFTextField,
    PDFDropdown,
    PDFCheckBox,
    PDFRadioGroup,
} from "@cantoo/pdf-lib";
import { applyFormFieldValues, readFieldOptions } from "../formFields";

/** A form with one field of each interactive type. */
async function makeForm() {
    const doc = await PDFDocument.create();
    const page = doc.addPage([595, 842]);
    const form = doc.getForm();

    form.createTextField("applicant.name").addToPage(page, { x: 10, y: 700, width: 200, height: 20 });
    form.createTextField("applicant.email").addToPage(page, { x: 10, y: 660, width: 200, height: 20 });

    const cb = form.createCheckBox("applicant.subscribe");
    cb.addToPage(page, { x: 10, y: 620, width: 16, height: 16 });

    const dd = form.createDropdown("applicant.role");
    dd.addOptions(["Engineer", "Designer", "Manager"]);
    dd.select("Engineer");
    dd.addToPage(page, { x: 10, y: 580, width: 200, height: 20 });

    const rg = form.createRadioGroup("applicant.shift");
    rg.addOptionToPage("Day", page, { x: 10, y: 540, width: 16, height: 16 });
    rg.addOptionToPage("Night", page, { x: 40, y: 540, width: 16, height: 16 });

    return { doc, form };
}

/** Re-serialise and reload so we assert on what actually lands in the file. */
async function roundTrip(doc: PDFDocument) {
    const reloaded = await PDFDocument.load(await doc.save());
    return reloaded.getForm();
}

describe("readFieldOptions", () => {
    it("returns the choices for dropdowns and radio groups", async () => {
        const { form } = await makeForm();
        expect(readFieldOptions(form, "applicant.role")).toEqual(["Engineer", "Designer", "Manager"]);
        expect(readFieldOptions(form, "applicant.shift")).toEqual(["Day", "Night"]);
    });

    it("returns undefined for field types without choices", async () => {
        const { form } = await makeForm();
        expect(readFieldOptions(form, "applicant.name")).toBeUndefined();
        expect(readFieldOptions(form, "applicant.subscribe")).toBeUndefined();
        expect(readFieldOptions(form, "missing.field")).toBeUndefined();
    });
});

describe("applyFormFieldValues", () => {
    it("writes text, checkbox, dropdown and radio values", async () => {
        const { doc, form } = await makeForm();
        const { rejected } = applyFormFieldValues(form, [
            { name: "applicant.name", value: "Ada Lovelace" },
            { name: "applicant.email", value: "ada@example.com" },
            { name: "applicant.subscribe", value: "true" },
            { name: "applicant.role", value: "Designer" },
            { name: "applicant.shift", value: "Night" },
        ]);
        expect(rejected).toEqual([]);

        const out = await roundTrip(doc);
        expect((out.getField("applicant.name") as PDFTextField).getText()).toBe("Ada Lovelace");
        expect((out.getField("applicant.email") as PDFTextField).getText()).toBe("ada@example.com");
        expect((out.getField("applicant.subscribe") as PDFCheckBox).isChecked()).toBe(true);
        expect((out.getField("applicant.role") as PDFDropdown).getSelected()).toEqual(["Designer"]);
        expect((out.getField("applicant.shift") as PDFRadioGroup).getSelected()).toBe("Night");
    });

    // REGRESSION: the old code called select() unguarded inside a bare catch {}.
    // pdf-lib *adds* an unknown option rather than throwing, so "Astronaut" was
    // silently written into a field whose only choices were Engineer/Designer/
    // Manager, and the UI still reported success.
    it("rejects a dropdown value outside the field's options and does not write it", async () => {
        const { doc, form } = await makeForm();
        const { rejected } = applyFormFieldValues(form, [
            { name: "applicant.role", value: "Astronaut" },
        ]);
        expect(rejected).toEqual(["applicant.role"]);

        const out = await roundTrip(doc);
        const role = out.getField("applicant.role") as PDFDropdown;
        expect(role.getSelected()).toEqual(["Engineer"]); // unchanged
        expect(role.getOptions()).toEqual(["Engineer", "Designer", "Manager"]); // not widened
    });

    it("rejects a radio value outside the group's options", async () => {
        const { doc, form } = await makeForm();
        const { rejected } = applyFormFieldValues(form, [
            { name: "applicant.shift", value: "Graveyard" },
        ]);
        expect(rejected).toEqual(["applicant.shift"]);
        expect((await roundTrip(doc)).getField("applicant.shift").constructor.name).toBe("PDFRadioGroup");
        expect(readFieldOptions(await roundTrip(doc), "applicant.shift")).toEqual(["Day", "Night"]);
    });

    it("reports every rejected field while still writing the valid ones", async () => {
        const { doc, form } = await makeForm();
        const { rejected } = applyFormFieldValues(form, [
            { name: "applicant.name", value: "Grace" },
            { name: "applicant.role", value: "Astronaut" },
            { name: "applicant.shift", value: "Graveyard" },
        ]);
        expect(rejected).toEqual(["applicant.role", "applicant.shift"]);

        const out = await roundTrip(doc);
        expect((out.getField("applicant.name") as PDFTextField).getText()).toBe("Grace");
    });

    it("treats an empty choice value as leave-alone, not an error", async () => {
        const { doc, form } = await makeForm();
        const { rejected } = applyFormFieldValues(form, [{ name: "applicant.role", value: "" }]);
        expect(rejected).toEqual([]);
        expect((( await roundTrip(doc)).getField("applicant.role") as PDFDropdown).getSelected()).toEqual([
            "Engineer",
        ]);
    });

    it("clears a checkbox when told false", async () => {
        const { doc, form } = await makeForm();
        applyFormFieldValues(form, [{ name: "applicant.subscribe", value: "true" }]);
        applyFormFieldValues(form, [{ name: "applicant.subscribe", value: "false" }]);
        expect((( await roundTrip(doc)).getField("applicant.subscribe") as PDFCheckBox).isChecked()).toBe(
            false,
        );
    });

    it("skips unknown field names without reporting them as rejected", async () => {
        const { form } = await makeForm();
        const { rejected } = applyFormFieldValues(form, [{ name: "nope.missing", value: "x" }]);
        expect(rejected).toEqual([]);
    });

    it("allows an empty string into a text field", async () => {
        const { doc, form } = await makeForm();
        applyFormFieldValues(form, [{ name: "applicant.name", value: "" }]);
        const v = ((await roundTrip(doc)).getField("applicant.name") as PDFTextField).getText();
        expect(v ?? "").toBe("");
    });
});
