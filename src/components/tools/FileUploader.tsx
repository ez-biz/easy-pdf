"use client";

import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
    Upload,
    FileText,
    Image as ImageIcon,
    X,
    AlertCircle,
    Camera,
} from "lucide-react";
import NextImage from "next/image";
import { cn, formatFileSize, generateId } from "@/lib/utils";
import { MAX_FILE_SIZE, MAX_FILES } from "@/lib/constants";
import { FileWithPreview } from "@/types/tools";

interface FileUploaderProps {
    accept: { [key: string]: string[] };
    multiple?: boolean;
    maxFiles?: number;
    maxSize?: number;
    onFilesChange: (files: FileWithPreview[]) => void;
    files: FileWithPreview[];
    label?: string;
    description?: string;
    mobileLabel?: string;
    allowCamera?: boolean;
}

export function FileUploader({
    accept,
    multiple = true,
    maxFiles = MAX_FILES,
    maxSize = MAX_FILE_SIZE,
    onFilesChange,
    files,
    label = "Drop your files here",
    description = "or click to browse",
    mobileLabel = "Tap to add files",
    allowCamera = false,
}: FileUploaderProps) {
    const [error, setError] = useState<string | null>(null);

    const addAcceptedFiles = useCallback(
        (acceptedFiles: File[]) => {
            setError(null);
            if (files.length + acceptedFiles.length > maxFiles) {
                setError(`Maximum ${maxFiles} files allowed`);
                return;
            }
            const newFiles: FileWithPreview[] = acceptedFiles.map((file) => ({
                file,
                id: generateId(),
                name: file.name,
                size: file.size,
                type: file.type,
                preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
            }));
            onFilesChange([...files, ...newFiles]);
        },
        [files, maxFiles, onFilesChange],
    );

    const cameraInputRef = useRef<HTMLInputElement>(null);

    const onCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const list = e.target.files ? Array.from(e.target.files) : [];
        if (list.length) addAcceptedFiles(list);
        e.target.value = ""; // allow re-capturing the same file
    };

    const onDrop = useCallback(
        (acceptedFiles: File[], rejectedFiles: { errors: readonly { code: string; message: string }[] }[]) => {
            setError(null);

            if (rejectedFiles.length > 0) {
                const rejection = rejectedFiles[0];
                if (rejection.errors[0]?.code === "file-too-large") {
                    setError(`File is too large. Maximum size is ${formatFileSize(maxSize)}`);
                } else if (rejection.errors[0]?.code === "file-invalid-type") {
                    setError("Invalid file type");
                } else {
                    setError(rejection.errors[0]?.message || "Error uploading file");
                }
                return;
            }

            addAcceptedFiles(acceptedFiles);
        },
        [addAcceptedFiles, maxSize]
    );

    const removeFile = (fileId: string) => {
        const fileToRemove = files.find((f) => f.id === fileId);
        if (fileToRemove?.preview) {
            URL.revokeObjectURL(fileToRemove.preview);
        }
        onFilesChange(files.filter((f) => f.id !== fileId));
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        multiple,
        maxSize,
        maxFiles: maxFiles - files.length,
    });

    const isPdf = Object.keys(accept).includes("application/pdf");

    return (
        <div className="w-full">
            {/* Drop Zone */}
            <div
                {...getRootProps()}
                className={cn(
                    "drop-zone cursor-pointer",
                    isDragActive && "active",
                    files.length > 0 && "border-solid"
                )}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center py-10">
                    <div
                        className={cn(
                            "w-20 h-20 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300",
                            isDragActive
                                ? "bg-primary-100 dark:bg-primary-900/30 scale-110 shadow-glow"
                                : "bg-surface-100 dark:bg-surface-800"
                        )}
                    >
                        {isPdf ? (
                            <FileText
                                className={cn(
                                    "w-10 h-10 transition-colors",
                                    isDragActive ? "text-primary-500" : "text-surface-400"
                                )}
                                aria-hidden="true"
                            />
                        ) : (
                            <ImageIcon
                                className={cn(
                                    "w-10 h-10 transition-colors",
                                    isDragActive ? "text-primary-500" : "text-surface-400"
                                )}
                                aria-hidden="true"
                            />
                        )}
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-semibold text-surface-900 dark:text-white mb-1">
                            <span className="md:hidden">{mobileLabel}</span>
                            <span className="hidden md:inline">{isDragActive ? "Drop files here" : label}</span>
                        </p>
                        <p className="text-sm text-surface-500 dark:text-surface-400 hidden md:block">
                            {description}
                        </p>
                    </div>
                    <button
                        type="button"
                        className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all font-medium"
                    >
                        <Upload className="w-4 h-4" aria-hidden="true" />
                        Select Files
                    </button>
                    <p className="text-xs text-surface-400 dark:text-surface-500 mt-4">
                        Max {formatFileSize(maxSize)} per file · Up to {maxFiles} files
                    </p>
                </div>
            </div>

            {allowCamera && (
                <div className="md:hidden mt-3">
                    <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={onCameraCapture}
                    />
                    <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-200 font-medium"
                    >
                        <Camera className="w-5 h-5" aria-hidden="true" />
                        Take photo
                    </button>
                </div>
            )}

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-3 flex items-center gap-2 text-red-500 text-sm"
                    >
                        <AlertCircle className="w-4 h-4" aria-hidden="true" />
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* File List */}
            <AnimatePresence>
                {files.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 space-y-2"
                    >
                        {files.map((file, index) => (
                            <motion.div
                                key={file.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700"
                            >
                                {file.preview ? (
                                    <NextImage
                                        src={file.preview}
                                        alt={file.name}
                                        width={48}
                                        height={48}
                                        className="w-12 h-12 object-cover rounded-lg"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-red-500" aria-hidden="true" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-surface-900 dark:text-white truncate">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-surface-500 dark:text-surface-400">
                                        {formatFileSize(file.size)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => removeFile(file.id)}
                                    className="p-1.5 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                                    aria-label="Remove file"
                                >
                                    <X className="w-4 h-4 text-surface-500" />
                                </button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
