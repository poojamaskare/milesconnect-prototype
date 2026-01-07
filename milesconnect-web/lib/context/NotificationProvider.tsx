"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export type NotificationType = "success" | "warning" | "info" | "error";

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    time: string; // Simplified for now, could be Date object
    read: boolean;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (notification: Omit<Notification, "id" | "read" | "time">) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    dismissNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([
        // Initial mock data to show it working
        {
            id: "1",
            type: "success",
            title: "Shipment Delivered",
            message: "SHP-2024-001 was successfully delivered",
            time: "5 minutes ago",
            read: false,
        },
        {
            id: "2",
            type: "warning",
            title: "Maintenance Due",
            message: "Vehicle MH-01-AB-1234 requires service",
            time: "1 hour ago",
            read: false,
        },
        {
            id: "3",
            type: "info",
            title: "New Driver Onboarded",
            message: "John Doe has been added to the system",
            time: "2 hours ago",
            read: true,
        }
    ]);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const addNotification = useCallback((notification: Omit<Notification, "id" | "read" | "time">) => {
        const newNotification: Notification = {
            ...notification,
            id: Math.random().toString(36).substring(2, 9),
            read: false,
            time: "Just now",
        };
        setNotifications((prev) => [newNotification, ...prev]);
    }, []);

    const markAsRead = useCallback((id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }, []);

    const dismissNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                addNotification,
                markAsRead,
                markAllAsRead,
                dismissNotification,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error("useNotifications must be used within a NotificationProvider");
    }
    return context;
}
