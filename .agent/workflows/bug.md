---
description: How to fix a bug following project rules
---

# Bug Fix Workflow

Follow these steps when fixing a bug in the project:

## 1. Create a Bugfix Branch
Create a new branch for your fix:
```bash
git checkout -b fix/<bug-description>
```
- Use the naming convention: `fix/bug-description` (e.g., `fix/rotate-pdf-worker-error`)
- Never commit directly to `main`

## 2. Reproduce the Bug
- Create a reproduction case (test or manual steps)
- Confirm the bug exists before trying to fix it

## 3. Implement the Fix
- Write your code to fix the issue
- Ensure you understand the root cause

## 4. Run Linting & Formatting
// turbo
```bash
npm run lint && npm run format
```
- Ensure code consistency

## 5. Verify the Fix (Tests)
- Update existing tests or add new regression tests
- Ensure all tests pass
// turbo
```bash
npm test
```

## 6. Verify the Build
// turbo
```bash
npm run build
```
- Ensure the project builds successfully with the fix

## 7. Commit Your Changes
```bash
git add .
git commit -m "fix: <description>"
```
- Use the `fix:` prefix
- Example: `fix: resolve pdf worker 404 error`

## 8. Create Pull Request & Merge
- Push your branch and create a Pull Request
- After review and verification, merge into `main`
```bash
git push origin fix/<bug-description>
```
