/** Wrap raw PDF bytes in a File so the existing lib/pdf functions can consume them. */
export function bytesToFile(bytes: Uint8Array, name = "doc.pdf"): File {
    return new File([bytes.buffer as ArrayBuffer], name, { type: "application/pdf" });
}
