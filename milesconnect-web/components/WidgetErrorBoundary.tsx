"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';


interface Props {
    children?: ReactNode;
    title?: string;
    errorMessage?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class WidgetErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`Uncaught error in widget "${this.props.title}": `, error, errorInfo);
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center w-full h-full min-h-[200px] p-6 text-center bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-900 dark:border-slate-800">
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                        <div className="mb-2 text-amber-500 text-2xl">⚠️</div>
                        <p className="mb-4 text-sm text-foreground/60">
                            {this.props.errorMessage || "Widget unavailable"}
                        </p>
                        <button
                            onClick={this.handleRetry}
                            className="inline-flex items-center gap-2 rounded-md bg-secondary/50 px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary"
                        >
                            <span className="text-sm">↻</span>
                            Try again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
