import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../context/NotificationContext";

const NOTIF_TYPE_ICONS = {
  success: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  default: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
};

const TYPE_COLOR_MAP = {
  AppointmentConfirmed:     "success",
  AppointmentCompleted:    "success",
  AppointmentCreated:       "info",
  AppointmentCancelled:     "error",
  AppointmentAutoCancelled: "error",
  Reminder:                "info",
  System:                  "info",
  success:                 "success",
  error:                   "error",
  warning:                 "warning",
  info:                    "info",
};

function getTypeColor(type) {
  if (!type) return "info";
  return TYPE_COLOR_MAP[type.trim()] || "info";
}

function getRelativeTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getNotificationLink(notification) {
  const { relatedEntityType, relatedEntityId } = notification;
  if (!relatedEntityType) return null;

  const type = relatedEntityType.toLowerCase();
  if (type === "appointment") return "/appointments";
  if (type === "medicalrecord") return "/medical-records";
  if (type === "doctor" && relatedEntityId) return `/doctors/${relatedEntityId}`;
  if (type === "department" && relatedEntityId) return `/departments/${relatedEntityId}`;
  return null;
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, fetchNotifications } = useNotification();
  const [open, setOpen] = useState(false);
  const notifRef = useRef(null);
  const displayedNotifications = notifications.slice(0, 5);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleNotifClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.notificationId);
    }
    const link = getNotificationLink(notification);
    setOpen(false);
    if (link) {
      navigate(link);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate("/appointments");
  };

  const handleLoadMore = () => {
    fetchNotifications(notifications.length / 20 + 1);
  };

  const getIconClass = (type) => {
    const color = getTypeColor(type);
    return `notification-item-icon notification-item-icon--${color}`;
  };

  const getIcon = (type) => {
    const color = getTypeColor(type);
    return NOTIF_TYPE_ICONS[color] || NOTIF_TYPE_ICONS.info;
  };

  return (
    <div className="notification-wrapper" ref={notifRef}>
      <button
        className="notification-bell"
        onClick={() => setOpen(!open)}
        aria-label={`Thông báo${unreadCount > 0 ? ` (${unreadCount} chưa đọc)` : ""}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <span className="notification-dropdown-title">Thông báo</span>
            {unreadCount > 0 && (
              <button
                className="notification-mark-all"
                onClick={handleMarkAllRead}
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading && notifications.length === 0 && (
              <div className="notification-empty">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>Đang tải thông báo...</span>
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="notification-empty">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span>Không có thông báo nào</span>
              </div>
            )}

            {displayedNotifications.map((notif) => (
              <div
                key={notif.notificationId}
                className={`notification-item${!notif.isRead ? " unread" : ""}`}
                onClick={() => handleNotifClick(notif)}
              >
                <div className={getIconClass(notif.type)}>
                  {getIcon(notif.type)}
                </div>
                <div className="notification-item-content">
                  <p className="notification-item-title">{notif.title}</p>
                  <p className="notification-item-body">{notif.message}</p>
                  <span className="notification-item-time">
                    {getRelativeTime(notif.createdAt)}
                  </span>
                </div>
                {!notif.isRead && <div className="notification-item-dot" />}
              </div>
            ))}
          </div>

          {notifications.length > 0 && (
            <div className="notification-dropdown-footer" style={{ padding: "10px 16px", borderTop: "1px solid #e5e7eb", display: "flex", gap: "8px" }}>
              {notifications.length >= 5 && (
                <button
                  onClick={handleLoadMore}
                  style={{
                    flex: 1,
                    background: "#f3f4f6",
                    border: "none",
                    borderRadius: "6px",
                    padding: "7px",
                    fontSize: "12px",
                    color: "#374151",
                    cursor: "pointer",
                  }}
                >
                  Xem thêm
                </button>
              )}
              <button
                onClick={handleViewAll}
                style={{
                  flex: 1,
                  background: "#eff6ff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "7px",
                  fontSize: "12px",
                  color: "#2563eb",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Xem tất cả
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
