import JSZip from "jszip";
import type { FileStatus } from "./types";

function dedupe(name: string, used: Set<string>): string {
    if (!used.has(name)) { used.add(name); return name; }
    const dot = name.lastIndexOf(".");
    const base = dot > 0 ? name.slice(0, dot) : name;
    const ext = dot > 0 ? name.slice(dot) : "";
    let n = 1;
    let candidate = `${base} (${n})${ext}`;
    while (used.has(candidate)) { n++; candidate = `${base} (${n})${ext}`; }
    used.add(candidate);
    return candidate;
}

/** Build (but don't serialize) a zip of all succeeded outputs. */
export function buildZip(results: FileStatus[]): JSZip {
    const zip = new JSZip();
    const used = new Set<string>();
    for (const r of results) {
        if (r.status !== "success") continue;
        zip.file(dedupe(r.name, used), r.bytes);
    }
    return zip;
}

/** Serialize the success zip to a Blob for download. */
export async function zipResults(results: FileStatus[]): Promise<Blob> {
    return buildZip(results).generateAsync({ type: "blob" });
}
