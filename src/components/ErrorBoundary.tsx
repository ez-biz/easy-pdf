"use client";

import { Component, type ReactNode } from "react";
import { Sentry } from "@/lib/sentry";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        Sentry.captureException(error, {
            extra: { componentStack: errorInfo.componentStack },
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900">
                    <div className="text-center max-w-md mx-auto px-4">
                        <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">
                            Something went wrong
                        </h1>
                        <p className="text-surface-600 dark:text-surface-400 mb-6">
                            An unexpected error occurred. Please try refreshing the page.
                        </p>
                        <button
                            onClick={() => {
                                this.setState({ hasError: false });
                                window.location.reload();
                            }}
                            className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
