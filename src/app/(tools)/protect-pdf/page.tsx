"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { FileUploader } from "@/components/tools/FileUploader";
import { DownloadButton } from "@/components/tools/DownloadButton";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { FileWithPreview } from "@/types/tools";
import { protectPDF } from "@/lib/pdf/security";
import { downloadBlob, createPdfBlob } from "@/lib/utils";

export default function ProtectPDFPage() {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
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

    const getPasswordStrength = (pwd: string): { label: string; color: string; width: string } => {
        if (pwd.length === 0) return { label: "", color: "bg-surface-300", width: "0%" };
        if (pwd.length < 4) return { label: "Weak", color: "bg-red-500", width: "25%" };
        if (pwd.length < 8) return { label: "Fair", color: "bg-yellow-500", width: "50%" };
        if (pwd.length < 12) return { label: "Good", color: "bg-blue-500", width: "75%" };
        return { label: "Strong", color: "bg-green-500", width: "100%" };
    };

    const strength = getPasswordStrength(password);

    const handleProtect = async () => {
        if (files.length === 0) {
            setError("Please upload a PDF file");
            return;
        }

        if (password.length < 4) {
            setError("Password must be at least 4 characters");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
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

            const protectResult = await protectPDF(file, {
                userPassword: password,
            });

            clearInterval(progressInterval);
            setProgress(100);

            if (protectResult.success && protectResult.data) {
                const blob = createPdfBlob(protectResult.data);
                setResult({ blob });
            } else {
                setError(protectResult.error || "Failed to protect PDF");
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
            downloadBlob(result.blob, `${originalName}_protected.pdf`);
        }
    };

    const handleReset = () => {
        setFiles([]);
        setPassword("");
        setConfirmPassword("");
        setResult(null);
        setError(null);
        setProgress(0);
    };

    return (
        <ToolLayout
            title="Protect PDF"
            description="Add password protection to your PDF documents"
            icon={Lock}
            color="from-red-500 to-red-600"
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
                        label="Drop your PDF here"
                        description="or click to browse"
                    />

                    {/* Password Settings */}
                    {files.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-md mx-auto space-y-4"
                        >
                            <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 border border-surface-200 dark:border-surface-700">
                                <h3 className="font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Lock className="w-5 h-5" />
                                    Set Password
                                </h3>

                                {/* Password Input */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-surface-600 dark:text-surface-400 mb-2">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Enter password"
                                                className="w-full px-4 py-3 pr-10 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
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

                                        {/* Password Strength */}
                                        {password && (
                                            <div className="mt-2">
                                                <div className="h-1.5 bg-surface-200 dark:bg-surface-600 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${strength.color} transition-all`}
                                                        style={{ width: strength.width }}
                                                    />
                                                </div>
                                                <p className="text-xs text-surface-500 mt-1">
                                                    {strength.label}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-surface-600 dark:text-surface-400 mb-2">
                                            Confirm Password
                                        </label>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm password"
                                            className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-xl text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                        {confirmPassword && password !== confirmPassword && (
                                            <p className="text-xs text-red-500 mt-1">
                                                Passwords do not match
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-center text-surface-500">
                                Note: PDF encryption is handled client-side. Save your password securely.
                            </p>
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
                            <p className="text-sm text-center text-surface-500">Protecting PDF...</p>
                        </motion.div>
                    )}

                    {/* Action Button */}
                    {files.length > 0 && password && confirmPassword && !isProcessing && (
                        <div className="flex justify-center">
                            <Button
                                onClick={handleProtect}
                                size="lg"
                                disabled={password !== confirmPassword || password.length < 4}
                            >
                                Protect PDF
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <DownloadButton
                        onClick={handleDownload}
                        filename={`${files[0]?.name.replace(".pdf", "")}_protected.pdf`}
                        fileSize={result.blob.size}
                        isReady
                    />
                    <div className="text-center">
                        <Button variant="secondary" onClick={handleReset}>
                            Protect Another PDF
                        </Button>
                    </div>
                </div>
            )}
        </ToolLayout>
    );
}
