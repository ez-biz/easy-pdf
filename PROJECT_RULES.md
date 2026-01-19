# Project Rules & Workflow

## Feature Development
1. **New Feature -> New Branch**: Always create a new feature branch for every new feature or major task.
   - Naming convention: `feature/feature-name` (e.g., `feature/add-images-to-pdf`).
   - Never commit directly to `main` for features.

2. **Completion -> Merge/PR**: When a feature is complete and verified:
   - Ensure all tests/verification steps pass.
   - Create a Pull Request (PR) or merge request.
   - Ask to merge into `main` only after verified.

3. **Verification**: Always verify the build (`npm run build`) and functionality before merging.

4. **Documentation**: Whenever a feature is ready, update the `README.md` document as well.

## Code Quality & Standards
5. **Linting & Formatting**: Run `npm run lint` and `npm run format` before every commit to ensure code consistency.
6. **Commit Messages**: Use conventional commit prefixes (e.g., `feat:`, `fix:`, `docs:`, `refactor:`) to keep history organized.

## Testing
7. **Test Coverage**: Every new feature or bug fix should include corresponding unit tests. Run `npm test` to ensure no regressions.

## Dependencies
8. **Dependency Management**: Only add necessary packages. Always use fixed versions in `package.json` to ensure build reproducibility.
