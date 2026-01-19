# Project Rules & Workflow

## Feature Development
1. **New Feature -> New Branch**: Always create a new feature branch for every new feature or major task.
   - Naming convention: `feature/feature-name` (e.g., `feature/add-images-to-pdf`).
   - Never commit directly to `main` for features.

2. **Completion -> Merge/PR**: When a feature is complete and verified:
   - Ensure all tests/verification steps pass.
   - Create a Pull Request (PR) or merge request.
   - Merge into `main` only after verified.

3. **Verification**: Always verify the build (`npm run build`) and functionality before merging.

4. **Documentation**: Whenever a feature is ready, update the `README.md` document as well.
