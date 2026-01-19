# Security & Metadata Tools

## 1. Protect PDF (Encrypt)
Adds password protection to a PDF.
-   **Frontend**: `src/app/(tools)/protect-pdf/`
-   **Logic**: `src/lib/pdf/security.ts`
-   **Implementation**:
    -   Uses `pdf-lib` standard encryption.
    -   Sets `userPassword` (for opening) and `ownerPassword` (for permissions).
    -   Can restrict printing, copying, modifying.

## 2. Unlock PDF
Removes password protection (requires knowing the password).
-   **Frontend**: `src/app/(tools)/unlock-pdf/`
-   **Logic**: `src/lib/pdf/security.ts`
-   **Implementation**:
    -   Loads the document *with* the password.
    -   Saves the document *without* encryption.
    -   *Note: Cannot bruteforce passwords; valid password is required.*

## 3. Edit Metadata
Modifies standard PDF metadata fields.
-   **Frontend**: `src/app/(tools)/edit-metadata/`
-   **Logic**: `src/lib/pdf/metadata.ts`
-   **Fields**:
    -   Title
    -   Author
    -   Subject
    -   Keywords
    -   Creator/Producer
    -   Creation/Modification Date
