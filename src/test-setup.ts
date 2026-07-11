// Vitest global setup
// pdfjs-dist needs a valid workerSrc in jsdom; point it at the actual worker
// file so the fake-worker fallback can import it as a file: URL instead of
// trying to fetch an http://localhost/... URL (which Node rejects).
import { createRequire } from "module";
import * as pdfjsLib from "pdfjs-dist";

const require = createRequire(import.meta.url);
const workerPath: string = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");
pdfjsLib.GlobalWorkerOptions.workerSrc = `file://${workerPath}`;
