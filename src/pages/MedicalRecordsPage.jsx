import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { getMedicalRecordsService, createMedicalRecordService, updateMedicalRecordService } from "../api/services/medicalRecordService";
import { getMyAppointmentsService } from "../api/services/appointmentService";
import { useAuth } from "../hooks/useAuth";
import PageState from "../components/common/PageState";
import Modal from "../components/common/Modal";
import Pagination from "../components/common/Pagination";

export default function MedicalRecordsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadRecords = async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const data = await getMedicalRecordsService(user?.role, { page, pageSize: 10 });
      setItems(data.items);
      setTotalPages(data.totalPages);
      setCurrentPage(data.page);
    } catch (e) {
      setError(e?.message || "Không thể tải bệnh án");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords(1);
  }, [user?.role]);

  const handleRowClick = (record) => {
    if (user?.role === "Doctor" || user?.role === "Admin") {
      setSelectedRecord(record);
      setShowEditModal(true);
    }
  };

  return (
    <>
      <PageState
        loading={loading}
        error={error}
        empty={!items.length}
        emptyText="Chưa có bệnh án"
      >
        <div className="card">
          <div className="table-toolbar">
            <h2>Hồ sơ bệnh án</h2>
            {user?.role === "Doctor" && (
              <button className="btn" onClick={() => setShowCreateModal(true)}>
                Tạo bệnh án mới
              </button>
            )}
          </div>

          <table className="table table-clickable">
            <thead>
              <tr>
                <th>ID</th>
                <th>Appointment ID</th>
                <th>Bác sĩ</th>
                <th>Khoa</th>
                <th>Chẩn đoán</th>
                <th>Điều trị</th>
                <th>Đơn thuốc</th>
                <th>Ngày khám</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.medicalRecordId} onClick={() => handleRowClick(r)} style={{ cursor: (user?.role === "Doctor" || user?.role === "Admin") ? "pointer" : "default" }}>
                  <td>{r.medicalRecordId}</td>
                  <td>{r.appointmentId}</td>
                  <td>{r.doctorName}</td>
                  <td>{r.departmentName}</td>
                  <td className="text-truncate" style={{ maxWidth: 150 }} title={r.doctorDiagnosis}>{r.doctorDiagnosis || "-"}</td>
                  <td className="text-truncate" style={{ maxWidth: 150 }} title={r.treatment}>{r.treatment || "-"}</td>
                  <td className="text-truncate" style={{ maxWidth: 150 }} title={r.prescription}>{r.prescription || "-"}</td>
                  <td>{r.appointmentTimeText}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => loadRecords(p)}
          />
        </div>
      </PageState>

      {showCreateModal && (
        <CreateMedicalRecordModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={async () => {
            setShowCreateModal(false);
            await loadRecords(1);
          }}
        />
      )}

      {showEditModal && selectedRecord && (
        <EditMedicalRecordModal
          record={selectedRecord}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={async () => {
            setShowEditModal(false);
            setSelectedRecord(null);
            await loadRecords(currentPage);
          }}
        />
      )}
    </>
  );
}

function CreateMedicalRecordModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (isOpen) {
      loadCompletedAppointments();
    }
  }, [isOpen]);

  const loadCompletedAppointments = async () => {
    setLoading(true);
    try {
      const data = await getMyAppointmentsService("Doctor", { pageSize: 100 });
      const completed = (data.items || []).filter((a) => a.status === "Completed");
      setAppointments(completed);
    } catch {
      toast.error("Không thể tải lịch hẹn");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      await createMedicalRecordService(formData);
      toast.success("Tạo bệnh án thành công");
      reset();
      onSuccess();
    } catch (e) {
      toast.error(e?.message || "Tạo bệnh án thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tạo bệnh án mới" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="medical-record-form">
        <div className="field">
          <label className="field-label">Lịch hẹn đã khám <span className="required">*</span></label>
          <select
            {...register("appointmentId", { required: "Vui lòng chọn lịch hẹn" })}
            className={errors.appointmentId ? "input-error" : ""}
            disabled={loading}
          >
            <option value="">-- Chọn lịch hẹn --</option>
            {appointments.map((a) => (
              <option key={a.appointmentId} value={a.appointmentId}>
                #{a.appointmentId} - {a.patientName} - {a.appointmentTimeText}
              </option>
            ))}
          </select>
          {errors.appointmentId && <span className="error-text">{errors.appointmentId.message}</span>}
          {appointments.length === 0 && !loading && (
            <span className="error-text">Không có lịch hẹn nào đã hoàn thành</span>
          )}
        </div>

        <div className="field">
          <label className="field-label">Chẩn đoán</label>
          <textarea
            {...register("doctorDiagnosis")}
            placeholder="Nhập chẩn đoán..."
            rows={3}
          />
        </div>

        <div className="field">
          <label className="field-label">Điều trị</label>
          <textarea
            {...register("treatment")}
            placeholder="Nhập phương pháp điều trị..."
            rows={3}
          />
        </div>

        <div className="field">
          <label className="field-label">Đơn thuốc</label>
          <textarea
            {...register("prescription")}
            placeholder="Nhập đơn thuốc..."
            rows={3}
          />
        </div>

        <div className="modal-form-actions">
          <button type="button" className="btn secondary" onClick={onClose} disabled={submitting}>Hủy</button>
          <button type="submit" className="btn" disabled={submitting || appointments.length === 0}>
            {submitting ? "Đang lưu..." : "Tạo bệnh án"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditMedicalRecordModal({ record, isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (isOpen && record) {
      reset({
        doctorDiagnosis: record.doctorDiagnosis || "",
        treatment: record.treatment || "",
        prescription: record.prescription || "",
      });
    }
  }, [isOpen, record]);

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      await updateMedicalRecordService(record.medicalRecordId, formData);
      toast.success("Cập nhật bệnh án thành công");
      onSuccess();
    } catch (e) {
      toast.error(e?.message || "Cập nhật thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết / Sửa bệnh án" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="medical-record-form">
        <div className="record-detail-info">
          <div className="detail-row">
            <span className="detail-label">ID bệnh án</span>
            <span className="detail-value">#{record.medicalRecordId}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Bác sĩ</span>
            <span className="detail-value">{record.doctorName}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Khoa</span>
            <span className="detail-value">{record.departmentName}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Ngày khám</span>
            <span className="detail-value">{record.appointmentTimeText}</span>
          </div>
        </div>

        <div className="field">
          <label className="field-label">Chẩn đoán</label>
          <textarea
            {...register("doctorDiagnosis")}
            placeholder="Nhập chẩn đoán..."
            rows={3}
          />
        </div>

        <div className="field">
          <label className="field-label">Điều trị</label>
          <textarea
            {...register("treatment")}
            placeholder="Nhập phương pháp điều trị..."
            rows={3}
          />
        </div>

        <div className="field">
          <label className="field-label">Đơn thuốc</label>
          <textarea
            {...register("prescription")}
            placeholder="Nhập đơn thuốc..."
            rows={3}
          />
        </div>

        <div className="modal-form-actions">
          <button type="button" className="btn secondary" onClick={onClose} disabled={submitting}>Đóng</button>
          {user?.role === "Doctor" && (
            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
