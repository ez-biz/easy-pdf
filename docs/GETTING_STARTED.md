# Getting Started with Easy PDF

## Prerequisites
-   Node.js 18+
-   npm or yarn

## Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/ez-biz/easy-pdf.git
    cd easy-pdf
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run the Development Server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Project Scripts
-   `npm run dev`: Start development server (Hot Reloading).
-   `npm run build`: Build for production.
-   `npm run start`: Run production build.
-   `npm run lint`: Run ESLint.

## Adding a New Tool
1.  **Plan**: Define the tool's purpose (e.g., "Rotate PDF").
2.  **Config**: Add the tool definition to `src/lib/constants.ts`.
3.  **Route**: Create a new folder `src/app/(tools)/rotate-pdf/page.tsx`.
4.  **Logic**: Implement the PDF processing logic in `src/lib/pdf/`.
5.  **UI**: Build the interface using `ToolLayout` and standard components.

## Contribution Guidelines
-   Create a feature branch: `git checkout -b feature/cool-new-tool`.
-   Commit changes with clear messages.
-   Push and open a Pull Request.
