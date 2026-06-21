import type { PdfOperation } from "../types";
import { compressOp } from "./compress";
import { rotateOp } from "./rotate";
import { watermarkOp } from "./watermark";
import { pageNumbersOp } from "./pageNumbers";
import { metadataOp } from "./metadata";
import { protectOp } from "./protect";
import { unlockOp } from "./unlock";

// Order shown in the "Add operation" picker. The `as` assertion collapses the
// heterogeneous concrete option types into the base PdfOperation (invariant in
// TOptions because of OptionsForm), which a plain annotation can't do.
export const OPERATION_LIST: PdfOperation[] = [
    compressOp, rotateOp, watermarkOp, pageNumbersOp, metadataOp, protectOp, unlockOp,
] as PdfOperation[];

export const OPERATIONS: Record<string, PdfOperation> = Object.fromEntries(
    OPERATION_LIST.map((op) => [op.id, op]),
);
