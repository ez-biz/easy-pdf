"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, FormInput, Check } from "lucide-react";
import { PDFDocument, PDFTextField, PDFDropdown, PDFCheckBox, PDFRadioGroup } from "@cantoo/pdf-lib";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { PrimaryAction } from "@/components/tools/PrimaryAction";
import { Button } from "@/components/ui/Button";
import { FileWithPreview } from "@/types/tools";
import { downloadBlob, formatFileSize, createPdfBlob, readFileAsArrayBuffer } from "@/lib/utils";

interface FormField {
    name: string;
    type: string;
    value: string;
}

export default function FillPdfFormClient() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [formFields, setFormFields] = useState<FormField[]>([]);
    const [result, setResult] = useState<{ blob: Blob; size: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoadingFields, setIsLoadingFields] = useState(false);

    const file = files[0]?.file;

    const handleFilesChange = useCallback((newFiles: FileWithPreview[]) => {
        setFiles(newFiles.slice(0, 1));
        setResult(null);
        setError(null);
        setFormFields([]);
    }, []);

    // Load form fields when file changes
    useEffect(() => {
        if (!file) return;

        const loadFields = async () => {
            setIsLoadingFields(true);
            try {
                const arrayBuffer = await readFileAsArrayBuffer(file);
                const pdfDoc = await PDFDocument.load(arrayBuffer);
                const form = pdfDoc.getForm();
                const fields = form.getFields();

                const loadedFields: FormField[] = fields.map((field) => {
                    const name = field.getName();
                    let type = "text";
                    let value = "";

                    if (field instanceof PDFTextField) {
                        type = "text";
                        value = field.getText() ?? "";
                    } else if (field instanceof PDFDropdown) {
                        type = "dropdown";
                        const selected = field.getSelected();
                        value = Array.isArray(selected) ? selected[0] ?? "" : selected ?? "";
                    } else if (field instanceof PDFCheckBox) {
                        type = "checkbox";
                        value = field.isChecked() ? "true" : "false";
                    } else if (field instanceof PDFRadioGroup) {
                        type = "radio";
                        const selected = field.getSelected();
                        value = Array.isArray(selected) ? selected[0] ?? "" : selected ?? "";
                    }

                    return { name, type, value };
                });

                setFormFields(loadedFields);
            } catch (err) {
                setError("Could not read form fields from this PDF. It may not contain fillable fields.");
            } finally {
                setIsLoadingFields(false);
            }
        };

        loadFields();
    }, [file]);

    const handleFieldChange = (index: number, value: string) => {
        const updated = [...formFields];
        updated[index] = { ...updated[index], value };
        setFormFields(updated);
    };

    const handleFill = async () => {
        if (!file) {
            setError("Please upload a PDF file");
            return;
        }

        setError(null);
        setIsProcessing(true);

        try {
            const arrayBuffer = await readFileAsArrayBuffer(file);
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const form = pdfDoc.getForm();

            for (const field of formFields) {
                try {
                    const pdfField = form.getFieldMaybe(field.name);
                    if (!pdfField) continue;

                    if (pdfField instanceof PDFTextField) {
                        pdfField.setText(field.value);
                    } else if (pdfField instanceof PDFDropdown) {
                        pdfField.select(field.value);
                    } else if (pdfField instanceof PDFCheckBox) {
                        if (field.value === "true") {
                            pdfField.check();
                        } else {
                            pdfField.uncheck();
                        }
                    } else if (pdfField instanceof PDFRadioGroup) {
                        pdfField.select(field.value);
                    }
                } catch {
                    // Skip fields that can't be set
                }
            }

            const pdfBytes = await pdfDoc.save();
            const blob = createPdfBlob(pdfBytes);
            setResult({ blob, size: blob.size });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fill form");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (result && file) {
            const baseName = file.name.replace(/\.pdf$/i, "");
            downloadBlob(result.blob, `${baseName}_filled.pdf`);
        }
    };

    const handleReset = () => {
        setFiles([]);
        setResult(null);
        setError(null);
        setFormFields([]);
    };

    return (
        <ToolLayout
            title="Fill PDF Form"
            description="Fill interactive form fields in your PDF"
            icon={FormInput}
            color="from-sky-500 to-blue-600"
        >
            {!result ? (
                <div className="space-y-6">
                    <FileUploader
                        accept={{ "application/pdf": [".pdf"] }}
                        multiple={false}
                        maxFiles={1}
                        files={files}
                        onFilesChange={handleFilesChange}
                        label="Drop a fillable PDF form here"
                    />

                    {file && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-3 p-4 bg-surface-50 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
                                <div className="w-12 h-14 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <p className="font-medium text-surface-900 dark:text-white truncate">{file.name}</p>
                                    <p className="text-sm text-surface-500">{formatFileSize(file.size)}</p>
                                </div>
                            </div>

                            {isLoadingFields && (
                                <div className="text-center py-8 text-surface-500">
                                    <p>Loading form fields...</p>
                                </div>
                            )}

                            {!isLoadingFields && formFields.length === 0 && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center">
                                    <FormInput className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                                    <p className="text-amber-700 dark:text-amber-300 font-medium">No fillable fields found</p>
                                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                                        This PDF doesn't contain interactive form fields. Try a PDF with forms.
                                    </p>
                                </div>
                            )}

                            {!isLoadingFields && formFields.length > 0 && (
                                <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                                    <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
                                        Form Fields ({formFields.length})
                                    </h3>
                                    <div className="space-y-4 max-h-96 overflow-y-auto">
                                        {formFields.map((field, index) => (
                                            <div key={field.name} className="space-y-1">
                                                <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                                                    {field.name}
                                                </label>
                                                {field.type === "checkbox" ? (
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={field.value === "true"}
                                                            onChange={(e) =>
                                                                handleFieldChange(index, e.target.checked ? "true" : "false")
                                                            }
                                                            className="w-4 h-4 rounded accent-primary-500"
                                                        />
                                                        <span className="text-sm text-surface-500">Checked</span>
                                                    </label>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={field.value}
                                                        onChange={(e) => handleFieldChange(index, e.target.value)}
                                                        className="w-full px-4 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {formFields.length > 0 && (
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-surface-500">{formFields.length} field{formFields.length !== 1 ? "s" : ""}</p>
                                    <PrimaryAction
                                        onClick={handleFill}
                                        loading={isProcessing}
                                        icon={<Check className="w-4 h-4" />}
                                    >
                                        Fill & Save
                                    </PrimaryAction>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                >
                    <div className="bg-white dark:bg-surface-800 rounded-2xl p-8 border border-surface-200 dark:border-surface-700 text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-20 h-20 bg-sky-100 dark:bg-sky-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        >
                            <Check className="w-10 h-10 text-sky-500" />
                        </motion.div>
                        <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">Form Filled</h2>
                        <p className="text-surface-500 dark:text-surface-400">
                            {formFields.length} field{formFields.length !== 1 ? "s" : ""} filled and saved.
                        </p>
                    </div>

                    <div className="flex items-center justify-between">
                        <DownloadButton
                            onClick={handleDownload}
                            filename={file.name.replace(/\.pdf$/i, "_filled.pdf")}
                            fileSize={result.size}
                            isReady={true}
                        />
                        <button onClick={handleReset} className="text-sm text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 transition-colors">
                            Fill Another
                        </button>
                    </div>
                </motion.div>
            )}
        </ToolLayout>
    );
}
