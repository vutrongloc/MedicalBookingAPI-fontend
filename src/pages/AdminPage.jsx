import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getAllUsersService, deleteUserService } from "../api/services/userService";
import { getDoctorsService } from "../api/services/doctorService";
import { getDepartmentsService } from "../api/services/departmentService";
import { createDepartmentService, updateDepartmentService, deleteDepartmentService } from "../api/services/adminDepartmentService";
import { createDoctorService, updateDoctorService, assignDoctorDepartmentService } from "../api/services/adminDoctorService";
import PageState from "../components/common/PageState";
import Pagination from "../components/common/Pagination";
import SearchBar from "../components/common/SearchBar";
import ConfirmDialog from "../components/common/ConfirmDialog";
import DepartmentFormModal from "../components/admin/DepartmentFormModal";
import DoctorFormModal from "../components/admin/DoctorFormModal";
import { useCooldown } from "../hooks/useCooldown";

const TABS = [
  { key: "users", label: "Người dùng", icon: "👥" },
  { key: "doctors", label: "Bác sĩ", icon: "👨‍⚕️" },
  { key: "departments", label: "Khoa", icon: "🏥" },
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
        <span className="table-count">Tổng: {filteredItems.length} người dùng</span>
        <div className="table-toolbar-filters">
          <SearchBar placeholder="Tìm tên, email..." value={search} onChange={handleSearchChange} onClear={() => handleSearchChange("")} />
          <select className="table-filter-select" value={roleFilter} onChange={(e) => handleRoleChange(e.target.value)}>
            <option value="">Tất cả vai trò</option>
            <option value="Admin">Admin</option>
            <option value="Doctor">Doctor</option>
            <option value="Patient">Patient</option>
          </select>
        </div>
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
