"use client";

import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html>
            <body>
                <div className="flex h-screen w-full flex-col items-center justify-center p-6 text-center bg-background text-foreground">
                    <h2 className="text-2xl font-bold">Critical Error</h2>
                    <p className="mb-4 text-muted-foreground">Something went wrong at the application level.</p>
                    <button
                        onClick={() => reset()}
                        className="rounded bg-primary px-4 py-2 text-primary-foreground"
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
