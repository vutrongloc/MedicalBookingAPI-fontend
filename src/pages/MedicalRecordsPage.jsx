import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PageState from "../components/common/PageState";
import { useAuth } from "../hooks/useAuth";
import {
  getMyMedicalRecordsService,
  getDoctorMedicalRecordsService,
  getMedicalRecordByIdService,
  updateMedicalRecordService,
} from "../api/services/medicalRecordService";
import Modal from "../components/common/Modal";
import SearchBar from "../components/common/SearchBar";
import { useCooldown } from "../hooks/useCooldown";

export default function MedicalRecordsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isDoctor = user?.role === "Doctor";
  const isPatient = user?.role === "Patient";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [allRecords, setAllRecords] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const PAGE_SIZE = 10;

  const loadRecords = async () => {
    setLoading(true);
    setError("");
    try {
      const data = isDoctor
        ? await getDoctorMedicalRecordsService()
        : await getMyMedicalRecordsService();
      setAllRecords(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || "Không thể tải hồ sơ bệnh án");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [isDoctor]);

  const filteredRecords = useMemo(() => {
    const term = (searchTerm || "").toLowerCase().trim();
    if (!term) return allRecords;
    return allRecords.filter((r) => {
      if (isPatient) {
        return [
          r.doctorName || "",
          r.departmentName || "",
          r.doctorDiagnosis || "",
        ].some((f) => f.toLowerCase().includes(term));
      } else {
        return [
          r.patientName || "",
          r.departmentName || "",
          r.doctorDiagnosis || "",
        ].some((f) => f.toLowerCase().includes(term));
      }
    });
  }, [allRecords, searchTerm, isPatient]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));

  const displayedRecords = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRecords.slice(start, start + PAGE_SIZE);
  }, [filteredRecords, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleRowClick = async (record) => {
    try {
      const fullRecord = await getMedicalRecordByIdService(record.medicalRecordId);
      setSelectedRecord(fullRecord);
    } catch {
      setSelectedRecord(record);
    }
    setShowDetailModal(true);
  };

  const handleCreateNew = () => {
    navigate("/medical-records/create");
  };

  const handleRecordUpdated = () => {
    setShowDetailModal(false);
    loadRecords();
  };

  return (
    <>
      <div className="card">
        <div className="table-toolbar">
          <h2>Hồ sơ bệnh án</h2>
          {isDoctor && (
            <button className="btn" onClick={handleCreateNew}>
              Tạo hồ sơ bệnh án
            </button>
          )}
        </div>

        <div className="table-toolbar-filters">
          <SearchBar
            placeholder={
              isPatient
                ? "Tìm bác sĩ, khoa, chẩn đoán..."
                : "Tìm bệnh nhân, khoa, chẩn đoán..."
            }
            value={searchTerm}
            onChange={setSearchTerm}
            onClear={() => setSearchTerm("")}
          />
        </div>

        <PageState
          loading={loading}
          error={error}
          empty={!displayedRecords.length}
          emptyText="Chưa có hồ sơ bệnh án"
        >
          <table className="table table-clickable">
            <thead>
              <tr>
                <th>STT</th>
                {isPatient && <th>Bác sĩ</th>}
                {isDoctor && <th>Bệnh nhân</th>}
                <th>Khoa</th>
                <th>Ngày khám</th>
                <th>Chẩn đoán</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {displayedRecords.map((r, index) => (
                <tr
                  key={r.medicalRecordId}
                  onClick={() => handleRowClick(r)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{index + 1 + (currentPage - 1) * PAGE_SIZE}</td>
                  {isPatient ? (
                    <td>{r.doctorName || "-"}</td>
                  ) : (
                    <td>{r.patientName || "-"}</td>
                  )}
                  <td>{r.departmentName || "-"}</td>
                  <td>{r.appointmentTimeText || "-"}</td>
                  <td>
                    {r.doctorDiagnosis
                      ? r.doctorDiagnosis.length > 50
                        ? r.doctorDiagnosis.substring(0, 50) + "..."
                        : r.doctorDiagnosis
                      : "-"}
                  </td>
                  <td>{r.createdAtText || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                &laquo;
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`pagination-page ${currentPage === page ? "active" : ""}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                &raquo;
              </button>
            </div>
          )}
        </PageState>
      </div>

      {selectedRecord && (
        <MedicalRecordDetailModal
          record={selectedRecord}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          isDoctor={isDoctor}
          onRecordUpdated={handleRecordUpdated}
        />
      )}
    </>
  );
}

function MedicalRecordDetailModal({ record, isOpen, onClose, isDoctor, onRecordUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { isLocked: submitLocked, run: runSubmit } = useCooldown(3000);

  const [doctorDiagnosis, setDoctorDiagnosis] = useState(record?.doctorDiagnosis || "");
  const [treatment, setTreatment] = useState(record?.treatment || "");
  const [prescription, setPrescription] = useState(record?.prescription || "");

  useEffect(() => {
    if (record) {
      setDoctorDiagnosis(record.doctorDiagnosis || "");
      setTreatment(record.treatment || "");
      setPrescription(record.prescription || "");
      setIsEditing(false);
    }
  }, [record]);

  const handleSave = () => {
    if (!doctorDiagnosis.trim()) {
      toast.error("Vui lòng nhập chẩn đoán");
      return;
    }

    runSubmit(async () => {
      setSubmitting(true);
      try {
        const form = {
          appointmentId: record.appointmentId,
          doctorDiagnosis: doctorDiagnosis.trim(),
          treatment: treatment.trim() || "",
          prescription: prescription.trim() || "",
        };
        await updateMedicalRecordService(record.medicalRecordId, form);
        toast.success("Cập nhật hồ sơ bệnh án thành công");
        setIsEditing(false);
        if (onRecordUpdated) onRecordUpdated();
      } catch (e) {
        toast.error(e?.message || "Cập nhật thất bại");
      } finally {
        setSubmitting(false);
      }
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setDoctorDiagnosis(record?.doctorDiagnosis || "");
    setTreatment(record?.treatment || "");
    setPrescription(record?.prescription || "");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết hồ sơ bệnh án" size="lg">
      <div className="medical-record-detail">
        <div className="medical-record-info-grid">
          <div className="medical-record-info-item">
            <span className="info-label">Mã lịch hẹn</span>
            <span className="info-value">#{record?.appointmentId}</span>
          </div>
          <div className="medical-record-info-item">
            <span className="info-label">Ngày khám</span>
            <span className="info-value">{record?.appointmentTimeText || "-"}</span>
          </div>
          {isDoctor ? (
            <div className="medical-record-info-item">
              <span className="info-label">Bệnh nhân</span>
              <span className="info-value">{record?.patientName || "-"}</span>
            </div>
          ) : (
            <div className="medical-record-info-item">
              <span className="info-label">Bác sĩ</span>
              <span className="info-value">{record?.doctorName || "-"}</span>
            </div>
          )}
          <div className="medical-record-info-item">
            <span className="info-label">Khoa</span>
            <span className="info-value">{record?.departmentName || "-"}</span>
          </div>
        </div>

        <div className="medical-record-form-section">
          <h4 className="section-title">Thông tin y tế</h4>

          <div className="form-group">
            <label className="form-label">Chẩn đoán</label>
            {isEditing || isDoctor ? (
              <textarea
                className="form-textarea"
                value={doctorDiagnosis}
                onChange={(e) => setDoctorDiagnosis(e.target.value)}
                placeholder="Nhập chẩn đoán..."
                rows={3}
              />
            ) : (
              <div className="medical-record-text">
                {record?.doctorDiagnosis || "-"}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Phương pháp điều trị</label>
            {isEditing || isDoctor ? (
              <textarea
                className="form-textarea"
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                placeholder="Nhập phương pháp điều trị..."
                rows={3}
              />
            ) : (
              <div className="medical-record-text">
                {record?.treatment || "-"}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Đơn thuốc</label>
            {isEditing || isDoctor ? (
              <textarea
                className="form-textarea"
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                placeholder="Nhập đơn thuốc..."
                rows={3}
              />
            ) : (
              <div className="medical-record-text">
                {record?.prescription || "-"}
              </div>
            )}
          </div>
        </div>

        <div className="detail-actions">
          {isDoctor && (
            <>
              {isEditing ? (
                <>
                  <button
                    className="btn"
                    onClick={handleSave}
                    disabled={submitting || submitLocked}
                  >
                    {submitting || submitLocked ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                  <button
                    className="btn secondary"
                    onClick={handleCancel}
                    disabled={submitting}
                  >
                    Hủy
                  </button>
                </>
              ) : (
                <button
                  className="btn"
                  onClick={() => setIsEditing(true)}
                >
                  Sửa hồ sơ
                </button>
              )}
            </>
          )}
          <button className="btn secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
}
