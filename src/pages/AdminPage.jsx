import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getAllUsersService, deleteUserService } from "../api/services/userService";
import { getDoctorsService } from "../api/services/doctorService";
import { getDepartmentsService } from "../api/services/departmentService";
import {
  createDepartmentService,
  updateDepartmentService,
  deleteDepartmentService,
} from "../api/services/adminDepartmentService";
import {
  createDoctorService,
  updateDoctorService,
  assignDoctorDepartmentService,
} from "../api/services/adminDoctorService";
import {
  getAllAppointmentsService,
  updateAppointmentStatusService,
  cancelAppointmentService,
} from "../api/services/adminAppointmentService";
import PageState from "../components/common/PageState";
import Pagination from "../components/common/Pagination";
import SearchBar from "../components/common/SearchBar";
import ConfirmDialog from "../components/common/ConfirmDialog";
import StatusBadge from "../components/common/StatusBadge";
import DepartmentFormModal from "../components/admin/DepartmentFormModal";
import DoctorFormModal from "../components/admin/DoctorFormModal";
import AdminFormModal from "../components/admin/AdminFormModal";
import AppointmentDetailModal from "../components/admin/AppointmentDetailModal";
import { useCooldown } from "../hooks/useCooldown";

const TABS = [
  { key: "users", label: "Người dùng", icon: "👥" },
  { key: "doctors", label: "Bác sĩ", icon: "👨‍⚕️" },
  { key: "departments", label: "Khoa", icon: "🏥" },
  { key: "appointments", label: "Lịch hẹn", icon: "📅" },
];

const PAGE_SIZE = 5;

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div className="admin-page">
      <div className="admin-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`admin-tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="admin-tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "users" && <UsersTab />}
      {activeTab === "doctors" && <DoctorsTab />}
      {activeTab === "departments" && <DepartmentsTab />}
      {activeTab === "appointments" && <AppointmentsTab />}
    </div>
  );
}

function UsersTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [allItems, setAllItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const { isLocked: actionLocked, run: runAction } = useCooldown(3000);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllUsersService({});
      setAllItems(data.items);
    } catch (e) {
      setError(e?.message || "Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredItems = allItems.filter(u => {
    const matchSearch = !search ||
      (u.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const totalPages = Math.ceil(filteredItems.length / PAGE_SIZE);
  const displayedItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleRoleChange = (value) => {
    setRoleFilter(value);
    setCurrentPage(1);
  };

  const handleDelete = () => {
    if (!deletingUser) return;
    runAction(async () => {
      try {
        await deleteUserService(deletingUser.userId);
        toast.success("Xóa người dùng thành công");
        setShowDeleteConfirm(false);
        setDeletingUser(null);
        await load();
      } catch {
        toast.error("Tài khoản không thể xóa");
      }
    });
  };

  return (
    <div className="admin-panel card">
      <div className="table-toolbar">
        <h3>Quản lý người dùng</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="table-count">Tổng: {filteredItems.length} người dùng</span>
          <button
            className="btn"
            onClick={() => setShowAdminModal(true)}
            disabled={actionLocked}
          >
            + Tạo Admin mới
          </button>
        </div>
      </div>

      <div className="table-toolbar-filters">
        <SearchBar placeholder="Tìm tên, email..." value={search} onChange={handleSearchChange} onClear={() => handleSearchChange("")} />
        <select className="table-filter-select" value={roleFilter} onChange={(e) => handleRoleChange(e.target.value)}>
          <option value="">Tất cả vai trò</option>
          <option value="Admin">Admin</option>
          <option value="Doctor">Doctor</option>
          <option value="Patient">Patient</option>
        </select>
      </div>

      <PageState variant="inline" loading={loading} error={error} empty={!loading && !error && !filteredItems.length} emptyText="Chưa có người dùng">
        <table className="table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Điện thoại</th>
              <th>Vai trò</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {displayedItems.map((u, index) => (
              <tr key={u.userId}>
                <td>{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                <td>{u.fullName}</td>
                <td>{u.email}</td>
                <td>{u.phone || "-"}</td>
                <td><span className={`role-badge role-badge--${u.role?.toLowerCase()}`}>{u.role}</span></td>
                <td>
                <button
                  className="btn btn-sm danger"
                  onClick={() => { setDeletingUser(u); setShowDeleteConfirm(true); }}
                  disabled={actionLocked}
                >
                  Xóa
                </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
      </PageState>

      {showDeleteConfirm && deletingUser && (
        <ConfirmDialog
          message={`Bạn có chắc muốn xóa người dùng "${deletingUser.fullName}" không?`}
          confirmText="Xóa"
          cancelText="Hủy"
          variant="danger"
          disabled={actionLocked}
          onConfirm={handleDelete}
          onCancel={() => { setShowDeleteConfirm(false); setDeletingUser(null); }}
        />
      )}

      {showAdminModal && (
        <AdminFormModal
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
          onSuccess={load}
        />
      )}
    </div>
  );
}

function DoctorsTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [allItems, setAllItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const { isLocked: actionLocked, run: runAction } = useCooldown(3000);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [data, deptData] = await Promise.all([
        getDoctorsService({ pageSize: 1000 }),
        getDepartmentsService(),
      ]);
      setAllItems(data.items);
      setDepartments(deptData.items || deptData);
    } catch (e) {
      setError(e?.message || "Không thể tải danh sách bác sĩ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredItems = allItems.filter(d => {
    const matchSearch = !search ||
      (d.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.email || "").toLowerCase().includes(search.toLowerCase());
    const matchDept = !deptFilter || String(d.departmentId) === String(deptFilter);
    return matchSearch && matchDept;
  });

  const totalPages = Math.ceil(filteredItems.length / PAGE_SIZE);
  const displayedItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleDeptChange = (value) => {
    setDeptFilter(value);
    setCurrentPage(1);
  };

  const handleCreate = async (formData) => {
    runAction(async () => {
      try {
        await createDoctorService(formData);
        toast.success("Thêm bác sĩ thành công");
        setShowModal(false);
        await load();
      } catch (e) {
        toast.error(e?.message || "Thêm bác sĩ thất bại");
        throw e;
      }
    });
  };

  const handleUpdate = async (formData) => {
    runAction(async () => {
      try {
        await updateDoctorService(editingDoctor.doctorId, formData);
        toast.success("Cập nhật bác sĩ thành công");
        setShowModal(false);
        setEditingDoctor(null);
        await load();
      } catch (e) {
        toast.error(e?.message || "Cập nhật thất bại");
        throw e;
      }
    });
  };

  const handleAssignDepartment = (doctorId, departmentId) => {
    runAction(async () => {
      try {
        await assignDoctorDepartmentService(doctorId, Number(departmentId) || null);
        toast.success("Phân công khoa thành công");
        await load();
      } catch (e) {
        toast.error(e?.message || "Phân công thất bại");
      }
    });
  };

  return (
    <div className="admin-panel card">
      <div className="table-toolbar">
        <h3>Quản lý bác sĩ</h3>
        <button
          className="btn"
          onClick={() => { setEditingDoctor(null); setShowModal(true); }}
          disabled={actionLocked}
        >
          + Thêm bác sĩ mới
        </button>
      </div>

      <div className="table-toolbar-filters">
        <SearchBar placeholder="Tìm tên bác sĩ..." value={search} onChange={handleSearchChange} onClear={() => handleSearchChange("")} />
        <select className="table-filter-select" value={deptFilter} onChange={(e) => handleDeptChange(e.target.value)}>
          <option value="">Tất cả khoa</option>
          {departments.map((d) => (
            <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>
          ))}
        </select>
      </div>

      <PageState variant="inline" loading={loading} error={error} empty={!loading && !error && !filteredItems.length} emptyText="Chưa có bác sĩ">
        <table className="table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Khoa</th>
              <th>Chuyên môn</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {displayedItems.map((d, index) => (
              <tr key={d.doctorId}>
                <td>{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                <td>{d.fullName}</td>
                <td>{d.email}</td>
                <td>{d.departmentName || "-"}</td>
                <td>{d.qualification || "-"}</td>
                <td>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    className="btn btn-sm"
                    onClick={() => { setEditingDoctor(d); setShowModal(true); }}
                    disabled={actionLocked}
                  >
                    Sửa
                  </button>
                    <select
                      className="table-filter-select"
                      value={d.departmentId || ""}
                      onChange={(e) => handleAssignDepartment(d.doctorId, e.target.value)}
                      disabled={actionLocked}
                      style={{ minWidth: 120 }}
                    >
                      <option value="">-- Khoa --</option>
                      {departments.map((dept) => (
                        <option key={dept.departmentId} value={dept.departmentId}>
                          {dept.departmentName}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
      </PageState>

      {showModal && (
        <DoctorFormModal
          isOpen={showModal}
          onClose={() => { setShowModal(false); setEditingDoctor(null); }}
          onSuccess={editingDoctor ? handleUpdate : handleCreate}
          doctor={editingDoctor}
          departments={departments}
        />
      )}
    </div>
  );
}

function DepartmentsTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [allItems, setAllItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingDept, setDeletingDept] = useState(null);
  const { isLocked: actionLocked, run: runAction } = useCooldown(3000);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getDepartmentsService({ pageSize: 1000 });
      setAllItems(data.items);
    } catch (e) {
      setError(e?.message || "Không thể tải danh sách khoa");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredItems = allItems.filter(d =>
    !search || (d.departmentName || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredItems.length / PAGE_SIZE);
  const displayedItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleCreate = async (formData) => {
    runAction(async () => {
      try {
        await createDepartmentService(formData);
        toast.success("Thêm khoa thành công");
        setShowModal(false);
        await load();
      } catch (e) {
        toast.error(e?.message || "Thêm khoa thất bại");
        throw e;
      }
    });
  };

  const handleUpdate = async (formData) => {
    runAction(async () => {
      try {
        await updateDepartmentService(editingDept.departmentId, formData);
        toast.success("Cập nhật khoa thành công");
        setShowModal(false);
        setEditingDept(null);
        await load();
      } catch (e) {
        toast.error(e?.message || "Cập nhật khoa thất bại");
        throw e;
      }
    });
  };

  const handleDelete = () => {
    if (!deletingDept) return;
    runAction(async () => {
      try {
        await deleteDepartmentService(deletingDept.departmentId);
        toast.success("Xóa khoa thành công");
        setShowDeleteConfirm(false);
        setDeletingDept(null);
        await load();
      } catch (e) {
        toast.error(e?.message || "Xóa khoa thất bại");
      }
    });
  };

  return (
    <div className="admin-panel card">
      <div className="table-toolbar">
        <h3>Quản lý khoa</h3>
        <button
          className="btn"
          onClick={() => { setEditingDept(null); setShowModal(true); }}
          disabled={actionLocked}
        >
          + Thêm khoa mới
        </button>
      </div>

      <div className="table-toolbar-filters">
        <SearchBar placeholder="Tìm tên khoa..." value={search} onChange={handleSearchChange} onClear={() => handleSearchChange("")} />
      </div>

      <PageState variant="inline" loading={loading} error={error} empty={!loading && !error && !filteredItems.length} emptyText="Chưa có khoa">
        <table className="table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên khoa</th>
              <th>Mô tả</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {displayedItems.map((d, index) => (
              <tr key={d.departmentId}>
                <td>{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                <td>{d.departmentName}</td>
                <td>{d.description || "-"}</td>
                <td>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn btn-sm"
                      onClick={() => { setEditingDept(d); setShowModal(true); }}
                      disabled={actionLocked}
                    >
                      Sửa
                    </button>
                    <button
                      className="btn btn-sm danger"
                      onClick={() => { setDeletingDept(d); setShowDeleteConfirm(true); }}
                      disabled={actionLocked}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
      </PageState>

      {showModal && (
        <DepartmentFormModal
          isOpen={showModal}
          onClose={() => { setShowModal(false); setEditingDept(null); }}
          onSuccess={editingDept ? handleUpdate : handleCreate}
          department={editingDept}
        />
      )}

      {showDeleteConfirm && deletingDept && (
        <ConfirmDialog
          message={`Bạn có chắc muốn xóa khoa "${deletingDept.departmentName}" không?`}
          confirmText="Xóa"
          cancelText="Hủy"
          variant="danger"
          disabled={actionLocked}
          onConfirm={handleDelete}
          onCancel={() => { setShowDeleteConfirm(false); setDeletingDept(null); }}
        />
      )}
    </div>
  );
}

function AppointmentsTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [allItems, setAllItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    status: "",
    doctorId: "",
  });
  const [doctors, setDoctors] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailAppointment, setDetailAppointment] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAppointment, setDeletingAppointment] = useState(null);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const { isLocked: actionLocked, run: runAction } = useCooldown(3000);

  const STATUS_LABELS = {
    Pending: "Chờ xác nhận",
    Confirmed: "Đã xác nhận",
    Completed: "Hoàn thành",
    Cancelled: "Đã hủy",
  };

  const STATUS_TRANSITIONS = {
    Pending: ["Confirmed", "Cancelled"],
    Confirmed: ["Completed", "Cancelled"],
    Completed: [],
    Cancelled: [],
  };

  const load = async (filterParams = filters) => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filterParams.fromDate) params.fromDate = filterParams.fromDate;
      if (filterParams.toDate) params.toDate = filterParams.toDate;
      if (filterParams.status) params.status = filterParams.status;
      if (filterParams.doctorId) params.doctorId = filterParams.doctorId;
      const [appointmentsData, doctorsData] = await Promise.all([
        getAllAppointmentsService(params),
        getDoctorsService({ pageSize: 1000 }),
      ]);
      setAllItems(appointmentsData);
      setDoctors(doctorsData.items || []);
    } catch (e) {
      setError(e?.message || "Không thể tải danh sách lịch hẹn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredItems = allItems.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (a.patientName || "").toLowerCase().includes(q) ||
      (a.patientEmail || "").toLowerCase().includes(q) ||
      (a.doctorName || "").toLowerCase().includes(q) ||
      (a.departmentName || "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredItems.length / PAGE_SIZE);
  const displayedItems = filteredItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleReload = () => {
    setFilters({ fromDate: "", toDate: "", status: "", doctorId: "" });
    setSearch("");
    setCurrentPage(1);
    load({ fromDate: "", toDate: "", status: "", doctorId: "" });
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    load(filters);
  };

  const handleViewDetail = (appointment) => {
    setDetailAppointment(appointment);
    setShowDetailModal(true);
  };

  const handleStatusChange = (appointmentId, newStatus) => {
    runAction(async () => {
      try {
        await updateAppointmentStatusService(appointmentId, newStatus);
        toast.success("Cập nhật trạng thái thành công");
        await load(filters);
      } catch (e) {
        toast.error(e?.message || "Cập nhật trạng thái thất bại");
      }
    });
  };

  const openStatusConfirm = (appointment, newStatus) => {
    const allowed = STATUS_TRANSITIONS[appointment.status] || [];
    if (allowed.length === 0) {
      toast.warning(`Lịch hẹn đang ở trạng thái "${STATUS_LABELS[appointment.status]}" và không thể thay đổi.`);
      return;
    }
    if (!allowed.includes(newStatus)) {
      toast.warning(`Không thể chuyển từ "${STATUS_LABELS[appointment.status]}" sang "${STATUS_LABELS[newStatus]}".`);
      return;
    }
    setPendingStatusChange({
      appointmentId: appointment.appointmentId,
      currentStatus: appointment.status,
      newStatus,
      appointmentCode: appointment.appointmentId,
    });
  };

  const confirmStatusChange = () => {
    if (!pendingStatusChange) return;
    runAction(async () => {
      try {
        await updateAppointmentStatusService(
          pendingStatusChange.appointmentId,
          pendingStatusChange.newStatus,
        );
        toast.success("Cập nhật trạng thái thành công");
        setPendingStatusChange(null);
        await load(filters);
      } catch (e) {
        toast.error(e?.message || "Cập nhật trạng thái thất bại");
      }
    });
  };

  const handleDeleteAppointment = () => {
    if (!deletingAppointment) return;
    runAction(async () => {
      try {
        await cancelAppointmentService(deletingAppointment.appointmentId);
        toast.success("Hủy lịch hẹn thành công");
        setShowDeleteConfirm(false);
        setDeletingAppointment(null);
        await load(filters);
      } catch (e) {
        toast.error(e?.message || "Hủy lịch hẹn thất bại");
      }
    });
  };

  const STATUS_OPTIONS = [
    { value: "", label: "Tất cả" },
    { value: "Pending", label: "Chờ xác nhận" },
    { value: "Confirmed", label: "Đã xác nhận" },
    { value: "Completed", label: "Hoàn thành" },
    { value: "Cancelled", label: "Đã hủy" },
  ];

  return (
    <div className="admin-panel card">
      <div className="table-toolbar">
        <h3>Quản lý lịch hẹn</h3>
        <span className="table-count">Tổng: {filteredItems.length} lịch hẹn</span>
      </div>

      <div className="admin-appointments-filters">
        <input
          type="date"
          className="table-filter-select"
          value={filters.fromDate}
          onChange={(e) => handleFilterChange("fromDate", e.target.value)}
          title="Từ ngày"
        />
        <input
          type="date"
          className="table-filter-select"
          value={filters.toDate}
          onChange={(e) => handleFilterChange("toDate", e.target.value)}
          title="Đến ngày"
        />
        <select
          className="table-filter-select"
          value={filters.status}
          onChange={(e) => handleFilterChange("status", e.target.value)}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          className="table-filter-select"
          value={filters.doctorId}
          onChange={(e) => handleFilterChange("doctorId", e.target.value)}
        >
          <option value="">Tất cả bác sĩ</option>
          {doctors.map((d) => (
            <option key={d.doctorId} value={d.doctorId}>{d.fullName}</option>
          ))}
        </select>
        <button
          className="btn"
          onClick={handleApplyFilters}
          disabled={loading}
        >
          Lọc
        </button>
        <button
          className="btn secondary"
          onClick={handleReload}
          disabled={loading}
        >
          Tải lại
        </button>
      </div>

      <PageState
        variant="inline"
        loading={loading}
        error={error}
        empty={!loading && !error && !filteredItems.length}
        emptyText="Chưa có lịch hẹn nào"
      >
        <table className="table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Bệnh nhân</th>
              <th>Bác sĩ</th>
              <th>Khoa</th>
              <th>Ngày giờ</th>
              <th>Trạng thái</th>
              <th>Hồ sơ YT</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {displayedItems.map((a, index) => (
              <tr key={a.appointmentId}>
                <td>{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                <td>
                  <div style={{ fontSize: 13 }}>
                    <div style={{ fontWeight: 500 }}>{a.patientName}</div>
                    <div style={{ color: "#6b7280", fontSize: 12 }}>{a.patientEmail}</div>
                  </div>
                </td>
                <td>{a.doctorName}</td>
                <td>{a.departmentName}</td>
                <td>
                  <div style={{ fontSize: 13 }}>
                    <div>{a.appointmentTimeText}</div>
                    <div style={{ color: "#6b7280", fontSize: 11 }}>{a.createdAtText}</div>
                  </div>
                </td>
                <td className="status-cell">
                  <StatusBadge status={a.status} />
                </td>
                <td style={{ textAlign: "center" }}>
                  {a.hasMedicalRecord ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  )}
                </td>
                <td>
                  <div className="appointment-actions">
                    <button
                      className="btn btn-sm"
                      onClick={() => handleViewDetail(a)}
                      title="Xem chi tiết"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </button>
                    <StatusBadge status={a.status} />
                    <select
                      className="table-filter-select"
                      value=""
                      onChange={(e) => openStatusConfirm(a, e.target.value)}
                      disabled={actionLocked || (STATUS_TRANSITIONS[a.status] || []).length === 0}
                      style={{ minWidth: 110, fontSize: 12 }}
                    >
                      <option value="" disabled>Đổi trạng thái...</option>
                      <option value="Pending">Chờ xác nhận</option>
                      <option value="Confirmed">Đã xác nhận</option>
                      <option value="Completed">Hoàn thành</option>
                      <option value="Cancelled">Đã hủy</option>
                    </select>
                    <button
                      className="btn btn-sm danger"
                      onClick={() => {
                        setDeletingAppointment(a);
                        setShowDeleteConfirm(true);
                      }}
                      disabled={actionLocked}
                      title="Hủy lịch hẹn"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </PageState>

      {showDetailModal && detailAppointment && (
        <AppointmentDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setDetailAppointment(null);
          }}
          appointmentId={detailAppointment.appointmentId}
        />
      )}

      {showDeleteConfirm && deletingAppointment && (
        <ConfirmDialog
          message={`Bạn có chắc muốn hủy lịch hẹn #${deletingAppointment.appointmentId} của "${deletingAppointment.patientName}" không?`}
          confirmText="Hủy lịch hẹn"
          cancelText="Hủy"
          variant="danger"
          disabled={actionLocked}
          onConfirm={handleDeleteAppointment}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setDeletingAppointment(null);
          }}
        />
      )}

      {pendingStatusChange && (
        <ConfirmDialog
          message={`Bạn có chắc muốn đổi lịch hẹn #${pendingStatusChange.appointmentCode} từ "${STATUS_LABELS[pendingStatusChange.currentStatus]}" sang "${STATUS_LABELS[pendingStatusChange.newStatus]}" không?`}
          confirmText="Xác nhận đổi trạng thái"
          cancelText="Hủy"
          variant="warning"
          disabled={actionLocked}
          onConfirm={confirmStatusChange}
          onCancel={() => setPendingStatusChange(null)}
        />
      )}
    </div>
  );
}
