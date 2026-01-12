
"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, Mail, UserPlus, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

type Notification = {
    id: number;
    type: "info" | "success" | "warning" | "error";
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    data?: any;
};

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notifications");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.data || []);
                setUnreadCount(data.unread_count || 0);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const markAsRead = async (id?: number) => {
        try {
            // Optimistic update
            if (id) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            } else {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                setUnreadCount(0);
            }

            const body = id ? { id } : { mark_all_read: true };
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            fetchNotifications();
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "success": return <Mail className="h-4 w-4" />;
            case "warning": return <Info className="h-4 w-4" />;
            case "error": return <X className="h-4 w-4" />;
            default: return <UserPlus className="h-4 w-4" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none text-gray-600"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-600 ring-2 ring-white" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden text-sm">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                markAsRead();
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Mark all as read
                        </button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No notifications
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={cn(
                                        "px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 cursor-pointer",
                                        !n.is_read ? "bg-blue-50/40" : ""
                                    )}
                                    onClick={() => {
                                        if (!n.is_read) markAsRead(n.id);
                                    }}
                                >
                                    <div className={cn(
                                        "flex-shrink-0 mt-0.5 h-8 w-8 rounded-full flex items-center justify-center",
                                        n.type === 'success' ? "bg-green-100 text-green-600" :
                                            n.type === 'warning' ? "bg-yellow-100 text-yellow-600" :
                                                n.type === 'error' ? "bg-red-100 text-red-600" :
                                                    "bg-blue-100 text-blue-600"
                                    )}>
                                        {getIcon(n.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-0.5">
                                            <p className={cn("font-medium text-gray-900 truncate pr-2", !n.is_read && "font-semibold")}>
                                                {n.title}
                                            </p>
                                            {!n.is_read && (
                                                <span className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5" />
                                            )}
                                        </div>
                                        <p className="text-gray-500 line-clamp-2 leading-relaxed" title={n.message}>{n.message}</p>
                                        <p className="text-xs text-gray-400 mt-1.5">
                                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
