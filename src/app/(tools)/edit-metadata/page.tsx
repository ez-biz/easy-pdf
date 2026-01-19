"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { FileText, Info } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { Button } from "@/components/ui/Button";
import { FileWithPreview } from "@/types/tools";
import { readMetadata, updateMetadata, PDFMetadata } from "@/lib/pdf/metadata";
import { downloadBlob, createPdfBlob } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import { useAppStore } from "@/store/useAppStore";

export default function EditMetadataPage() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [metadata, setMetadata] = useState<PDFMetadata | null>(null);
    const [editedMetadata, setEditedMetadata] = useState<Partial<PDFMetadata>>({});
    const [result, setResult] = useState<Blob | null>(null);
    const toast = useToast();
    const { addActivity, incrementProcessed } = useAppStore();

    const handleFilesChange = useCallback(async (newFiles: FileWithPreview[]) => {
        setFiles(newFiles);
        setResult(null);
        setMetadata(null);
        setEditedMetadata({});

        if (newFiles.length > 0) {
            // Read metadata from the uploaded PDF
            const response = await readMetadata(newFiles[0].file);

            if (response.success && response.metadata) {
                setMetadata(response.metadata);
                setEditedMetadata(response.metadata);
            } else {
                toast.error(response.error || "Failed to read PDF metadata");
            }
        }
    }, [toast]);

    const handleFieldChange = (field: keyof PDFMetadata, value: string) => {
        setEditedMetadata((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleUpdate = async () => {
        if (files.length === 0) {
            toast.warning("Please upload a PDF file");
            return;
        }

        setIsProcessing(true);

        try {
            const response = await updateMetadata(files[0].file, editedMetadata);

            if (response.success && response.data) {
                const blob = createPdfBlob(response.data);
                setResult(blob);
                toast.success("Metadata updated successfully!");
                addActivity({
                    toolName: "Edit Metadata",
                    fileName: files[0].name,
                });
                incrementProcessed();
            } else {
                toast.error(response.error || "Failed to update metadata");
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (result) {
            downloadBlob(result, "metadata-updated.pdf");
            toast.success("PDF downloaded successfully!");
        }
    };

    const handleReset = () => {
        setFiles([]);
        setResult(null);
        setMetadata(null);
        setEditedMetadata({});
    };

    const formatDate = (date: Date | null): string => {
        if (!date) return "Not set";
        return new Date(date).toLocaleString();
    };

    return (
        <ToolLayout
            title="Edit Metadata"
            description="View and edit PDF document properties"
            icon={FileText}
            color="from-purple-500 to-purple-600"
        >
            <div className="space-y-6">
                {/* File Upload */}
                {!result && (
                    <FileUploader
                        accept={{ "application/pdf": [".pdf"] }}
                        maxFiles={1}
                        files={files}
                        onFilesChange={handleFilesChange}
                    />
                )}

                {/* Metadata Form */}
                {metadata && !result && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Info Banner */}
                        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-800 dark:text-blue-200">
                                <p className="font-medium mb-1">Edit PDF Properties</p>
                                <p className="text-blue-700 dark:text-blue-300">
                                    Update the document metadata below. These properties will be visible
                                    when viewing PDF details in most PDF readers.
                                </p>
                            </div>
                        </div>

                        {/* Editable Fields */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Title */}
                            <div>
                                <label
                                    htmlFor="title"
                                    className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                                >
                                    Title
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    value={editedMetadata.title || ""}
                                    onChange={(e) => handleFieldChange("title", e.target.value)}
                                    className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Document title"
                                />
                            </div>

                            {/* Author */}
                            <div>
                                <label
                                    htmlFor="author"
                                    className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                                >
                                    Author
                                </label>
                                <input
                                    type="text"
                                    id="author"
                                    value={editedMetadata.author || ""}
                                    onChange={(e) => handleFieldChange("author", e.target.value)}
                                    className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Document author"
                                />
                            </div>

                            {/* Subject */}
                            <div>
                                <label
                                    htmlFor="subject"
                                    className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                                >
                                    Subject
                                </label>
                                <input
                                    type="text"
                                    id="subject"
                                    value={editedMetadata.subject || ""}
                                    onChange={(e) => handleFieldChange("subject", e.target.value)}
                                    className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Document subject"
                                />
                            </div>

                            {/* Keywords */}
                            <div>
                                <label
                                    htmlFor="keywords"
                                    className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                                >
                                    Keywords
                                </label>
                                <input
                                    type="text"
                                    id="keywords"
                                    value={editedMetadata.keywords || ""}
                                    onChange={(e) => handleFieldChange("keywords", e.target.value)}
                                    className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Comma-separated keywords"
                                />
                            </div>

                            {/* Creator */}
                            <div>
                                <label
                                    htmlFor="creator"
                                    className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                                >
                                    Creator
                                </label>
                                <input
                                    type="text"
                                    id="creator"
                                    value={editedMetadata.creator || ""}
                                    onChange={(e) => handleFieldChange("creator", e.target.value)}
                                    className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Application that created the document"
                                />
                            </div>

                            {/* Producer */}
                            <div>
                                <label
                                    htmlFor="producer"
                                    className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                                >
                                    Producer
                                </label>
                                <input
                                    type="text"
                                    id="producer"
                                    value={editedMetadata.producer || ""}
                                    onChange={(e) => handleFieldChange("producer", e.target.value)}
                                    className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Application that produced the PDF"
                                />
                            </div>
                        </div>

                        {/* Read-only Date Fields */}
                        <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-surface-200 dark:border-surface-700">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                    Creation Date
                                </label>
                                <div className="px-4 py-3 bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-600 rounded-xl text-surface-600 dark:text-surface-400">
                                    {formatDate(metadata.creationDate)}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                    Modification Date
                                </label>
                                <div className="px-4 py-3 bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-600 rounded-xl text-surface-600 dark:text-surface-400">
                                    {formatDate(metadata.modificationDate)} (will be updated)
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            <Button
                                onClick={handleUpdate}
                                disabled={isProcessing}
                                size="lg"
                                className="flex-1"
                            >
                                {isProcessing ? "Updating..." : "Update Metadata"}
                            </Button>
                            <Button onClick={handleReset} variant="outline" size="lg">
                                Reset
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* Success State */}
                {result && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-6"
                    >
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                            <FileText className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
                                Metadata Updated Successfully!
                            </h3>
                            <p className="text-surface-600 dark:text-surface-400">
                                Your PDF metadata has been updated with the new information.
                            </p>
                        </div>
                        <div className="flex gap-4 justify-center">
                            <DownloadButton
                                onClick={handleDownload}
                                filename="metadata-updated.pdf"
                                isReady={true}
                            />
                            <Button onClick={handleReset} variant="outline" size="lg">
                                Edit Another PDF
                            </Button>
                        </div>
                    </motion.div>
                )}
            </div>
        </ToolLayout>
    );
}
