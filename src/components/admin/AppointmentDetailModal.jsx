import { useEffect, useState } from "react";
import Modal from "../common/Modal";
import PageState from "../common/PageState";
import StatusBadge from "../common/StatusBadge";
import { getAppointmentDetailService } from "../../api/services/adminAppointmentService";

export default function AppointmentDetailModal({ isOpen, onClose, appointmentId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [appointment, setAppointment] = useState(null);

  useEffect(() => {
    if (isOpen && appointmentId) {
      setLoading(true);
      setError("");
      setAppointment(null);
      getAppointmentDetailService(appointmentId)
        .then((data) => {
          setAppointment(data);
        })
        .catch((e) => {
          setError(e?.message || "Không thể tải chi tiết lịch hẹn");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, appointmentId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết lịch hẹn" size="lg">
      <PageState
        variant="full"
        loading={loading}
        error={error}
        empty={!loading && !error && !appointment}
        emptyText="Không tìm thấy lịch hẹn"
      >
        {appointment && (
          <div className="detail-modal-grid">
            <div className="detail-item">
              <span className="detail-label">ID lịch hẹn</span>
              <span className="detail-value">#{appointment.appointmentId}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Trạng thái</span>
              <span className="detail-value"><StatusBadge status={appointment.status} /></span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Bệnh nhân</span>
              <span className="detail-value">{appointment.patientName}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Email bệnh nhân</span>
              <span className="detail-value">{appointment.patientEmail}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Bác sĩ</span>
              <span className="detail-value">{appointment.doctorName}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Khoa</span>
              <span className="detail-value">{appointment.departmentName}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Ngày giờ hẹn</span>
              <span className="detail-value">{appointment.appointmentTimeText}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Ngày tạo</span>
              <span className="detail-value">{appointment.createdAtText}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Hồ sơ y tế</span>
              <span className="detail-value">
                {appointment.hasMedicalRecord ? (
                  <span className="has-record yes">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Có
                  </span>
                ) : (
                  <span className="has-record no">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    Chưa có
                  </span>
                )}
              </span>
            </div>
          </div>
        )}
      </PageState>
    </Modal>
  );
}
