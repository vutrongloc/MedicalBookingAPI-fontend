import { useEffect, useState, useMemo } from "react";
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
import SearchBar from "../components/common/SearchBar";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { useCooldown } from "../hooks/useCooldown";
import dayjs from "dayjs";

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "Pending", label: "Chờ xác nhận" },
  { value: "Confirmed", label: "Đã xác nhận" },
  { value: "Completed", label: "Hoàn thành" },
  { value: "Cancelled", label: "Đã hủy" },
];

const ALL_TIME_SLOTS = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"];

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
  const [error, setError] = useState("");
  const [allAppointments, setAllAppointments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [patientSearch, setPatientSearch] = useState("");

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
  const { isLocked: createCooldownLocked, run: runCreate } = useCooldown(3000);
  const { isLocked: bookCooldownLocked, run: runBook } = useCooldown(3000);
  const { isLocked: updateLocked, run: runUpdate } = useCooldown(3000);
  const [creatingAppointment, setCreatingAppointment] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);

  const availableTimeSlots = getAvailableTimeSlots(selectedDate);
  const todayStr = dayjs().format("YYYY-MM-DD");
  const PAGE_SIZE = 10;

  const loadCurrentUser = async () => {
    if (user?.role !== "Patient") return;
    try {
      const data = await getCurrentUserService();
      setCurrentUser(data);
    } catch {
      // ignore
    }
  };

  const loadAllAppointments = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyAppointmentsService(user?.role, {
        page: 1,
        pageSize: 1000,
      });
      setAllAppointments(data.items || []);
    } catch (e) {
      setError(e?.message || "Không thể tải lịch hẹn");
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [doctorList, departmentList] = await Promise.all([
        getDoctorsService({ page: 1, pageSize: 1000 }),
        getDepartmentsService({ page: 1, pageSize: 1000 }),
      ]);
      setDoctors(doctorList.items || doctorList);
      setDepartments(departmentList.items || departmentList);
    } catch {
      // Silently fail
    }
  };

  const filteredAppointments = useMemo(() => {
    const searchLower = (patientSearch || "").toLowerCase().trim();
    return allAppointments.filter((a) => {
      const matchesStatus = !statusFilter || a.status === statusFilter;
      const matchesDate = !dateFilter || (a.appointmentDate || a.appointmentTime || "").startsWith(dateFilter);
      let matchesSearch = true;
      if (searchLower) {
        if (user?.role === "Patient") {
          matchesSearch = [(a.doctorName || ""), (a.departmentName || "")]
            .some((field) => field.toLowerCase().includes(searchLower));
        } else {
          matchesSearch = (a.patientName || "").toLowerCase().includes(searchLower);
        }
      }
      return matchesStatus && matchesDate && matchesSearch;
    });
  }, [allAppointments, patientSearch, statusFilter, dateFilter, user?.role]);

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / PAGE_SIZE));

  const displayedAppointments = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAppointments.slice(start, start + PAGE_SIZE);
  }, [filteredAppointments, currentPage]);

  useEffect(() => {
    loadCurrentUser();
    loadAllAppointments();
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [patientSearch, statusFilter, dateFilter]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  useEffect(() => {
    if (initialDoctorId) {
      const doctor = doctors.find((d) => `${d.doctorId}` === `${initialDoctorId}`);
      if (doctor) {
        setSelectedDepartmentId(`${doctor.departmentId}`);
        setSelectedDoctorId(`${initialDoctorId}`);
      }
    }
  }, [initialDoctorId, doctors]);

  const filteredDoctors = useMemo(() => {
    return selectedDepartmentId
      ? doctors.filter((d) => `${d.departmentId}` === `${selectedDepartmentId}`)
      : doctors;
  }, [doctors, selectedDepartmentId]);

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
    runBook(() => setShowConfirm(true));
  };

  const handleCreate = () => {
    runCreate(async () => {
      setCreatingAppointment(true);
      try {
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
        await loadAllAppointments();
      } catch (e) {
        toast.error(e?.message || "Tạo lịch hẹn thất bại");
      } finally {
        setCreatingAppointment(false);
      }
    });
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

  const handleStatusUpdate = (appointmentId, newStatus) => {
    runUpdate(async () => {
      try {
        await updateAppointmentStatusService(appointmentId, newStatus);
        toast.success("Cập nhật trạng thái thành công");
        setShowDetailModal(false);
        await loadAllAppointments();
      } catch (e) {
        toast.error(e?.message || "Cập nhật thất bại");
      }
    });
  };

  const handleCancel = (appointmentId) => {
    runUpdate(async () => {
      try {
        await cancelAppointmentService(appointmentId);
        toast.success("Hủy lịch hẹn thành công");
        setShowDetailModal(false);
        setConfirmAction(null);
        await loadAllAppointments();
      } catch (e) {
        toast.error(e?.message || "Hủy lịch hẹn thất bại");
      }
    });
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
                Thời gian: {selectedDate ? dayjs(selectedDate).format("DD/MM/YYYY") : "-"} - {selectedTime || "-"}
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
              <button
                className="btn register-btn"
                onClick={handleCreate}
                disabled={creatingAppointment || createCooldownLocked || bookCooldownLocked}
              >
                {creatingAppointment || createCooldownLocked || bookCooldownLocked ? "Đang lưu..." : "Xác nhận đặt lịch"}
              </button>
              <button
                className="btn secondary"
                onClick={() => setShowConfirm(false)}
                disabled={creatingAppointment || createCooldownLocked}
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
                  style={{ marginTop: 8 }}
                >
                  <option value="">-- Chọn bác sĩ --</option>
                  {filteredDoctors.map((d) => (
                    <option key={d.doctorId} value={d.doctorId}>
                      {d.fullName} - {d.departmentName}
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
                <input
                  type="date"
                  className="booking-date booking-select"
                  value={selectedDate}
                  min={todayStr}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedTime("");
                  }}
                />

                <label className="booking-label">CHỌN GIỜ</label>
                {selectedDate ? (
                  availableTimeSlots.length > 0 ? (
                    <div className="booking-time-list">
                      {availableTimeSlots.map((slot) => {
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
              <button
                className="btn booking-save-btn"
                type="button"
                onClick={handleOpenConfirm}
                disabled={bookCooldownLocked}
              >
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
            placeholder={user?.role === "Patient" ? "Tìm bác sĩ, khoa..." : "Tìm tên bệnh nhân..."}
            value={patientSearch}
            onChange={setPatientSearch}
            onClear={() => setPatientSearch("")}
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
                <th>STT</th>
                {user?.role !== "Patient" && <th>Bệnh nhân</th>}
                {user?.role === "Patient" && <th>Bác sĩ</th>}
                <th>Khoa</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {displayedAppointments.map((a, index) => (
                <tr key={a.appointmentId} onClick={() => handleRowClick(a)} style={{ cursor: "pointer" }}>
                  <td>{index + 1 + (currentPage - 1) * PAGE_SIZE}</td>
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

      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          userRole={user?.role}
          currentUserName={currentUser?.fullName}
          onStatusUpdate={handleStatusUpdate}
          onCancel={handleCancel}
          updateLocked={updateLocked}
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

function AppointmentDetailModal({ appointment, isOpen, onClose, userRole, currentUserName, onStatusUpdate, onCancel, updateLocked }) {
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
              disabled={updateLocked}
            >
              {updateLocked ? "Đang hủy..." : "Hủy lịch hẹn"}
            </button>
          )}

          {isDoctor && isPending && (
            <button
              className="btn"
              onClick={() => onStatusUpdate(appointment.appointmentId, "Confirmed")}
              disabled={updateLocked}
            >
              {updateLocked ? "Đang xử lý..." : "Xác nhận"}
            </button>
          )}

          {isDoctor && isConfirmed && (
            <>
              <button
                className="btn"
                onClick={() => onStatusUpdate(appointment.appointmentId, "Completed")}
                disabled={updateLocked}
              >
                {updateLocked ? "Đang xử lý..." : "Hoàn thành"}
              </button>
              <button
                className="btn secondary"
                onClick={() => onStatusUpdate(appointment.appointmentId, "Cancelled")}
                disabled={updateLocked}
              >
                {updateLocked ? "Đang xử lý..." : "Từ chối"}
              </button>
            </>
          )}

          <button className="btn secondary" onClick={onClose} disabled={updateLocked}>
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
}
