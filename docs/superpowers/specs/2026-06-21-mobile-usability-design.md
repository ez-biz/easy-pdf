# Mobile Usability — Shared Upload→Action Flow — Design

> **Date:** 2026-06-21
> **Status:** Approved design, pre-implementation
> **Owner:** Anchit Gupta
> **Roadmap driver:** 45% of traffic is mobile; improve ease-of-use of the flow every tool shares.

## Summary

Improve the mobile experience of the flow **every** EasyPDF tool shares — uploading
files and triggering the primary action — by changing shared components so all
25 tools benefit. Three pieces:

1. **Mobile-aware uploader** — touch-first copy and a "Take photo" capture option
   on image-input tools.
2. **Sticky mobile action bar** — the current-phase primary action pinned within
   thumb reach at the bottom of the screen on mobile.
3. **Touch targets** — bring sub-44px shared controls up to the 44px minimum.

Scope is the desktop breakpoint `md` (Tailwind ≥768px) for "desktop" and below
for "mobile". No new dependencies. Everything is client-side, consistent with the
product's privacy model.

## Goals

- Make uploading + acting feel native on a phone without scrolling to find the CTA.
- Centralize the change in shared components so all tools benefit with minimal
  per-tool churn.
- Degrade gracefully: any tool not yet migrated keeps working exactly as today.

## Non-goals

- Per-tool editor redesigns (redact/sign/organize canvas ergonomics) — separate effort.
- Accessibility/WCAG compliance pass — related but separate.
- Desktop layout changes — desktop behavior is unchanged throughout.
- A general design-system refactor.

## Decisions (from brainstorming)

- **Sticky bar = always pinned on mobile, with a short context line** (e.g. "2 files
  ready"); the inline button is hidden on mobile so there is no duplicate. (Option A.)
- **Camera = two explicit buttons** ("Choose files" + "📷 Take photo") on image-input
  tools, on mobile only. (Option A.)
- **Rollout = all 25 tools**, batched high-traffic first; partial rollout is safe.

## Architecture

Three units; no new dependencies. "Mobile" = below Tailwind `md`.

### (a) `FileUploader` enhancements

File: `src/components/tools/FileUploader.tsx` (shared by all tools).

- **Copy swap (CSS only, no JS):** render the touch copy ("Tap to add files") in a
  `md:hidden` span and the existing desktop copy ("Drag & drop or click to browse")
  in a `hidden md:block` span. `label`/`description` props keep working as the
  desktop text; a new optional `mobileLabel` defaults to `"Tap to add files"`.
- **Camera capture:** new optional prop `allowCamera?: boolean`. When true, on mobile
  (`md:hidden`) render two buttons — "Choose files" (opens the normal picker) and
  "📷 Take photo" (a hidden `<input type="file" accept="image/*" capture="environment">`
  whose selection feeds the same `onFilesChange` path). Desktop dropzone unchanged.
  Image-input tools (image-to-pdf, photo-to-pdf, ocr-pdf) pass `allowCamera`.
- The existing dropzone, file-list chips, size/type validation, and `onFilesChange`
  contract are unchanged.

### (b) Sticky mobile action bar

Two new pieces plus a `ToolLayout` change.

- **`MobileActionProvider` + context** (`src/components/layout/MobileActionContext.tsx`):
  holds the currently-registered action `{ label, onClick, disabled?, loading?, context? } | null`
  and exposes `register(action)` / `clear()`. Last registration wins. Pure reducer,
  unit-testable.
- **`MobileActionBar`** (`src/components/layout/MobileActionBar.tsx`): reads the
  registered action from context; renders `fixed bottom-0 inset-x-0 z-40 md:hidden`
  with `pb-[env(safe-area-inset-bottom)]` safe-area padding, an optional context line,
  and a full-width primary button (≥44px). Renders nothing when no action is registered.
- **`PrimaryAction`** (`src/components/tools/PrimaryAction.tsx`): the single
  abstraction tools adopt. Props mirror the primary button: `onClick`, `disabled?`,
  `loading?`, `context?`, and `children` which MUST be the plain text label string
  (e.g. `"Compress 2 PDFs"`) — used verbatim both for the desktop inline button and
  the mobile bar. (An optional leading `icon?` prop covers tools that want an icon on
  the desktop button without putting JSX in the bar label.) It:
  - renders the existing desktop inline button styled as today but `max-md:hidden`, and
  - registers `{ label: children, onClick, disabled, loading, context }` to the
    provider on mount and whenever those change; unregisters on unmount.
  So as a tool's phase changes (the mounted `PrimaryAction` changes), the bar updates
  automatically, with no duplicate button on mobile.
- **`ToolLayout`** wraps its children in `MobileActionProvider`, renders
  `<MobileActionBar/>`, and adds bottom padding on mobile (`pb-24 md:pb-0` or similar)
  so content is never hidden behind the bar.

### (c) Touch-target fixes

File: `src/components/layout/Header.tsx` (and any other shared chrome with sub-44px
hit areas). Add `min-h-[44px] min-w-[44px]` (or equivalent padding) to the dark-mode
toggle (currently 36px) and the mobile menu toggle (currently 40px), keeping the
visual icon size the same (expand the hit area, not the glyph).

## Per-tool change (rollout)

For each tool client, replace its primary `<Button>` CTA(s) — one per phase (e.g.
compress's "Compress" while configuring, "Download" after) — with `<PrimaryAction>`.
This is a mechanical ~1-line change per action site. Tools pass an optional `context`
(e.g. "2 files ready", "Done — 2 files") for the bar's status line.

**Graceful & incremental:** a tool that still uses a plain `<Button>` simply shows no
mobile bar (its inline button remains usable on mobile). So rollout can land
high-traffic tools first (merge, split, compress, the conversions, image-to-pdf,
batch) and the remainder in follow-up batches with zero regression risk.

## Data flow

```
Tool client (per phase) renders <PrimaryAction onClick disabled context>Label</PrimaryAction>
   ├─ desktop: inline button (max-md:hidden) — unchanged UX
   └─ registers action → MobileActionProvider (in ToolLayout)
                              └─ MobileActionBar (fixed, md:hidden) renders Label + context → onClick
```

## Error handling / edge cases

- No action registered → bar renders nothing (tools mid-transition, or unmigrated).
- Multiple `PrimaryAction` mounted simultaneously → last registered wins (document the
  convention: one primary per phase).
- `disabled`/`loading` propagate to the bar button so it matches the inline state.
- Safe-area insets handled so the bar clears the iOS home indicator.

## Testing

- **Provider reducer** (vitest, pure): register sets action; second register replaces;
  unregister/clear resets to null.
- **`FileUploader`**: a focused test that `allowCamera` causes a camera `<input>` with
  `capture` to be present and that its selection flows through `onFilesChange`.
- **Browser-driven verification** (preview tools at mobile viewport): uploader copy +
  camera button on an image tool; sticky bar visible on mobile and hidden on desktop;
  bar label updates across a tool's phases; 44px touch targets. (The project has no
  component-render harness today, so responsive/visual behavior is verified in-browser.)

## What ships

- Shared components: enhanced `FileUploader`, new `MobileActionContext` /
  `MobileActionBar` / `PrimaryAction`, updated `ToolLayout` and `Header`.
- `PrimaryAction` adopted across tools (all 25 in the plan, batched; partial rollout safe).
- No new dependencies; desktop unchanged.

## Future (out of scope)

- Editor-tool mobile ergonomics (canvas/drag tools).
- Accessibility/WCAG pass.
- Mobile-specific result/share affordances (e.g. Web Share API for downloads).
