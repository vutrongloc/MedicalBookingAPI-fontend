import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../hooks/useAuth";
import {
  createMedicalRecordService,
  updateMedicalRecordService,
  getMedicalRecordByIdService,
  getDoctorMedicalRecordsService,
} from "../api/services/medicalRecordService";
import {
  getMyAppointmentsService,
  getAppointmentByIdService,
} from "../api/services/appointmentService";
import { useCooldown } from "../hooks/useCooldown";

export default function CreateMedicalRecordPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEditMode = Boolean(editId);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointmentInfo, setSelectedAppointmentInfo] = useState(null);
  const [error, setError] = useState("");

  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const [doctorDiagnosis, setDoctorDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [prescription, setPrescription] = useState("");

  const { isLocked: submitLocked, run: runSubmit } = useCooldown(3000);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        const appointmentData = await getMyAppointmentsService("Doctor", {
          page: 1,
          pageSize: 1000,
        });

        const completedAppointments = (appointmentData.items || []).filter(
          (a) => a.status === "Completed"
        );

        if (isEditMode) {
          const record = await getMedicalRecordByIdService(editId);
          setDoctorDiagnosis(record.doctorDiagnosis || "");
          setTreatment(record.treatment || "");
          setPrescription(record.prescription || "");
          setSelectedAppointmentId(record.appointmentId ? String(record.appointmentId) : "");

          if (record.appointmentId) {
            try {
              const appointmentInfo = await getAppointmentByIdService(record.appointmentId);
              setSelectedAppointmentInfo(appointmentInfo);
            } catch {
              const found = completedAppointments.find(
                (a) => String(a.appointmentId) === String(record.appointmentId)
              );
              if (found) {
                setSelectedAppointmentInfo(found);
              }
            }
          }
          setAppointments([]);
        } else {
          const recordsData = await getDoctorMedicalRecordsService();
          const existingRecordAppointmentIds = new Set(
            (recordsData || []).map((r) => r.appointmentId).filter(Boolean)
          );

          const appointmentsWithoutRecords = completedAppointments.filter(
            (a) => !existingRecordAppointmentIds.has(a.appointmentId)
          );
          setAppointments(appointmentsWithoutRecords);
        }
      } catch (e) {
        setError(e?.message || "Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [editId, isEditMode]);

  const selectedAppointment = appointments.find(
    (a) => String(a.appointmentId) === String(selectedAppointmentId)
  );

  const displayAppointment = isEditMode ? selectedAppointmentInfo : selectedAppointment;

  const handleAppointmentChange = async (appointmentId) => {
    setSelectedAppointmentId(appointmentId);
    if (appointmentId) {
      try {
        const appointmentInfo = await getAppointmentByIdService(appointmentId);
        setSelectedAppointmentInfo(appointmentInfo);
      } catch {
        setSelectedAppointmentInfo(null);
      }
    } else {
      setSelectedAppointmentInfo(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isEditMode && !selectedAppointmentId) {
      toast.error("Vui lòng chọn lịch hẹn");
      return;
    }

    if (!doctorDiagnosis.trim()) {
      toast.error("Vui lòng nhập chẩn đoán");
      return;
    }

    runSubmit(async () => {
      setSubmitting(true);
      try {
        const form = {
          appointmentId: selectedAppointmentId,
          doctorDiagnosis: doctorDiagnosis.trim(),
          treatment: treatment.trim() || "",
          prescription: prescription.trim() || "",
        };

        if (isEditMode) {
          await updateMedicalRecordService(editId, form);
          toast.success("Cập nhật hồ sơ bệnh án thành công");
        } else {
          await createMedicalRecordService(form);
          toast.success("Tạo hồ sơ bệnh án thành công");
        }
        navigate("/medical-records");
      } catch (e) {
        toast.error(e?.message || "Lưu thất bại");
      } finally {
        setSubmitting(false);
      }
    });
  };

  const handleCancel = () => {
    navigate("/medical-records");
  };

  if (loading) {
    return (
      <div className="card">
        <p>Đang tải...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <p className="error-text">{error}</p>
        <button className="btn secondary" onClick={handleCancel}>
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>{isEditMode ? "Cập nhật hồ sơ bệnh án" : "Tạo hồ sơ bệnh án"}</h2>

      <form onSubmit={handleSubmit} className="medical-record-form">
        {!isEditMode && (
          <div className="form-group">
            <label className="form-label required">Chọn lịch hẹn</label>
            <select
              className="form-select"
              value={selectedAppointmentId}
              onChange={(e) => handleAppointmentChange(e.target.value)}
              required
            >
              <option value="">-- Chọn lịch hẹn đã hoàn thành --</option>
              {appointments.map((a) => (
                <option key={a.appointmentId} value={a.appointmentId}>
                  {a.patientName} - {a.appointmentTimeText} - {a.departmentName}
                </option>
              ))}
            </select>
            {appointments.length === 0 && (
              <p className="form-hint">Không có lịch hẹn nào đã hoàn thành chưa có hồ sơ bệnh án</p>
            )}
          </div>
        )}

        {displayAppointment && (
          <div className="appointment-info-box">
            <h4>Thông tin bệnh nhân</h4>
            <div className="info-row">
              <span>Bệnh nhân:</span>
              <strong>{displayAppointment.patientName}</strong>
            </div>
            <div className="info-row">
              <span>Khoa:</span>
              <strong>{displayAppointment.departmentName}</strong>
            </div>
            <div className="info-row">
              <span>Ngày khám:</span>
              <strong>{displayAppointment.appointmentTimeText}</strong>
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label required">Chẩn đoán</label>
          <textarea
            className="form-textarea"
            value={doctorDiagnosis}
            onChange={(e) => setDoctorDiagnosis(e.target.value)}
            placeholder="Nhập chẩn đoán bệnh..."
            rows={4}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Phương pháp điều trị</label>
          <textarea
            className="form-textarea"
            value={treatment}
            onChange={(e) => setTreatment(e.target.value)}
            placeholder="Nhập phương pháp điều trị..."
            rows={3}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Đơn thuốc</label>
          <textarea
            className="form-textarea"
            value={prescription}
            onChange={(e) => setPrescription(e.target.value)}
            placeholder="Nhập đơn thuốc..."
            rows={3}
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn"
            disabled={submitting || submitLocked}
          >
            {submitting || submitLocked ? "Đang lưu..." : (isEditMode ? "Cập nhật" : "Tạo hồ sơ")}
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={handleCancel}
            disabled={submitting}
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
