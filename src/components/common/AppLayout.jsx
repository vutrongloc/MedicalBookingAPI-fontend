import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import NotificationBell from "./NotificationBell";

const menuItems = [
  { to: "/", label: "Trang chủ" },
  { to: "/departments", label: "Khoa khám" },
  { to: "/doctors", label: "Bác sĩ" },
  { to: "/appointments", label: "Lịch hẹn" },
  { to: "/medical-records", label: "Hồ sơ bệnh án" },
  { to: "/profile", label: "Hồ sơ" },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
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
                Xin chào, {user?.fullName} ({user?.role})
              </div>
            </div>
          </div>
          <div className="topbar-right">
            <NotificationBell />
            <button className="btn secondary topbar-logout" onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
      <div className="container">
        <nav className="menu">
          {menuItems
            .filter((item) => {
              if (user?.role === "Patient") {
                return item.to !== "/medical-records";
              }
              if (item.to === "/profile") return false;
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
