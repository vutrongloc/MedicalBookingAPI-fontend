import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { getDepartmentByIdService } from "../api/services/departmentService";
import { getDoctorsByDepartmentService } from "../api/services/doctorService";
import PageState from "../components/common/PageState";

export default function DepartmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [error, setError] = useState("");
  const [department, setDepartment] = useState(null);
  const [doctors, setDoctors] = useState([]);

  const loadDepartment = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getDepartmentByIdService(id);
      setDepartment(data);
    } catch (e) {
      setError(e?.message || "Không thể tải thông tin khoa");
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    setDoctorsLoading(true);
    try {
      const data = await getDoctorsByDepartmentService(id);
      setDoctors(data);
    } catch {
      // Silently fail
    } finally {
      setDoctorsLoading(false);
    }
  };

  useEffect(() => {
    loadDepartment();
    loadDoctors();
  }, [id]);

  return (
    <PageState loading={loading} error={error} empty={!department} emptyText="">
      {department && (
        <>
          <div className="card department-detail-card">
            <button className="back-btn" onClick={() => navigate("/departments")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              Quay lại danh sách khoa
            </button>

            <div className="department-detail-header">
              <div className="department-detail-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <div>
                <h2 className="department-detail-name">{department.departmentName}</h2>
                {department.description && (
                  <p className="department-detail-desc">{department.description}</p>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="section-title">
              Bác sĩ thuộc khoa ({doctors.length})
            </h3>
            <PageState variant="inline" loading={doctorsLoading} error="" empty={!doctorsLoading && !doctors.length} emptyText="Chưa có bác sĩ trong khoa này">
              <div className="doctor-grid">
                {doctors.map((d, index) => (
                  <div key={d.doctorId} className="doctor-card">
                    <span className="doctor-card-stt">{index + 1}</span>
                    <div className="doctor-card-avatar">
                      {d.fullName?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="doctor-card-info">
                      <h4 className="doctor-card-name">{d.fullName}</h4>
                      <p className="doctor-card-email">{d.email}</p>
                      {d.qualification && (
                        <p className="doctor-card-qual">{d.qualification}</p>
                      )}
                    </div>
                    <Link
                      to={`/doctors/${d.doctorId}`}
                      className="btn btn-sm doctor-card-btn"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                ))}
              </div>
            </PageState>
          </div>
        </>
      )}
    </PageState>
  );
}
