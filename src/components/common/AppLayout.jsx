import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useState, useRef, useEffect } from "react";

const menuItems = [
  { to: "/", label: "Trang chủ" },
  { to: "/departments", label: "Khoa khám" },
  { to: "/doctors", label: "Bác sĩ" },
  { to: "/appointments", label: "Lịch hẹn" },
  { to: "/ai-chat", label: "Trợ lý AI", roles: ["Patient"] },
  { to: "/medical-records", label: "Hồ sơ bệnh án", roles: ["Patient", "Doctor"] },
  { to: "/profile", label: "Hồ sơ" },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setAvatarOpen(false);
      }
    };
    if (avatarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [avatarOpen]);

  const roleLabel = {
    Admin: "Quản trị viên",
    Doctor: "Bác sĩ",
    Patient: "Bệnh nhân",
  };

  return (
    <>
      <div className="topbar">
        <div className="container topbar-content">
          <div className="topbar-left">
            <div className="topbar-logo" aria-hidden="true">
              <span className="topbar-logo-bar horizontal" />
              <span className="topbar-logo-bar vertical" />
            </div>
            <div>
              <strong className="topbar-title">Medical Booking Hospital</strong>
              <div className="topbar-subtitle">
                Xin chào, {user?.fullName}
              </div>
            </div>
          </div>
          <div className="topbar-right">
            <div className="avatar-wrapper" ref={avatarRef}>
              <button
                className="avatar-btn"
                onClick={() => setAvatarOpen(!avatarOpen)}
                aria-label="Tài khoản"
              >
                <div className="avatar-circle">
                  {user?.fullName?.charAt(0)?.toUpperCase() || "?"}
                </div>
              </button>
              {avatarOpen && (
                <div className="avatar-dropdown">
                  <div className="avatar-dropdown-header">
                    <div className="avatar-dropdown-name">{user?.fullName}</div>
                    <div className="avatar-dropdown-email">{user?.email}</div>
                    <span className={`role-badge role-badge--${user?.role?.toLowerCase()}`}>
                      {roleLabel[user?.role] || user?.role}
                    </span>
                  </div>
                  <div className="avatar-dropdown-divider" />
                  <button
                    className="avatar-dropdown-item"
                    onClick={() => { setAvatarOpen(false); navigate("/profile"); }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    Thông tin tài khoản
                  </button>
                  <button
                    className="avatar-dropdown-item"
                    onClick={() => { setAvatarOpen(false); navigate("/profile"); }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    Đổi mật khẩu
                  </button>
                  <div className="avatar-dropdown-divider" />
                  <button
                    className="avatar-dropdown-item avatar-dropdown-item--danger"
                    onClick={handleLogout}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="container">
        <nav className="menu">
          {menuItems
            .filter((item) => {
              if (item.to === "/profile") return false;
              if (item.to === "/appointments" && user?.role === "Admin") return false;
              if (item.roles && !item.roles.includes(user?.role)) return false;
              return true;
            })
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? "menu-link active" : "menu-link")}
                end={item.to === "/"}
              >
                {item.label}
              </NavLink>
            ))}
          {user?.role === "Admin" && (
            <NavLink
              to="/admin"
              className={({ isActive }) => (isActive ? "menu-link active" : "menu-link")}
            >
              Quản trị
            </NavLink>
          )}
        </nav>
        <Outlet />
      </div>
    </>
  );
}
