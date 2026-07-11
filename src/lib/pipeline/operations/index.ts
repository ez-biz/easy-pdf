import type { PdfOperation } from "../types";
import { compressOp } from "./compress";
import { rotateOp } from "./rotate";
import { watermarkOp } from "./watermark";
import { pageNumbersOp } from "./pageNumbers";
import { metadataOp } from "./metadata";
import { protectOp } from "./protect";
import { unlockOp } from "./unlock";
import { convertWordOp } from "./convertWord";
import { convertExcelOp } from "./convertExcel";
import { convertPptxOp } from "./convertPptx";

// Order shown in the "Add operation" picker. Terminal conversions last.
export const OPERATION_LIST: PdfOperation[] = [
    compressOp, rotateOp, watermarkOp, pageNumbersOp, metadataOp, protectOp, unlockOp,
    convertWordOp, convertExcelOp, convertPptxOp,
] as PdfOperation[];

export const OPERATIONS: Record<string, PdfOperation> = Object.fromEntries(
    OPERATION_LIST.map((op) => [op.id, op]),
);
