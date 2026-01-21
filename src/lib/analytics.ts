// Declare gtag as a global function
declare global {
    interface Window {
        gtag: (
            command: "event",
            action: string,
            params: {
                event_category?: string;
                event_label?: string;
                value?: number;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                [key: string]: any;
            }
        ) => void;
    }
}

/**
 * Tracks a custom event in Google Analytics
 * @param eventName - The name of the event (e.g., 'tool_used', 'file_upload')
 * @param params - Additional parameters for the event
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const trackEvent = (eventName: string, params: Record<string, any> = {}) => {
    if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", eventName, params);
    }
};

/**
 * Convenience function to track tool usage
 * @param toolName - The slug of the tool (e.g., 'merge-pdf')
 * @param action - The action performed (e.g., 'download', 'process')
 */
export const trackToolUsage = (toolName: string, action: string = "download") => {
    trackEvent("tool_used", {
        tool_name: toolName,
        action: action,
    });
};
