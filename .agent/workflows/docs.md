---
description: How to update documentation
---

# Documentation Workflow

Follow these steps when updating documentation:

## 1. Create a Docs Branch
```bash
git checkout -b docs/<description>
```

## 2. Update Documentation
- Edit `README.md`, docs pages, or code comments
- Ensure clarity and accuracy

## 3. Preview Changes
- If updating the site, run locally to check rendering:
```bash
npm run dev
```

## 4. Format
// turbo
```bash
npm run format
```

## 5. Commit
```bash
git add .
git commit -m "docs: <description>"
```
- Use the `docs:` prefix

## 6. Merge
- Create PR and merge
