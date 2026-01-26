import { PDFDocument } from "@cantoo/pdf-lib";

export interface ProtectResult {
    success: boolean;
    data?: Uint8Array;
    error?: string;
}

export interface ProtectOptions {
    userPassword: string;
    ownerPassword?: string;
    permissions?: {
        printing?: boolean;
        modifying?: boolean;
        copying?: boolean;
        annotating?: boolean;
    };
}

export interface UnlockResult {
    success: boolean;
    data?: Uint8Array;
    error?: string;
}

/**
 * Add password protection to a PDF
 * Uses @cantoo/pdf-lib which supports encryption
 */
export async function protectPDF(
    pdfFile: File,
    options: ProtectOptions
): Promise<ProtectResult> {
    try {
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);

        // @cantoo/pdf-lib supports encryption through the save() method
        const ownerPassword = options.ownerPassword || options.userPassword;

        const pdfBytes = await pdfDoc.save({
            userPassword: options.userPassword,
            ownerPassword: ownerPassword,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any); // Type assertion needed as TypeScript definitions may not include encryption options

        return {
            success: true,
            data: pdfBytes,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to protect PDF",
        };
    }
}

/**
 * Remove password protection from a PDF
 */
export async function unlockPDF(
    pdfFile: File,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _password: string
): Promise<UnlockResult> {
    try {
        const arrayBuffer = await pdfFile.arrayBuffer();

        // Try to load the PDF with the provided password
        // @cantoo/pdf-lib uses ignoreEncryption or password in the options
        const pdfDoc = await PDFDocument.load(arrayBuffer, {
            ignoreEncryption: true,
            password: _password,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        // Save without encryption
        const pdfBytes = await pdfDoc.save();

        return {
            success: true,
            data: pdfBytes,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to unlock PDF";

        // Check if it's a password error
        if (message.includes("password") || message.includes("decrypt")) {
            return {
                success: false,
                error: "Incorrect password. Please try again.",
            };
        }

        return {
            success: false,
            error: message,
        };
    }
}
