"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Unlock, Eye, EyeOff } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { FileWithPreview } from "@/types/tools";
import { unlockPDF } from "@/lib/pdf/security";
import { downloadBlob, createPdfBlob } from "@/lib/utils";

export default function UnlockClient() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<{ blob: Blob } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFilesChange = useCallback((newFiles: FileWithPreview[]) => {
        setFiles(newFiles);
        setResult(null);
        setError(null);
    }, []);

    const handleUnlock = async () => {
        if (files.length === 0) {
            setError("Please upload a PDF file");
            return;
        }

        if (!password) {
            setError("Please enter the PDF password");
            return;
        }

        setIsProcessing(true);
        setProgress(0);
        setError(null);

        try {
            const file = files[0].file;
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 15, 90));
            }, 150);

            const unlockResult = await unlockPDF(file, password);

            clearInterval(progressInterval);
            setProgress(100);

            if (unlockResult.success && unlockResult.data) {
                const blob = createPdfBlob(unlockResult.data);
                setResult({ blob });
            } else {
                setError(unlockResult.error || "Failed to unlock PDF");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (result) {
            const originalName = files[0]?.name.replace(".pdf", "") || "document";
            downloadBlob(result.blob, `${originalName}_unlocked.pdf`);
        }
    };

    const handleReset = () => {
        setFiles([]);
        setPassword("");
        setResult(null);
        setError(null);
        setProgress(0);
    };

    return (
        <ToolLayout
            title="Unlock PDF"
            description="Remove password protection from your PDF"
            icon={Unlock}
            color="from-amber-500 to-amber-600"
        >
            {!result ? (
                <div className="space-y-6">
                    {/* File Uploader */}
                    <FileUploader
                        accept={{ "application/pdf": [".pdf"] }}
                        multiple={false}
                        maxFiles={1}
                        files={files}
                        onFilesChange={handleFilesChange}
                        label="Drop your password-protected PDF here"
                        description="or click to browse"
                    />

                    {/* Password Input */}
                    {files.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-md mx-auto"
                        >
                            <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                                <h3 className="font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Unlock className="w-5 h-5" />
                                    Enter PDF Password
                                </h3>

                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter password to unlock"
                                        className="w-full px-4 py-3 pr-10 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && password) {
                                                handleUnlock();
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>

                                <p className="text-xs text-surface-500 mt-3">
                                    Enter the password used to protect this PDF. The unlocked version will have no password restrictions.
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* Error */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm text-center"
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Progress */}
                    {isProcessing && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                            <ProgressBar value={progress} />
                            <p className="text-sm text-center text-surface-500">Unlocking PDF...</p>
                        </motion.div>
                    )}

                    {/* Action Button */}
                    {files.length > 0 && password && !isProcessing && (
                        <div className="flex justify-center">
                            <Button onClick={handleUnlock} size="lg">
                                Unlock PDF
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="text-center mb-4">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Unlock className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-green-600 dark:text-green-400 font-medium">
                            PDF unlocked successfully!
                        </p>
                    </div>

                    <DownloadButton
                        onClick={handleDownload}
                        filename={`${files[0]?.name.replace(".pdf", "")}_unlocked.pdf`}
                        fileSize={result.blob.size}
                        isReady
                    />
                    <div className="text-center">
                        <Button variant="secondary" onClick={handleReset}>
                            Unlock Another PDF
                        </Button>
                    </div>
                </div>
            )}
        </ToolLayout>
    );
}
