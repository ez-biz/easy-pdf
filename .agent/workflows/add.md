---
description: How to add a new feature following project rules
---

# Add New Feature Workflow

Follow these steps when adding a new feature to the project:

## 1. Create a Feature Branch
Create a new branch for your feature:
```bash
git checkout -b feature/<feature-name>
```
- Use the naming convention: `feature/feature-name` (e.g., `feature/add-images-to-pdf`)
- Never commit directly to `main` for features

## 2. Implement the Feature
- Write your code for the new feature
- Follow the project's code standards

## 3. Run Linting & Formatting
// turbo
```bash
npm run lint && npm run format
```
- Ensure code consistency before committing

## 4. Write Tests
- Add unit tests for the new feature
// turbo
```bash
npm test
```
- Ensure no regressions are introduced

## 5. Verify the Build
// turbo
```bash
npm run build
```
- Ensure the project builds successfully

## 6. Commit Your Changes
```bash
git add .
git commit -m "<type>: <description>"
```
- Use conventional commit prefixes: `feat:`, `fix:`, `docs:`, `refactor:`
- Example: `feat: add image support to PDF converter`

## 7. Update Documentation
- Update `README.md` if the feature adds new functionality
- Document any new APIs or usage patterns

## 8. Create Pull Request & Merge
- Push your branch and create a Pull Request
- After review and verification, merge into `main`
```bash
git push origin feature/<feature-name>
```

## Notes
- **Dependency Management**: Only add necessary packages with fixed versions
- **Test Coverage**: Every feature should include corresponding tests
- **Verification**: Always verify build and functionality before merging
