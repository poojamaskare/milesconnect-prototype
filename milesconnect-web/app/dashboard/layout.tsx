import type { ReactNode } from "react";
import DashboardShell from "./DashboardShell";

export default function DashboardLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	return <DashboardShell>{children}</DashboardShell>;
}

