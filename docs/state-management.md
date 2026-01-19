# State Management

## Overview
We use **Zustand** for global state management. It is lightweight, efficient, and supports local storage persistence out of the box.

## App Store (`useAppStore.ts`)
The store is responsible for tracking:
1.  **User Settings**: Dark mode, default page size/orientation.
2.  **Recent Activity**: List of recently processed files (metadata only).
3.  **Statistics**: Total number of files processed.

### Persistence
The store is wrapped in the `persist` middleware, which saves the state to the browser's `localStorage` under the key `easypdf-storage`.

### Actions
-   `toggleDarkMode()`: Toggles the `dark` class on the `<html>` element and updates state.
-   `addActivity(toolName, fileName)`: Adds a new entry to the history (capped at 10 items).
-   `incrementProcessed()`: Call this whenever a tool successfully completes an operation.

## Usage
```typescript
import { useAppStore } from "@/store/useAppStore";

const MyComponent = () => {
    // Select only what you need to prevents unnecessary re-renders
    const isDarkMode = useAppStore(state => state.settings.isDarkMode);
    const increment = useAppStore(state => state.incrementProcessed);
    
    // ...
};
```
