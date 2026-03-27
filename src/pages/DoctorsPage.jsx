import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDoctorsService } from "../api/services/doctorService";
import { getDepartmentsService } from "../api/services/departmentService";
import PageState from "../components/common/PageState";
import Pagination from "../components/common/Pagination";
import SearchBar from "../components/common/SearchBar";

const PAGE_SIZE = 10;

export default function DoctorsPage() {
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
    <PageState loading={loading} error={error} empty={!items.length} emptyText="Chưa có bác sĩ">
      <div className="card">
        <div className="table-toolbar">
          <h2>Danh sách bác sĩ</h2>
          <div className="table-toolbar-filters">
            <SearchBar
              placeholder="Tìm tên bác sĩ..."
              value={search}
              onChange={setSearch}
              onClear={() => setSearch("")}
            />
            <select
              className="table-filter-select"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="">Tất cả khoa</option>
              {(departments).map((d) => (
                <option key={d.departmentId} value={d.departmentId}>
                  {d.departmentName}
                </option>
              ))}
            </select>
          </div>
        </div>

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
                  <Link to={`/doctors/${d.doctorId}`} className="btn btn-sm">
                    Chi tiết
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(p) => load(p)}
        />
      </div>
    </PageState>
  );
}
