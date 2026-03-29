import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getDoctorByIdService } from "../api/services/doctorService";
import { getMyAppointmentsService } from "../api/services/appointmentService";
import { useAuth } from "../hooks/useAuth";
import PageState from "../components/common/PageState";
import StatusBadge from "../components/common/StatusBadge";
import { formatDateTime } from "../utils/date";

export default function DoctorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [error, setError] = useState("");
  const [doctor, setDoctor] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);

  const loadDoctor = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getDoctorByIdService(id);
      setDoctor(data);
    } catch (e) {
      setError(e?.message || "Không thể tải thông tin bác sĩ");
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async () => {
    setAppointmentsLoading(true);
    try {
      const data = await getMyAppointmentsService("Doctor", { pageSize: 100 });
      const now = new Date();
      const upcoming = (data.items || [])
        .filter((a) => new Date(a.appointmentTime) > now)
        .sort((a, b) => new Date(a.appointmentTime) - new Date(b.appointmentTime))
        .slice(0, 5);
      setUpcomingAppointments(upcoming);
    } catch {
      // Silently fail for appointments
    } finally {
      setAppointmentsLoading(false);
    }
  };

  useEffect(() => {
    loadDoctor();
    loadAppointments();
  }, [id]);

  return (
    <PageState loading={loading} error={error} empty={!doctor} emptyText="">
      {doctor && (
        <>
          <div className="card doctor-detail-card">
            <button className="back-btn" onClick={() => navigate("/doctors")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              Quay lại danh sách bác sĩ
            </button>

            <div className="doctor-detail-header">
              <div className="doctor-detail-avatar">
                {doctor.fullName?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="doctor-detail-info">
                <h2 className="doctor-detail-name">{doctor.fullName}</h2>
                <p className="doctor-detail-department">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                  {doctor.departmentName}
                </p>
                {doctor.qualification && (
                  <p className="doctor-detail-qualification">{doctor.qualification}</p>
                )}
              </div>
              {user?.role === "Patient" && (
                <button
                  className="btn doctor-detail-book-btn"
                  onClick={() => navigate(`/appointments?doctorId=${doctor.doctorId}`)}
                >
                  Đặt lịch khám ngay
                </button>
              )}
            </div>

            <div className="doctor-detail-body">
              <div className="doctor-detail-contact">
                <div className="contact-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <span>{doctor.email}</span>
                </div>
                {doctor.phone && (
                  <div className="contact-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    <span>{doctor.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="section-title">Lịch hẹn sắp tới của tôi</h3>
            <PageState loading={appointmentsLoading} error="" empty={!upcomingAppointments.length} emptyText="Không có lịch hẹn sắp tới">
              <table className="table">
                <thead>
                  <tr>
                    <th>Bệnh nhân</th>
                    <th>Thời gian</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingAppointments.map((a) => (
                    <tr key={a.appointmentId}>
                      <td>{a.patientName}</td>
                      <td>{a.appointmentTimeText}</td>
                      <td><StatusBadge status={a.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </PageState>
          </div>
        </>
      )}
    </PageState>
  );
}
