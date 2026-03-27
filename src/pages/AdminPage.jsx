import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllUsersService } from "../api/services/userService";
import { getDoctorsService } from "../api/services/doctorService";
import { getDepartmentsService } from "../api/services/departmentService";
import { getAllAppointmentsService } from "../api/services/appointmentService";
import PageState from "../components/common/PageState";
import Pagination from "../components/common/Pagination";
import SearchBar from "../components/common/SearchBar";
import StatusBadge from "../components/common/StatusBadge";

const TABS = [
  { key: "users", label: "Người dùng", icon: "👥" },
  { key: "doctors", label: "Bác sĩ", icon: "👨‍⚕️" },
  { key: "departments", label: "Khoa", icon: "🏥" },
  { key: "appointments", label: "Lịch hẹn", icon: "📅" },
];

const PAGE_SIZE = 10;

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
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const load = async (page = 1, s = search, r = roleFilter) => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllUsersService({ page, pageSize: PAGE_SIZE, search: s, role: r });
      setItems(data.items);
      setTotalPages(data.totalPages);
      setCurrentPage(data.page);
    } catch (e) {
      setError(e?.message || "Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(1, search, roleFilter), 300);
    return () => clearTimeout(t);
  }, [search, roleFilter]);

  return (
    <div className="admin-panel card">
      <div className="table-toolbar">
        <h3>Quản lý người dùng</h3>
        <div className="table-toolbar-filters">
          <SearchBar placeholder="Tìm tên, email..." value={search} onChange={setSearch} onClear={() => setSearch("")} />
          <select className="table-filter-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">Tất cả vai trò</option>
            <option value="Admin">Admin</option>
            <option value="Doctor">Doctor</option>
            <option value="Patient">Patient</option>
          </select>
        </div>
      </div>

      <PageState loading={loading} error={error} empty={!items.length} emptyText="Chưa có người dùng">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Điện thoại</th>
              <th>Vai trò</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.userId}>
                <td>{u.userId}</td>
                <td>{u.fullName}</td>
                <td>{u.email}</td>
                <td>{u.phone || "-"}</td>
                <td><span className={`role-badge role-badge--${u.role?.toLowerCase()}`}>{u.role}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => load(p)} />
      </PageState>
    </div>
  );
}

function DoctorsTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [departments, setDepartments] = useState([]);

  const load = async (page = 1, s = search, d = deptFilter) => {
    setLoading(true);
    setError("");
    try {
      const [data, deptData] = await Promise.all([
        getDoctorsService({ page, pageSize: PAGE_SIZE, search: s, departmentId: d || undefined }),
        getDepartmentsService(),
      ]);
      setItems(data.items);
      setTotalPages(data.totalPages);
      setCurrentPage(data.page);
      setDepartments(deptData.items || deptData);
    } catch (e) {
      setError(e?.message || "Không thể tải danh sách bác sĩ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(1, search, deptFilter), 300);
    return () => clearTimeout(t);
  }, [search, deptFilter]);

  return (
    <div className="admin-panel card">
      <div className="table-toolbar">
        <h3>Quản lý bác sĩ</h3>
        <div className="table-toolbar-filters">
          <SearchBar placeholder="Tìm tên bác sĩ..." value={search} onChange={setSearch} onClear={() => setSearch("")} />
          <select className="table-filter-select" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="">Tất cả khoa</option>
            {(departments).map((d) => (
              <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>
            ))}
          </select>
        </div>
      </div>

      <PageState loading={loading} error={error} empty={!items.length} emptyText="Chưa có bác sĩ">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Khoa</th>
              <th>Chuyên môn</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.doctorId}>
                <td>{d.doctorId}</td>
                <td>{d.fullName}</td>
                <td>{d.email}</td>
                <td>{d.departmentName}</td>
                <td>{d.qualification || "-"}</td>
                <td>
                  <Link to={`/doctors/${d.doctorId}`} className="btn btn-sm">Chi tiết</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => load(p)} />
      </PageState>
    </div>
  );
}

function DepartmentsTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");

  const load = async (page = 1, s = search) => {
    setLoading(true);
    setError("");
    try {
      const data = await getDepartmentsService({ page, pageSize: PAGE_SIZE, search: s });
      setItems(data.items);
      setTotalPages(data.totalPages);
      setCurrentPage(data.page);
    } catch (e) {
      setError(e?.message || "Không thể tải danh sách khoa");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(1, search), 300);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="admin-panel card">
      <div className="table-toolbar">
        <h3>Quản lý khoa</h3>
        <div className="table-toolbar-filters">
          <SearchBar placeholder="Tìm tên khoa..." value={search} onChange={setSearch} onClear={() => setSearch("")} />
        </div>
      </div>

      <PageState loading={loading} error={error} empty={!items.length} emptyText="Chưa có khoa">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên khoa</th>
              <th>Mô tả</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.departmentId}>
                <td>{d.departmentId}</td>
                <td>{d.departmentName}</td>
                <td>{d.description || "-"}</td>
                <td>
                  <Link to={`/departments/${d.departmentId}`} className="btn btn-sm">Chi tiết</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => load(p)} />
      </PageState>
    </div>
  );
}

function AppointmentsTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const load = async (page = 1, s = statusFilter) => {
    setLoading(true);
    setError("");
    try {
      const data = await getAllAppointmentsService({ page, pageSize: PAGE_SIZE, status: s || undefined });
      setItems(data.items);
      setTotalPages(data.totalPages);
      setCurrentPage(data.page);
    } catch (e) {
      setError(e?.message || "Không thể tải danh sách lịch hẹn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(1, statusFilter), 300);
    return () => clearTimeout(t);
  }, [statusFilter]);

  const displayed = search
    ? items.filter((a) =>
        (a.patientName || "").toLowerCase().includes(search.toLowerCase()) ||
        (a.doctorName || "").toLowerCase().includes(search.toLowerCase())
      )
    : items;

  return (
    <div className="admin-panel card">
      <div className="table-toolbar">
        <h3>Quản lý lịch hẹn</h3>
        <div className="table-toolbar-filters">
          <SearchBar placeholder="Tìm bác sĩ, bệnh nhân..." value={search} onChange={setSearch} onClear={() => setSearch("")} />
          <select className="table-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="Pending">Chờ xác nhận</option>
            <option value="Confirmed">Đã xác nhận</option>
            <option value="Completed">Hoàn thành</option>
            <option value="Cancelled">Đã hủy</option>
          </select>
        </div>
      </div>

      <PageState loading={loading} error={error} empty={!displayed.length} emptyText="Chưa có lịch hẹn">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Bệnh nhân</th>
              <th>Bác sĩ</th>
              <th>Khoa</th>
              <th>Thời gian</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((a) => (
              <tr key={a.appointmentId}>
                <td>{a.appointmentId}</td>
                <td>{a.patientName}</td>
                <td>{a.doctorName}</td>
                <td>{a.departmentName}</td>
                <td>{a.appointmentTimeText}</td>
                <td><StatusBadge status={a.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!search && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => load(p)} />}
      </PageState>
    </div>
  );
}
