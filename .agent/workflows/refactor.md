---
description: How to refactor code following project rules
---

# Refactor Workflow

Follow these steps when refactoring code/structure:

## 1. Create a Refactor Branch
```bash
git checkout -b refactor/<description>
```
- Use the naming convention: `refactor/description`

## 2. Plan the Refactor
- clearly define *what* is being refactored and *why*
- Ensure no functional changes are mixed with refactoring if possible

## 3. Make Changes
- Update the code structure/logic
- Keep changes focused

## 4. Run Linting & Formatting
// turbo
```bash
npm run lint && npm run format
```

## 5. Verify No Regressions
- Run all tests to ensure the refactor didn't break anything
// turbo
```bash
npm test
```

## 6. Verify Build
// turbo
```bash
npm run build
```

## 7. Commit
```bash
git add .
git commit -m "refactor: <description>"
```
- Use the `refactor:` prefix

## 8. Merge
- Create PR and merge
