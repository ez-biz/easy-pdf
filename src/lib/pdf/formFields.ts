/**
 * Writing values back into a PDF AcroForm.
 *
 * Extracted from FillPdfFormClient. The bug this guards against: dropdown and
 * radio values were written with `select()` without checking the field's own
 * option list, and pdf-lib will happily *add* an unknown option — producing a
 * PDF whose field value violates the form it came from.
 */
import { PDFForm, PDFTextField, PDFDropdown, PDFCheckBox, PDFRadioGroup } from "@cantoo/pdf-lib";

export interface FieldValue {
    name: string;
    value: string;
}

export interface ApplyResult {
    /** Names of fields whose value could not be written. */
    rejected: string[];
}

/** Read the choices a field allows, or undefined for field types without choices. */
export function readFieldOptions(form: PDFForm, name: string): string[] | undefined {
    const field = form.getFieldMaybe(name);
    if (field instanceof PDFDropdown || field instanceof PDFRadioGroup) {
        return field.getOptions();
    }
    return undefined;
}

export function applyFormFieldValues(form: PDFForm, fields: FieldValue[]): ApplyResult {
    const rejected: string[] = [];

    for (const field of fields) {
        try {
            const pdfField = form.getFieldMaybe(field.name);
            if (!pdfField) continue;

            if (pdfField instanceof PDFTextField) {
                pdfField.setText(field.value);
            } else if (pdfField instanceof PDFDropdown || pdfField instanceof PDFRadioGroup) {
                // An empty value means "leave it alone", not "write empty".
                if (field.value === "") continue;
                if (!pdfField.getOptions().includes(field.value)) {
                    rejected.push(field.name);
                    continue;
                }
                pdfField.select(field.value);
            } else if (pdfField instanceof PDFCheckBox) {
                if (field.value === "true") {
                    pdfField.check();
                } else {
                    pdfField.uncheck();
                }
            }
        } catch {
            rejected.push(field.name);
        }
    }

    return { rejected };
}
