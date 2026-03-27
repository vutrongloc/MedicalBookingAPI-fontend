import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getCurrentUserService } from "../api/services/userService";
import { getMyAppointmentsService } from "../api/services/appointmentService";
import { getMedicalRecordsService } from "../api/services/medicalRecordService";
import PageState from "../components/common/PageState";
import StatusBadge from "../components/common/StatusBadge";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [pendingAppointments, setPendingAppointments] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileData] = await Promise.all([getCurrentUserService()]);
      setProfile(profileData);
      await loadStats(profileData.role);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (role) => {
    try {
      if (role === "Patient") {
        const appointmentData = await getMyAppointmentsService("Patient", { pageSize: 100 });
        const records = await getMedicalRecordsService("Patient", { pageSize: 100 }).catch(() => ({ items: [] }));
        const now = new Date();
        const total = appointmentData.items?.length || 0;
        const completed = appointmentData.items?.filter((a) => a.status === "Completed").length || 0;
        const upcoming = appointmentData.items?.filter((a) => new Date(a.appointmentTime) > now).length || 0;
        setUpcomingAppointments(
          (appointmentData.items || [])
            .filter((a) => new Date(a.appointmentTime) > now)
            .sort((a, b) => new Date(a.appointmentTime) - new Date(b.appointmentTime))
            .slice(0, 3)
        );
        setStats({
          totalAppointments: total,
          completedAppointments: completed,
          totalRecords: records.items?.length || 0,
          upcomingCount: upcoming,
        });
      } else if (role === "Doctor") {
        const appointmentData = await getMyAppointmentsService("Doctor", { pageSize: 100 });
        const records = await getMedicalRecordsService("Doctor", { pageSize: 100 }).catch(() => ({ items: [] }));
        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];
        const today = appointmentData.items?.filter((a) => {
          const d = new Date(a.appointmentTime).toISOString().split("T")[0];
          return d === todayStr;
        }) || [];
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() + 7);
        const weekStart = now;
        const thisWeek = appointmentData.items?.filter((a) => {
          const d = new Date(a.appointmentTime);
          return d >= weekStart && d <= weekEnd;
        }) || [];
        const pending = appointmentData.items?.filter((a) => a.status === "Pending") || [];
        setTodayAppointments(today.slice(0, 5));
        setPendingAppointments(pending.slice(0, 5));
        setStats({
          todayCount: today.length,
          weekCount: thisWeek.length,
          totalRecords: records.items?.length || 0,
          pendingCount: pending.length,
        });
      }
    } catch {
      // silently fail
    }
  };

  if (loading) {
    return <PageState loading={true} empty={false} />;
  }

  const role = profile?.role;

  return (
    <div className="dashboard-container">
      {role === "Patient" && <PatientDashboard profile={profile} stats={stats} upcoming={upcomingAppointments} navigate={navigate} />}
      {role === "Doctor" && <DoctorDashboard profile={profile} stats={stats} today={todayAppointments} pending={pendingAppointments} navigate={navigate} />}
      {role === "Admin" && <AdminDashboard profile={profile} navigate={navigate} />}
    </div>
  );
}

function PatientDashboard({ profile, stats, upcoming, navigate }) {
  return (
    <>
      <div className="dashboard-welcome">
        <div className="dashboard-avatar">{profile?.fullName?.charAt(0)?.toUpperCase() || "?"}</div>
        <div>
          <h2>Xin chào, {profile?.fullName}!</h2>
          <p>Chào mừng bạn quay trở lại hệ thống đặt lịch khám</p>
        </div>
      </div>

      {stats && (
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon stat-icon--blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.totalAppointments}</span>
              <span className="stat-label">Lịch hẹn đã đặt</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon--green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.completedAppointments}</span>
              <span className="stat-label">Đã hoàn thành</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon--purple">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.totalRecords}</span>
              <span className="stat-label">Bệnh án</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon--orange">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.upcomingCount}</span>
              <span className="stat-label">Sắp tới</span>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-quick-actions">
        <h3>Truy cập nhanh</h3>
        <div className="quick-actions-grid">
          <button className="quick-action-card" onClick={() => navigate("/appointments")}>
            <div className="quick-action-icon quick-action-icon--blue">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
                <line x1="12" y1="14" x2="12" y2="18"/>
                <line x1="10" y1="16" x2="14" y2="16"/>
              </svg>
            </div>
            <span>Đặt lịch khám</span>
          </button>
          <button className="quick-action-card" onClick={() => navigate("/appointments")}>
            <div className="quick-action-icon quick-action-icon--green">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 11 12 14 22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            <span>Xem lịch hẹn</span>
          </button>
          <button className="quick-action-card" onClick={() => navigate("/medical-records")}>
            <div className="quick-action-icon quick-action-icon--purple">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <span>Xem bệnh án</span>
          </button>
          <button className="quick-action-card" onClick={() => navigate("/profile")}>
            <div className="quick-action-icon quick-action-icon--gray">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <span>Hồ sơ cá nhân</span>
          </button>
        </div>
      </div>

      {upcoming.length > 0 && (
        <div className="card dashboard-upcoming">
          <h3>Lịch hẹn sắp tới</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Bác sĩ</th>
                <th>Khoa</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((a) => (
                <tr key={a.appointmentId}>
                  <td>{a.doctorName}</td>
                  <td>{a.departmentName}</td>
                  <td>{a.appointmentTimeText}</td>
                  <td><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="dashboard-ai-card">
        <button
          className="dashboard-ai-btn"
          onClick={() => toast.info("Tính năng chẩn đoán AI đang được phát triển")}
        >
          <div className="dashboard-ai-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <strong>Chẩn đoán bệnh bằng AI</strong>
            <p>Sử dụng trí tuệ nhân tạo để hỗ trợ chẩn đoán sơ bộ</p>
          </div>
        </button>
      </div>
    </>
  );
}

function DoctorDashboard({ profile, stats, today, pending, navigate }) {
  return (
    <>
      <div className="dashboard-welcome">
        <div className="dashboard-avatar dashboard-avatar--doctor">{profile?.fullName?.charAt(0)?.toUpperCase() || "?"}</div>
        <div>
          <h2>Xin chào, Bác sĩ {profile?.fullName}!</h2>
          <p>{profile?.departmentName ? `Khoa ${profile.departmentName}` : "Chào mừng bác sĩ"}</p>
        </div>
      </div>

      {stats && (
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon stat-icon--blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.todayCount}</span>
              <span className="stat-label">Lịch hẹn hôm nay</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon--orange">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.weekCount}</span>
              <span className="stat-label">Tuần này</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon--purple">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.totalRecords}</span>
              <span className="stat-label">Bệnh án đã tạo</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon--red">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.pendingCount}</span>
              <span className="stat-label">Chờ xác nhận</span>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-quick-actions">
        <h3>Truy cập nhanh</h3>
        <div className="quick-actions-grid">
          <button className="quick-action-card" onClick={() => navigate("/appointments")}>
            <div className="quick-action-icon quick-action-icon--blue">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <span>Xem lịch hẹn</span>
          </button>
          <button className="quick-action-card" onClick={() => navigate("/medical-records")}>
            <div className="quick-action-icon quick-action-icon--green">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
            </div>
            <span>Tạo bệnh án</span>
          </button>
          <button className="quick-action-card" onClick={() => navigate("/medical-records")}>
            <div className="quick-action-icon quick-action-icon--purple">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <span>Hồ sơ bệnh án</span>
          </button>
          <button className="quick-action-card" onClick={() => navigate("/profile")}>
            <div className="quick-action-icon quick-action-icon--gray">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <span>Hồ sơ cá nhân</span>
          </button>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="card">
          <h3>Lịch hẹn chờ xác nhận</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Bệnh nhân</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((a) => (
                <tr key={a.appointmentId}>
                  <td>{a.patientName}</td>
                  <td>{a.appointmentTimeText}</td>
                  <td><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {today.length > 0 && (
        <div className="card">
          <h3>Lịch hẹn hôm nay</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Bệnh nhân</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {today.map((a) => (
                <tr key={a.appointmentId}>
                  <td>{a.patientName}</td>
                  <td>{a.appointmentTimeText}</td>
                  <td><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function AdminDashboard({ profile, navigate }) {
  return (
    <>
      <div className="dashboard-welcome">
        <div className="dashboard-avatar dashboard-avatar--admin">{profile?.fullName?.charAt(0)?.toUpperCase() || "?"}</div>
        <div>
          <h2>Xin chào, {profile?.fullName}!</h2>
          <p>Quản trị viên hệ thống Medical Booking</p>
        </div>
      </div>

      <div className="dashboard-quick-actions">
        <h3>Quản lý hệ thống</h3>
        <div className="quick-actions-grid">
          <button className="quick-action-card" onClick={() => navigate("/admin")}>
            <div className="quick-action-icon quick-action-icon--blue">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <span>Quản lý người dùng</span>
          </button>
          <button className="quick-action-card" onClick={() => navigate("/doctors")}>
            <div className="quick-action-icon quick-action-icon--green">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <span>Quản lý bác sĩ</span>
          </button>
          <button className="quick-action-card" onClick={() => navigate("/departments")}>
            <div className="quick-action-icon quick-action-icon--purple">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <span>Quản lý khoa</span>
          </button>
          <button className="quick-action-card" onClick={() => navigate("/appointments")}>
            <div className="quick-action-icon quick-action-icon--orange">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <span>Quản lý lịch hẹn</span>
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Đường dẫn nhanh</h3>
        <div className="quick-actions-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <button className="quick-action-card" onClick={() => navigate("/admin")}>
            <div className="quick-action-icon quick-action-icon--blue">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
            </div>
            <span>Trang quản trị</span>
          </button>
          <button className="quick-action-card" onClick={() => navigate("/profile")}>
            <div className="quick-action-icon quick-action-icon--gray">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <span>Hồ sơ cá nhân</span>
          </button>
        </div>
      </div>
    </>
  );
}
