import type { PdfOperation } from "../types";
import { compressOp } from "./compress";
import { rotateOp } from "./rotate";
import { watermarkOp } from "./watermark";
import { pageNumbersOp } from "./pageNumbers";
import { metadataOp } from "./metadata";
import { protectOp } from "./protect";
import { unlockOp } from "./unlock";

// Order shown in the "Add operation" picker.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const OPERATION_LIST: PdfOperation<any>[] = [
    compressOp, rotateOp, watermarkOp, pageNumbersOp, metadataOp, protectOp, unlockOp,
];

export const OPERATIONS: Record<string, PdfOperation> = Object.fromEntries(
    OPERATION_LIST.map((op) => [op.id, op]),
);
