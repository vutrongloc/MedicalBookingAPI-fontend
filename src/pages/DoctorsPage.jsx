import { useEffect, useState, useMemo } from "react";
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
  const [allItems, setAllItems] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [doctorData, deptData] = await Promise.all([
          getDoctorsService({ page: 1, pageSize: 1000 }),
          getDepartmentsService({ page: 1, pageSize: 1000 }),
        ]);
        if (!cancelled) {
          setAllItems(doctorData.items || []);
          setDepartments(deptData.items || deptData);
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || "Không thể tải danh sách bác sĩ");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const searchLower = (search || "").toLowerCase().trim();
    return allItems.filter((d) => {
      const matchesSearch =
        !searchLower ||
        (d.fullName || "").toLowerCase().includes(searchLower) ||
        (d.email || "").toLowerCase().includes(searchLower) ||
        (d.qualification || "").toLowerCase().includes(searchLower);
      const matchesDept =
        !deptFilter ||
        `${d.departmentId}` === `${deptFilter}` ||
        (d.departmentName || "").toLowerCase().includes(String(deptFilter).toLowerCase());
      return matchesSearch && matchesDept;
    });
  }, [allItems, search, deptFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, deptFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const items = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="card">
      <div className="table-toolbar">
        <h2>Danh sách bác sĩ</h2>
        <div className="table-toolbar-filters">
          <SearchBar
            placeholder="Tìm tên bác sĩ, email, chuyên môn..."
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
            {departments.map((d) => (
              <option key={d.departmentId} value={d.departmentId}>
                {d.departmentName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <PageState
        variant="inline"
        loading={loading}
        error={error}
        empty={!loading && !error && filtered.length === 0}
        emptyText="Chưa có bác sĩ"
      >
        <>
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
              {items.map((d, index) => (
                <tr key={d.doctorId}>
                  <td>{index + 1 + (currentPage - 1) * PAGE_SIZE}</td>
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
            onPageChange={setCurrentPage}
          />
        </>
      </PageState>
    </div>
  );
}
