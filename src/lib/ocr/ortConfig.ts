// Points onnxruntime-web at the self-hosted wasm copied into /public/ort/ by
// the `copy-ort` build step. Without this, ort tries to fetch its wasm from a
// CDN. Idempotent — safe to call before every engine init.
let configured = false;

export async function configureOrt(): Promise<void> {
    if (configured) return;
    const ort = await import("onnxruntime-web");
    ort.env.wasm.wasmPaths = "/ort/";
    configured = true;
}
