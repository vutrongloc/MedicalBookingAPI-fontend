import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { getNotificationsService, getUnreadCountService, markAsReadService, markAllAsReadService } from "../api/services/notificationService";
import { useAuth } from "../hooks/useAuth";
import { tokenStorage } from "../utils/storage";

const NotificationContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5220";

export function NotificationProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const connectionRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const count = await getUnreadCountService();
      setUnreadCount(count);
    } catch {
      // Silently fail
    }
  }, [isAuthenticated]);

  const fetchNotifications = useCallback(async (pageNum = 1) => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await getNotificationsService(pageNum, 20);
      setNotifications(pageNum === 1 ? data.items : (prev) => [...prev, ...data.items]);
      setTotalPages(data.totalPages);
      setPage(pageNum);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await markAsReadService(notificationId);
      setNotifications((prev) =>
        prev.map((n) => n.notificationId === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Silently fail
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllAsReadService();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Silently fail
    }
  }, []);

  // Fetch on login
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      fetchNotifications(1);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, fetchUnreadCount, fetchNotifications]);

  // SignalR realtime
  useEffect(() => {
    if (!isAuthenticated || !user?.userId) return;

    const token = tokenStorage.get();
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/notifications`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    connection.on("ReceiveNotification", (newNotification) => {
      const normalized = {
        notificationId: newNotification.notificationId,
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        isRead: false,
        createdAt: newNotification.createdAt,
        relatedEntityId: newNotification.relatedId || newNotification.relatedEntityId,
        relatedEntityType: newNotification.relatedEntityType || "Appointment",
      };
      setNotifications((prev) => [normalized, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    const startConnection = async () => {
      try {
        await connection.start();
        await connection.invoke("JoinUserGroup", user.userId);
      } catch (err) {
        console.error("SignalR connection error:", err);
      }
    };

    startConnection();

    return () => {
      connection.stop().catch(() => {});
    };
  }, [isAuthenticated, user]);

  const value = {
    notifications,
    unreadCount,
    loading,
    page,
    totalPages,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    refresh: fetchUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification must be used within NotificationProvider");
  return ctx;
}
