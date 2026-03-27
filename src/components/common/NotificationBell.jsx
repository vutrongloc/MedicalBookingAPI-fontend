import { useState, useRef, useEffect } from "react";
import { useNotification } from "../../context/NotificationContext";
import { useNavigate } from "react-router-dom";

const TYPE_ICONS = {
  Appointment: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  MedicalRecord: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  System: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
};

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
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

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.notificationId);
    }
    if (notification.relatedId) {
      if (notification.type === "Appointment") {
        navigate("/appointments");
      } else if (notification.type === "MedicalRecord") {
        navigate("/medical-records");
      }
    }
    setOpen(false);
  };

  return (
    <div className="notification-wrapper" ref={dropdownRef}>
      <button
        className="notification-bell"
        onClick={() => setOpen(!open)}
        aria-label={`Thông báo${unreadCount > 0 ? ` (${unreadCount} chưa đọc)` : ""}`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
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
                onClick={markAllAsRead}
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <p>Chưa có thông báo</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.notificationId}
                  className={`notification-item ${!n.isRead ? "unread" : ""}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="notification-item-icon">
                    {TYPE_ICONS[n.type] || TYPE_ICONS.System}
                  </div>
                  <div className="notification-item-content">
                    <p className="notification-item-title">{n.title}</p>
                    <p className="notification-item-body">{n.content}</p>
                    <span className="notification-item-time">{n.timeAgo}</span>
                  </div>
                  {!n.isRead && <span className="notification-item-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
