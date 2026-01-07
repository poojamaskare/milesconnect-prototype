"use client";

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";
import { LogisticsProvider } from "../lib/context/LogisticsProvider";
import { NotificationProvider } from "../lib/context/NotificationProvider";
import { ThemeProvider } from "../components/ThemeProvider";
import { Toaster, toast } from "sonner";

export default function Providers({ children }: { children: ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				queryCache: new QueryCache({
					onError: (error) => {
						toast.error(error.message || "An unexpected error occurred");
					},
				}),
				mutationCache: new MutationCache({
					onError: (error) => {
						toast.error(error.message || "Action failed");
					},
				}),
				defaultOptions: {
					queries: {
						refetchOnWindowFocus: false,
						staleTime: 5000,
					},
				},
			})
	);

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider
				attribute="class"
				defaultTheme="system"
				enableSystem
				disableTransitionOnChange
			>
				<LogisticsProvider>
					<NotificationProvider>
						{children}
						<Toaster richColors position="top-right" />
					</NotificationProvider>
				</LogisticsProvider>
			</ThemeProvider>
		</QueryClientProvider>
	);
}
