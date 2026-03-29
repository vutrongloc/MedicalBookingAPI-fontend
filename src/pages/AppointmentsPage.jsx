import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import PageState from "../components/common/PageState";
import { useAuth } from "../hooks/useAuth";
import {
  createAppointmentService,
  getMyAppointmentsService,
  updateAppointmentStatusService,
  cancelAppointmentService,
  getAppointmentByIdService,
} from "../api/services/appointmentService";
import { getDoctorsService } from "../api/services/doctorService";
import { getDepartmentsService } from "../api/services/departmentService";
import { getCurrentUserService } from "../api/services/userService";
import Modal from "../components/common/Modal";
import StatusBadge from "../components/common/StatusBadge";
import Pagination from "../components/common/Pagination";
import SearchBar from "../components/common/SearchBar";
import ConfirmDialog from "../components/common/ConfirmDialog";
import dayjs from "dayjs";

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "Pending", label: "Chờ xác nhận" },
  { value: "Confirmed", label: "Đã xác nhận" },
  { value: "Completed", label: "Hoàn thành" },
  { value: "Cancelled", label: "Đã hủy" },
];

const ALL_TIME_SLOTS = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"];

function generateNext30Days() {
  const days = [];
  for (let i = 0; i < 30; i++) {
    const date = dayjs().add(i, "day");
    const dayOfWeek = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"][date.day()];
    days.push({
      value: date.format("YYYY-MM-DD"),
      label: `Thứ ${dayOfWeek.slice(3)}, ${date.format("DD/MM/YYYY")}`,
    });
  }
  return days;
}

function getAvailableTimeSlots(selectedDate) {
  const now = dayjs();
  const selected = dayjs(selectedDate);
  const isToday = selected.isSame(now, "day");

  if (isToday) {
    const currentHour = now.hour();
    const currentMinute = now.minute();
    const cutoffMinutes = currentHour * 60 + currentMinute + 60;
    return ALL_TIME_SLOTS.filter((slot) => {
      const [h, m] = slot.split(":").map(Number);
      return h * 60 + m >= cutoffMinutes;
    });
  }
  return ALL_TIME_SLOTS;
}

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialDoctorId = searchParams.get("doctorId") || "";

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState(initialDoctorId);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);

  const dateOptions = generateNext30Days();
  const availableTimeSlots = getAvailableTimeSlots(selectedDate);

  const loadCurrentUser = async () => {
    if (user?.role !== "Patient") return;
    try {
      const data = await getCurrentUserService();
      setCurrentUser(data);
    } catch {
      // ignore
    }
  };

  const loadAppointments = async (page = 1, status = statusFilter, date = dateFilter) => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyAppointmentsService(user?.role, {
        page,
        pageSize: 10,
        status: status || undefined,
        fromDate: date || undefined,
      });
      setAppointments(data.items);
      setTotalPages(data.totalPages);
      setCurrentPage(data.page);
    } catch (e) {
      setError(e?.message || "Không thể tải lịch hẹn");
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [doctorList, departmentList] = await Promise.all([
        getDoctorsService(),
        getDepartmentsService(),
      ]);
      setDoctors(doctorList.items || doctorList);
      setDepartments(departmentList.items || departmentList);
    } catch {
      // Silently fail
    }
  };

  useEffect(() => {
    loadCurrentUser();
    loadAppointments(1);
    loadData();
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      loadAppointments(1, statusFilter, dateFilter);
    }, 300);
    return () => clearTimeout(delay);
  }, [statusFilter, dateFilter]);

  useEffect(() => {
    if (initialDoctorId) {
      const doctor = doctors.find((d) => `${d.doctorId}` === `${initialDoctorId}`);
      if (doctor) {
        setSelectedDepartmentId(`${doctor.departmentId}`);
        setSelectedDoctorId(`${initialDoctorId}`);
      }
    }
  }, [initialDoctorId, doctors]);

  const filteredDoctors = selectedDepartmentId
    ? doctors.filter((d) => `${d.departmentId}` === `${selectedDepartmentId}`)
    : doctors;

  const selectedDepartment = departments.find(
    (d) => `${d.departmentId}` === `${selectedDepartmentId}`
  );
  const selectedDoctor = doctors.find((d) => `${d.doctorId}` === `${selectedDoctorId}`);
  const appointmentDateTime =
    selectedDate && selectedTime ? `${selectedDate}T${selectedTime}` : "";

  const handleOpenConfirm = () => {
    if (!selectedDoctorId || !selectedDate || !selectedTime) {
      toast.error("Vui lòng chọn đầy đủ chuyên khoa, bác sĩ, ngày và giờ khám");
      return;
    }
    const selectedDateTime = dayjs(`${selectedDate}T${selectedTime}`);
    if (selectedDateTime.isBefore(dayjs())) {
      toast.error("Không thể đặt lịch khám trong quá khứ");
      return;
    }
    setShowConfirm(true);
  };

  const handleCreate = async () => {
    try {
      setCreating(true);
      await createAppointmentService({
        doctorId: selectedDoctorId,
        appointmentTime: appointmentDateTime,
      });
      toast.success("Tạo lịch hẹn thành công");
      setShowConfirm(false);
      setSelectedDepartmentId("");
      setSelectedDoctorId("");
      setSelectedDate("");
      setSelectedTime("");
      setSymptoms("");
      await loadAppointments(1);
    } catch (e) {
      toast.error(e?.message || "Tạo lịch hẹn thất bại");
    } finally {
      setCreating(false);
    }
  };

  const handleRowClick = async (appointment) => {
    try {
      const fullAppointment = await getAppointmentByIdService(appointment.appointmentId);
      setSelectedAppointment(fullAppointment);
    } catch {
      setSelectedAppointment(appointment);
    }
    setShowDetailModal(true);
  };

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    setUpdating(true);
    try {
      await updateAppointmentStatusService(appointmentId, newStatus);
      toast.success("Cập nhật trạng thái thành công");
      setShowDetailModal(false);
      await loadAppointments(currentPage);
    } catch (e) {
      toast.error(e?.message || "Cập nhật thất bại");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async (appointmentId) => {
    try {
      await cancelAppointmentService(appointmentId);
      toast.success("Hủy lịch hẹn thành công");
      setShowDetailModal(false);
      setConfirmAction(null);
      await loadAppointments(currentPage);
    } catch (e) {
      toast.error(e?.message || "Hủy lịch hẹn thất bại");
    }
  };

  const displayedAppointments = searchTerm
    ? appointments.filter((a) =>
        (a.patientName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.doctorName || "").toLowerCase().includes(searchTerm.toLowerCase())
      )
    : appointments;

  const getPatientDisplayName = (appointment) => {
    if (user?.role === "Patient") return currentUser?.fullName || "Bạn";
    return appointment.patientName || "-";
  };

  return (
    <>
      {user?.role === "Patient" && (
        showConfirm ? (
          <div className="card booking-confirm-card">
            <h2 className="booking-title">THÔNG TIN LỊCH KHÁM</h2>
            <div className="booking-summary">
              <p>Chuyên khoa: {selectedDepartment?.departmentName || "-"}</p>
              <p>Bác sĩ: {selectedDoctor?.fullName || "-"}</p>
              <p>
                Thời gian: {selectedDate ? dateOptions.find(d => d.value === selectedDate)?.label.split(", ")[1] || selectedDate : "-"} - {selectedTime || "-"}
              </p>
            </div>

            <h3 className="booking-subtitle">TRIỆU CHỨNG</h3>
            <textarea
              className="booking-textarea"
              placeholder="Mô tả triệu chứng của bạn"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />
            <p className="booking-note">
              Kết quả chẩn đoán AI: (nếu bệnh nhân sử dụng chẩn đoán AI trước đó thì bỏ qua)
            </p>

            <div className="booking-confirm-actions">
              <button className="btn register-btn" onClick={handleCreate} disabled={creating}>
                {creating ? "Đang xác nhận..." : "Xác nhận đặt lịch"}
              </button>
              <button
                className="btn secondary"
                onClick={() => setShowConfirm(false)}
                disabled={creating}
              >
                Hủy
              </button>
            </div>
          </div>
        ) : (
          <div className="card booking-card">
            <h2 className="booking-title">Đặt lịch khám</h2>
            <div className="booking-grid">
              <div className="booking-left">
                <label className="booking-label">CHỌN CHUYÊN KHOA</label>
                <select
                  className="booking-select"
                  value={selectedDepartmentId}
                  onChange={(e) => {
                    setSelectedDepartmentId(e.target.value);
                    setSelectedDoctorId("");
                  }}
                >
                  <option value="">-- Chọn chuyên khoa --</option>
                  {departments.map((d) => (
                    <option key={d.departmentId} value={d.departmentId}>
                      {d.departmentName}
                    </option>
                  ))}
                </select>

                <label className="booking-label">CHỌN BÁC SĨ</label>
                <select
                  className="booking-select"
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                >
                  <option value="">-- Chọn bác sĩ --</option>
                  {filteredDoctors.map((d) => (
                    <option key={d.doctorId} value={d.doctorId}>
                      {d.fullName}
                    </option>
                  ))}
                </select>

                <label className="booking-label">THÔNG TIN BÁC SĨ</label>
                <div className="booking-doctor-card">
                  <div className="booking-doctor-head">
                    <strong>{selectedDoctor?.fullName || "BS. Chưa chọn"}</strong>
                    <span>{selectedDoctor?.departmentName || "Khoa"}</span>
                  </div>
                  <div className="booking-doctor-body">
                    {selectedDoctor?.qualification || "Thông tin chi tiết"}
                  </div>
                </div>
              </div>

              <div className="booking-right">
                <label className="booking-label">CHỌN NGÀY</label>
                <select
                  className="booking-select"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedTime("");
                  }}
                >
                  <option value="">-- Chọn ngày khám --</option>
                  {dateOptions.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>

                <label className="booking-label">CHỌN GIỜ</label>
                {selectedDate ? (
                  availableTimeSlots.length > 0 ? (
                    <div className="booking-time-list">
                      {availableTimeSlots.map((slot) => {
                        const endMinute = slot.split(":")[1] === "30" ? "00" : "30";
                        const endHour = slot.split(":")[1] === "30" ? String(Number(slot.split(":")[0]) + 1) : slot.split(":")[0];
                        const endTime = `${endHour.padStart(2, "0")}:${endMinute}${slot.split(":")[1] === "30" ? "" : "30"}`;
                        const active = slot === selectedTime;
                        return (
                          <button
                            key={slot}
                            type="button"
                            className={active ? "booking-time active" : "booking-time"}
                            onClick={() => setSelectedTime(slot)}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="booking-no-slots">Không có giờ khám trong ngày này</p>
                  )
                ) : (
                  <p className="booking-hint">Vui lòng chọn ngày khám trước</p>
                )}
              </div>
            </div>

            <div className="booking-save-wrap">
              <button className="btn booking-save-btn" onClick={handleOpenConfirm}>
                Lưu lịch khám
              </button>
            </div>
          </div>
        )
      )}

      <div className="card">
        <div className="table-toolbar">
          <h2>Lịch hẹn</h2>
        </div>

        <div className="table-toolbar-filters">
          <SearchBar
            placeholder="Tìm bác sĩ, bệnh nhân..."
            value={searchTerm}
            onChange={setSearchTerm}
            onClear={() => setSearchTerm("")}
          />
          <select
            className="table-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <input
            type="date"
            className="table-filter-date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            placeholder="Lọc theo ngày"
          />
        </div>

        <PageState
          loading={loading}
          error={error}
          empty={!displayedAppointments.length}
          emptyText="Chưa có lịch hẹn"
        >
          <table className="table table-clickable">
            <thead>
              <tr>
                <th>ID</th>
                {user?.role !== "Patient" && <th>Bệnh nhân</th>}
                {user?.role === "Patient" && <th>Bác sĩ</th>}
                <th>Khoa</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {displayedAppointments.map((a) => (
                <tr key={a.appointmentId} onClick={() => handleRowClick(a)} style={{ cursor: "pointer" }}>
                  <td>{a.appointmentId}</td>
                  {user?.role === "Patient" ? (
                    <td>{a.doctorName || "-"}</td>
                  ) : (
                    <td>{a.patientName || "-"}</td>
                  )}
                  <td>{a.departmentName || "-"}</td>
                  <td>{a.appointmentTimeText}</td>
                  <td><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!searchTerm && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => loadAppointments(p)}
            />
          )}
        </PageState>
      </div>

      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          userRole={user?.role}
          currentUserName={currentUser?.fullName}
          onStatusUpdate={handleStatusUpdate}
          onCancel={handleCancel}
          updating={updating}
        />
      )}

      {confirmAction && (
        <ConfirmDialog
          message={confirmAction.message}
          confirmText={confirmAction.confirmText}
          cancelText="Hủy"
          variant={confirmAction.variant || "warning"}
          onConfirm={confirmAction.onConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </>
  );
}

function AppointmentDetailModal({ appointment, isOpen, onClose, userRole, currentUserName, onStatusUpdate, onCancel, updating }) {
  const isPending = appointment.status === "Pending";
  const isConfirmed = appointment.status === "Confirmed";
  const isCompleted = appointment.status === "Completed";
  const isCancelled = appointment.status === "Cancelled";
  const isPatient = userRole === "Patient";
  const isDoctor = userRole === "Doctor";

  const patientName = isPatient ? (currentUserName || "Bạn") : (appointment.patientName || "-");

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết lịch hẹn" size="md">
      <div className="appointment-detail">
        <div className="detail-row">
          <span className="detail-label">ID</span>
          <span className="detail-value">#{appointment.appointmentId}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Bệnh nhân</span>
          <span className="detail-value">{patientName}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Bác sĩ</span>
          <span className="detail-value">{appointment.doctorName || "-"}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Khoa</span>
          <span className="detail-value">{appointment.departmentName || "-"}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Thời gian</span>
          <span className="detail-value">{appointment.appointmentTimeText}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Trạng thái</span>
          <span className="detail-value"><StatusBadge status={appointment.status} /></span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Ngày tạo</span>
          <span className="detail-value">{appointment.createdAtText}</span>
        </div>

        <div className="detail-actions">
          {isPatient && !isCancelled && !isCompleted && (
            <button
              className="btn secondary"
              onClick={() => onCancel(appointment.appointmentId)}
              disabled={updating}
            >
              Hủy lịch hẹn
            </button>
          )}

          {isDoctor && isPending && (
            <button
              className="btn"
              onClick={() => onStatusUpdate(appointment.appointmentId, "Confirmed")}
              disabled={updating}
            >
              Xác nhận
            </button>
          )}

          {isDoctor && isConfirmed && (
            <>
              <button
                className="btn"
                onClick={() => onStatusUpdate(appointment.appointmentId, "Completed")}
                disabled={updating}
              >
                Hoàn thành
              </button>
              <button
                className="btn secondary"
                onClick={() => onStatusUpdate(appointment.appointmentId, "Cancelled")}
                disabled={updating}
              >
                Từ chối
              </button>
            </>
          )}

          {isDoctor && isCompleted && (
            <button
              className="btn"
              onClick={() => {
                onClose();
                window.location.href = "/medical-records";
              }}
            >
              Tạo bệnh án
            </button>
          )}

          <button className="btn secondary" onClick={onClose} disabled={updating}>
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
}
