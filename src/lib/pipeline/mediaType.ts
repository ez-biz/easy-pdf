/** Media types an operation can consume/produce. Extend when adding new outputs. */
export type MediaType = "pdf" | "docx" | "xlsx" | "pptx";

/** Download extension + MIME type for each media type. */
export const MEDIA_META: Record<MediaType, { ext: string; mime: string }> = {
    pdf: { ext: "pdf", mime: "application/pdf" },
    docx: { ext: "docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
    xlsx: { ext: "xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
    pptx: { ext: "pptx", mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
};
