import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppSettings {
    isDarkMode: boolean;
    defaultPageSize: 'a4' | 'letter';
    defaultOrientation: 'portrait' | 'landscape';
    compressionLevel: 'extreme' | 'recommended' | 'less';
}

interface RecentActivity {
    id: string;
    toolName: string;
    fileName: string;
    timestamp: number;
}

interface AppState {
    // Settings
    settings: AppSettings;
    updateSettings: (settings: Partial<AppSettings>) => void;
    toggleDarkMode: () => void;

    // Recent Activity
    recentActivity: RecentActivity[];
    addActivity: (activity: Omit<RecentActivity, 'id' | 'timestamp'>) => void;
    removeActivity: (id: string) => void;
    clearActivity: () => void;

    // Stats
    totalProcessed: number;
    incrementProcessed: () => void;
}

const defaultSettings: AppSettings = {
    isDarkMode: false,
    defaultPageSize: 'a4',
    defaultOrientation: 'portrait',
    compressionLevel: 'recommended',
};

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            // Initial state
            settings: defaultSettings,
            recentActivity: [],
            totalProcessed: 0,

            // Settings actions
            updateSettings: (newSettings) =>
                set((state) => ({
                    settings: { ...state.settings, ...newSettings },
                })),

            toggleDarkMode: () =>
                set((state) => {
                    const isDarkMode = !state.settings.isDarkMode;
                    // Update document class for dark mode
                    if (typeof document !== 'undefined') {
                        document.documentElement.classList.toggle('dark', isDarkMode);
                    }
                    return {
                        settings: { ...state.settings, isDarkMode },
                    };
                }),

            // Activity actions
            addActivity: (activity) =>
                set((state) => ({
                    recentActivity: [
                        {
                            ...activity,
                            id: Math.random().toString(36).substring(2, 9),
                            timestamp: Date.now(),
                        },
                        ...state.recentActivity.slice(0, 9), // Keep last 10
                    ],
                })),

            removeActivity: (id) =>
                set((state) => ({
                    recentActivity: state.recentActivity.filter(item => item.id !== id),
                })),

            clearActivity: () => set({ recentActivity: [] }),

            // Stats actions
            incrementProcessed: () =>
                set((state) => ({
                    totalProcessed: state.totalProcessed + 1,
                })),
        }),
        {
            name: 'easypdf-storage', // localStorage key
            partialize: (state) => ({
                settings: state.settings,
                recentActivity: state.recentActivity,
                totalProcessed: state.totalProcessed,
            }),
        }
    )
);
