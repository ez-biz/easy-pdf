# Mobile Usability (Upload→Action Flow) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the shared upload→action flow feel native on mobile across all 25 tools — touch-aware uploader with camera capture, a thumb-reachable sticky primary-action bar, and 44px touch targets — with no desktop changes and no new dependencies.

**Architecture:** A `MobileActionProvider` (mounted in `ToolLayout`) holds the current primary action; a `<PrimaryAction>` wrapper that each tool adopts renders the desktop inline button AND registers its action to the provider while mounted; a `<MobileActionBar>` (fixed bottom, `md:hidden`) renders the registered action. `FileUploader` gets touch-aware copy + an optional camera input. Rollout is graceful — unmigrated tools simply show no bar.

**Tech Stack:** Next.js 15 (App Router), React, TypeScript, Tailwind, lucide-react, **vitest**. No new deps.

**Spec:** `docs/superpowers/specs/2026-06-22-mobile-usability-design.md`

---

## File Structure

**Create:**
- `src/components/layout/mobileAction.ts` — pure types + register/unregister helpers (unit-tested).
- `src/components/layout/MobileActionContext.tsx` — provider + hooks (`useMobileActionBar`, `useRegisterMobileAction`).
- `src/components/layout/MobileActionBar.tsx` — the fixed bottom bar (mobile only).
- `src/components/tools/PrimaryAction.tsx` — the wrapper tools adopt.
- `src/components/layout/__tests__/mobileAction.test.ts` — reducer tests.

**Modify:**
- `src/components/layout/ToolLayout.tsx` — wrap in provider, render bar, add mobile bottom padding.
- `src/components/tools/FileUploader.tsx` — touch copy + `allowCamera`.
- `src/components/layout/Header.tsx` — 44px touch targets on the two toggles.
- Tool clients (`src/app/(tools)/**/*Client.tsx`) — swap primary `<Button>` for `<PrimaryAction>` (batched).

---

## Task 1: Mobile action helpers (pure, TDD)

**Files:**
- Create: `src/components/layout/mobileAction.ts`
- Test: `src/components/layout/__tests__/mobileAction.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { applyRegister, applyUnregister, type RegisteredAction } from "../mobileAction";

const a = (id: number, label: string): RegisteredAction => ({ id, label, onClick: () => {} });

describe("mobileAction helpers", () => {
    it("register replaces the current action (last wins)", () => {
        expect(applyRegister(null, a(1, "A"))).toEqual(a(1, "A"));
        expect(applyRegister(a(1, "A"), a(2, "B")).label).toBe("B");
    });

    it("unregister clears only when the id matches the current action", () => {
        expect(applyUnregister(a(1, "A"), 1)).toBeNull();
    });

    it("unregister of a stale id leaves a newer action intact", () => {
        // old (id 1) unmounts after new (id 2) registered → must NOT clear id 2
        expect(applyUnregister(a(2, "B"), 1)).toEqual(a(2, "B"));
    });

    it("unregister on empty state is a no-op", () => {
        expect(applyUnregister(null, 1)).toBeNull();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/layout/__tests__/mobileAction.test.ts`
Expected: FAIL — `../mobileAction` not found.

- [ ] **Step 3: Implement**

```ts
export interface MobileAction {
    /** Plain text label, shown verbatim on the desktop button and the mobile bar. */
    label: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    /** Optional short status line above the bar button, e.g. "2 files ready". */
    context?: string;
}

export interface RegisteredAction extends MobileAction {
    id: number;
}

/** Register replaces whatever was current (last registration wins). */
export function applyRegister(
    _current: RegisteredAction | null,
    next: RegisteredAction,
): RegisteredAction {
    return next;
}

/**
 * Unregister clears the current action only if it is the one being removed.
 * This prevents an old component unmounting *after* a newer one mounted from
 * wiping the newer action.
 */
export function applyUnregister(
    current: RegisteredAction | null,
    id: number,
): RegisteredAction | null {
    return current && current.id === id ? null : current;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/layout/__tests__/mobileAction.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/mobileAction.ts src/components/layout/__tests__/mobileAction.test.ts
git commit -m "feat(mobile): add mobile-action register/unregister helpers"
```

---

## Task 2: MobileActionContext (provider + hooks)

**Files:**
- Create: `src/components/layout/MobileActionContext.tsx`

- [ ] **Step 1: Write the provider and hooks**

```tsx
"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { applyRegister, applyUnregister, type MobileAction, type RegisteredAction } from "./mobileAction";

interface MobileActionContextValue {
    current: RegisteredAction | null;
    register: (action: MobileAction) => number;
    update: (id: number, action: MobileAction) => void;
    unregister: (id: number) => void;
}

const MobileActionCtx = createContext<MobileActionContextValue | null>(null);

export function MobileActionProvider({ children }: { children: ReactNode }) {
    const [current, setCurrent] = useState<RegisteredAction | null>(null);
    const nextId = useRef(0);

    const register = useCallback((action: MobileAction) => {
        const id = ++nextId.current;
        setCurrent((c) => applyRegister(c, { id, ...action }));
        return id;
    }, []);

    const update = useCallback((id: number, action: MobileAction) => {
        setCurrent((c) => (c && c.id === id ? { id, ...action } : c));
    }, []);

    const unregister = useCallback((id: number) => {
        setCurrent((c) => applyUnregister(c, id));
    }, []);

    return (
        <MobileActionCtx.Provider value={{ current, register, update, unregister }}>
            {children}
        </MobileActionCtx.Provider>
    );
}

/** Read the currently registered action (used by the bar). */
export function useMobileActionBar(): RegisteredAction | null {
    return useContext(MobileActionCtx)?.current ?? null;
}

/**
 * Register `action` with the provider while the calling component is mounted.
 * onClick is wrapped in a stable function that always calls the latest handler,
 * so the bar never invokes a stale closure. Pass null to register nothing.
 */
export function useRegisterMobileAction(action: MobileAction | null) {
    const ctx = useContext(MobileActionCtx);
    const actionRef = useRef(action);
    actionRef.current = action;
    const idRef = useRef<number | null>(null);

    const stableClick = useCallback(() => {
        actionRef.current?.onClick();
    }, []);

    const active = !!action;
    const label = action?.label;
    const disabled = action?.disabled;
    const loading = action?.loading;
    const context = action?.context;

    // Register once on mount (and when toggling active); unregister on unmount.
    useEffect(() => {
        if (!ctx || !active || label == null) return;
        const id = ctx.register({ label, onClick: stableClick, disabled, loading, context });
        idRef.current = id;
        return () => {
            if (idRef.current != null) {
                ctx.unregister(idRef.current);
                idRef.current = null;
            }
        };
        // Intentionally mount/active-only; field changes are synced by the effect below.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ctx, active]);

    // Keep the registered action's fields in sync as they change.
    useEffect(() => {
        if (ctx && active && label != null && idRef.current != null) {
            ctx.update(idRef.current, { label, onClick: stableClick, disabled, loading, context });
        }
    }, [ctx, active, label, disabled, loading, context, stableClick]);
}
```

- [ ] **Step 2: Verify type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean (no errors in the new file).

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/MobileActionContext.tsx
git commit -m "feat(mobile): add MobileActionProvider + register/read hooks"
```

---

## Task 3: MobileActionBar

**Files:**
- Create: `src/components/layout/MobileActionBar.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";

import { Loader2 } from "lucide-react";
import { useMobileActionBar } from "./MobileActionContext";

/** Fixed bottom action bar, mobile only. Renders nothing when no action is registered. */
export function MobileActionBar() {
    const action = useMobileActionBar();
    if (!action) return null;

    const { label, onClick, disabled, loading, context } = action;

    return (
        <div
            className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-surface-200 dark:border-surface-700 bg-white/95 dark:bg-surface-800/95 backdrop-blur px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] shadow-[0_-6px_18px_rgba(0,0,0,0.08)]"
        >
            {context && (
                <p className="text-center text-xs text-surface-500 dark:text-surface-400 mb-2">
                    {context}
                </p>
            )}
            <button
                type="button"
                onClick={onClick}
                disabled={disabled || loading}
                className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold text-base shadow-lg shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />}
                {label}
            </button>
        </div>
    );
}
```

- [ ] **Step 2: Verify type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/MobileActionBar.tsx
git commit -m "feat(mobile): add fixed bottom MobileActionBar (mobile only)"
```

---

## Task 4: PrimaryAction wrapper

**Files:**
- Create: `src/components/tools/PrimaryAction.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";

import { type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { useRegisterMobileAction } from "@/components/layout/MobileActionContext";

interface PrimaryActionProps {
    /** Plain text label — used on the desktop button and the mobile bar. */
    children: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    /** Optional status line shown above the mobile bar button. */
    context?: string;
    /** Optional icon for the desktop button only (not shown in the bar). */
    icon?: ReactNode;
    className?: string;
}

/**
 * Renders the primary action as an inline Button on desktop (hidden on mobile),
 * and registers it with the MobileActionBar so it appears pinned on mobile.
 */
export function PrimaryAction({
    children, onClick, disabled, loading, context, icon, className,
}: PrimaryActionProps) {
    useRegisterMobileAction({ label: children, onClick, disabled, loading, context });

    return (
        <Button
            onClick={onClick}
            disabled={disabled}
            isLoading={loading}
            leftIcon={icon}
            size="lg"
            className={`max-md:hidden ${className ?? ""}`}
        >
            {children}
        </Button>
    );
}
```

- [ ] **Step 2: Verify type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/tools/PrimaryAction.tsx
git commit -m "feat(mobile): add PrimaryAction (desktop button + mobile bar registration)"
```

---

## Task 5: Wire provider + bar into ToolLayout

**Files:**
- Modify: `src/components/layout/ToolLayout.tsx`

- [ ] **Step 1: Add imports**

At the top of `ToolLayout.tsx`, add:

```tsx
import { MobileActionProvider } from "./MobileActionContext";
import { MobileActionBar } from "./MobileActionBar";
```

- [ ] **Step 2: Wrap the layout in the provider, render the bar, add mobile bottom padding**

Replace the outer return JSX so the whole layout is wrapped:

- Wrap the existing root `<div className="min-h-[calc(100vh-64px)] ...">` in `<MobileActionProvider> ... </MobileActionProvider>`.
- Add `<MobileActionBar />` as the last child inside the provider (after the root div).
- On the "Tool Content" container (`<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">` at line 67), add bottom padding so content clears the bar on mobile: change its className to `max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-8`.

Resulting structure:

```tsx
    return (
        <MobileActionProvider>
            <div className="min-h-[calc(100vh-64px)] bg-surface-50 dark:bg-surface-900/50">
                {/* ...existing Tool Header div unchanged... */}

                {/* Tool Content */}
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        {children}
                    </motion.div>
                </div>
            </div>
            <MobileActionBar />
        </MobileActionProvider>
    );
```

- [ ] **Step 3: Verify type-check + tests**

Run: `npx tsc --noEmit -p tsconfig.json && npx vitest run`
Expected: clean; all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/ToolLayout.tsx
git commit -m "feat(mobile): mount MobileActionProvider + bar in ToolLayout"
```

---

## Task 6: FileUploader — touch copy + camera capture

**Files:**
- Modify: `src/components/tools/FileUploader.tsx`

- [ ] **Step 1: Add props and refactor file-adding into a reusable function**

In `FileUploaderProps` add:

```tsx
    mobileLabel?: string;
    allowCamera?: boolean;
```

In the component signature add `mobileLabel = "Tap to add files", allowCamera = false,` to the destructured props.

Extract the accepted-file handling so the camera input can reuse it. Add this inside the component (above `onDrop`):

```tsx
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
```

Then change the body of `onDrop` so that, after its rejection handling, it calls `addAcceptedFiles(acceptedFiles)` instead of duplicating the mapping. (Keep the existing `rejectedFiles` handling block; replace the `if (files.length + ...)` block and the `newFiles`/`onFilesChange` lines at the end with a single `addAcceptedFiles(acceptedFiles);`.)

- [ ] **Step 2: Add a camera ref + handler**

Add near the other hooks:

```tsx
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const onCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const list = e.target.files ? Array.from(e.target.files) : [];
        if (list.length) addAcceptedFiles(list);
        e.target.value = ""; // allow re-capturing the same file
    };
```

Add `useRef` to the existing react import: `import { useCallback, useRef, useState } from "react";`

- [ ] **Step 3: Make the dropzone copy touch-aware**

Replace the label paragraph (currently `{isDragActive ? "Drop files here" : label}`) with responsive copy:

```tsx
                        <p className="text-lg font-semibold text-surface-900 dark:text-white mb-1">
                            <span className="md:hidden">{mobileLabel}</span>
                            <span className="hidden md:inline">{isDragActive ? "Drop files here" : label}</span>
                        </p>
                        <p className="text-sm text-surface-500 dark:text-surface-400 hidden md:block">
                            {description}
                        </p>
```

(The `description` line — "or click to browse" — is hidden on mobile since "Tap to add files" already conveys it.)

- [ ] **Step 4: Add the camera button (image tools, mobile only)**

Immediately AFTER the closing `</div>` of the drop-zone root (i.e. right after the dropzone block, before the Error Message `<AnimatePresence>`), add:

```tsx
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
```

Add `Camera` to the lucide import: `import { Upload, FileText, Image as ImageIcon, X, AlertCircle, Camera } from "lucide-react";`

- [ ] **Step 5: Verify type-check + tests**

Run: `npx tsc --noEmit -p tsconfig.json && npx vitest run`
Expected: clean; all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/tools/FileUploader.tsx
git commit -m "feat(mobile): touch-aware uploader copy + camera capture option"
```

---

## Task 7: Header touch targets

**Files:**
- Modify: `src/components/layout/Header.tsx`

- [ ] **Step 1: Bump both toggle buttons to a 44px hit area**

Find the dark-mode toggle button (`aria-label="Toggle dark mode"`) and change its className from:

```tsx
className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
```

to:

```tsx
className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
```

Find the mobile menu toggle button (`aria-label="Toggle menu"`) and change its className from:

```tsx
className="lg:hidden p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
```

to:

```tsx
className="lg:hidden min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
```

- [ ] **Step 2: Verify type-check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Header.tsx
git commit -m "fix(mobile): 44px hit areas on header toggles"
```

---

## Task 8: Migrate Compress (reference tool) + browser-verify on mobile

This task migrates ONE tool to establish the exact pattern, then verifies the whole mechanism in a real mobile viewport.

**Files:**
- Modify: `src/app/(tools)/compress-pdf/CompressClient.tsx`

- [ ] **Step 1: Import PrimaryAction**

Add: `import { PrimaryAction } from "@/components/tools/PrimaryAction";`

- [ ] **Step 2: Replace the configure-phase primary button**

The "Compress" CTA is currently:

```tsx
<Button onClick={handleCompress} size="lg">
    {/* ...label/content... */}
</Button>
```

Replace it with (keep its surrounding container; use the tool's existing handler and disabled logic — if the existing button had `isLoading`/`disabled`, pass them through):

```tsx
<PrimaryAction
    onClick={handleCompress}
    loading={isCompressing}
    context={`${files.length} file${files.length === 1 ? "" : "s"} ready`}
>
    Compress {files.length} PDF{files.length === 1 ? "" : "s"}
</PrimaryAction>
```

(If the local state variable for the in-progress flag is not named `isCompressing`, use the actual one in the file; if there is none, omit `loading`.)

- [ ] **Step 3: Replace the result-phase download button**

The download CTA (`<Button onClick={handleDownload} ...>`) becomes:

```tsx
<PrimaryAction onClick={handleDownload} context="Done — ready to download">
    Download
</PrimaryAction>
```

Leave the secondary buttons (Reset/Adjust) as plain `<Button variant="secondary">` — only the single primary per phase becomes `PrimaryAction`.

- [ ] **Step 4: Verify type-check + build**

Run: `npx tsc --noEmit -p tsconfig.json && npm run build`
Expected: clean; build succeeds.

- [ ] **Step 5: Browser-verify on a mobile viewport**

Using the preview tools (start `easy-pdf-dev`, `preview_resize` preset `mobile`), open `/compress-pdf` and confirm:
- The inline "Compress" button is hidden on mobile; a pinned bottom bar shows "Compress 0 PDFs" with the context line.
- After adding a file, the bar updates ("Compress 1 PDF", "1 file ready").
- On `desktop` preset the bar is gone and the inline button is visible.
- No console errors.

Capture a screenshot for the record.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(tools)/compress-pdf/CompressClient.tsx"
git commit -m "feat(mobile): adopt PrimaryAction in Compress (reference migration)"
```

---

## Task 9: Roll out PrimaryAction to the remaining tools

Apply the **exact same recipe** from Task 8 to each tool below. The recipe per tool:
1. `import { PrimaryAction } from "@/components/tools/PrimaryAction";`
2. Replace the single **primary** `<Button>` of each phase (the main forward action / the download action) with `<PrimaryAction onClick={<existing handler>} loading={<existing in-progress flag, if any>} context={<short status>}>Label</PrimaryAction>`.
3. Leave secondary buttons (reset, cancel, adjust, "add more") as plain `<Button>`.
4. Use a plain-text label (PrimaryAction children must be a string).

Do them in two commits (high-traffic first, then the rest) so review stays manageable.

**Batch A — high-traffic (commit together):**
- `merge-pdf/MergeClient.tsx`
- `split-pdf/SplitClient.tsx`
- `pdf-to-image/PdfToImageClient.tsx`
- `image-to-pdf/ImageToPdfClient.tsx`
- `pdf-to-word/PdfToWordClient.tsx`
- `word-to-pdf/WordToPdfClient.tsx`
- `app/(tools)/batch/BatchClient.tsx` (its "Run on N files" button → PrimaryAction; the results-phase has its own download UI, leave as-is)

**Batch B — remaining (commit together):**
- `compress` is done (Task 8). Migrate: `rotate-pdf`, `organize-pdf`, `remove-pages`, `extract-pages`, `add-watermark`, `add-page-numbers`, `add-text`, `add-image`, `edit-metadata`, `protect-pdf`, `unlock-pdf`, `redact-pdf`, `sign-pdf`, `excel-to-pdf`, `pdf-to-excel`, `pdf-to-pptx`, `photo-to-pdf`, `ocr-pdf`.

- [ ] **Step 1: Migrate Batch A tools** (apply the recipe to each file above)

For each, read the file, locate the primary CTA(s), and apply the recipe. Example shapes you will encounter:
- A single forward action (e.g. merge's "Merge PDFs") → `<PrimaryAction onClick={handleMerge} loading={isProcessing} context={\`${files.length} files\`}>Merge PDFs</PrimaryAction>`.
- A download/result action → `<PrimaryAction onClick={handleDownload} context="Ready to download">Download</PrimaryAction>`.

- [ ] **Step 2: Verify Batch A**

Run: `npx tsc --noEmit -p tsconfig.json && npm run build`
Expected: clean; build succeeds.

- [ ] **Step 3: Commit Batch A**

```bash
git add "src/app/(tools)"
git commit -m "feat(mobile): adopt PrimaryAction across high-traffic tools"
```

- [ ] **Step 4: Migrate Batch B tools** (same recipe)

- [ ] **Step 5: Verify Batch B**

Run: `npx tsc --noEmit -p tsconfig.json && npm run build`
Expected: clean; build succeeds.

- [ ] **Step 6: Commit Batch B**

```bash
git add "src/app/(tools)"
git commit -m "feat(mobile): adopt PrimaryAction across remaining tools"
```

---

## Task 10: Enable camera on image tools + final verification

**Files:**
- Modify: `image-to-pdf/ImageToPdfClient.tsx`, `photo-to-pdf/PhotoToPdfClient.tsx`, `ocr-pdf/OcrClient.tsx`

- [ ] **Step 1: Pass `allowCamera` to the FileUploader in each image-input tool**

In each of the three files, find the `<FileUploader ... />` usage and add the `allowCamera` prop:

```tsx
<FileUploader
    /* ...existing props... */
    allowCamera
/>
```

(Only these three accept image input where a phone camera makes sense. Do NOT add it to PDF-only tools.)

- [ ] **Step 2: Verify type-check + full build + lint + tests**

Run: `npx tsc --noEmit -p tsconfig.json && npm run build && npm run lint && npx vitest run`
Expected: build succeeds; lint clean (no new warnings); all tests pass.

- [ ] **Step 3: Browser-verify the full flow on mobile**

Using the preview tools at `mobile` preset:
- `/image-to-pdf`: uploader shows "Tap to add files", a "Choose files" path, and a "📷 Take photo" button.
- A PDF-only tool (e.g. `/merge-pdf`): no camera button; sticky bar present.
- Header dark-mode and menu toggles are ≥44px (inspect/measure).
- `desktop` preset: no bars, no camera buttons, copy reverts to "Drag & drop…".
Capture screenshots of `/image-to-pdf` (mobile) and a PDF tool (mobile) for the record.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(tools)"
git commit -m "feat(mobile): enable camera capture on image-input tools"
```

---

## Self-Review Notes (for the planner)

- **Spec coverage:** uploader copy + camera (Task 6, 10), sticky bar (Tasks 2–5), PrimaryAction abstraction (Task 4), touch targets (Task 7), rollout to all 25 tools (Tasks 8–9), graceful partial rollout (recipe is per-tool, build stays green between batches). Provider reducer test (Task 1).
- **Testing reality:** the project has no component-render harness (only vitest + pure logic). So only the `mobileAction` reducer is unit-tested (Task 1); the components/hooks and responsive behavior are verified via `tsc`, `npm run build`, and browser checks at mobile/desktop viewports (Tasks 8, 10). This matches the spec's "browser-driven verification" note — do NOT add a testing-library dependency (out of scope).
- **Stale-closure safety:** `useRegisterMobileAction` wraps onClick in a stable function reading a ref, and syncs primitive fields via a separate effect — so the bar always calls the latest handler without re-registering every render.
- **No duplicate button:** PrimaryAction's desktop button is `max-md:hidden`; the bar is `md:hidden` — exactly one is visible per breakpoint.
