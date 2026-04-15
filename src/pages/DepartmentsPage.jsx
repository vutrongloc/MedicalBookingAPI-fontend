import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getDepartmentsService } from "../api/services/departmentService";
import PageState from "../components/common/PageState";
import Pagination from "../components/common/Pagination";
import SearchBar from "../components/common/SearchBar";

const PAGE_SIZE = 10;

export default function DepartmentsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [allItems, setAllItems] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getDepartmentsService({ page: 1, pageSize: 1000 });
        if (!cancelled) setAllItems(data.items || []);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Không thể tải khoa");
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
    if (!searchLower) return allItems;
    return allItems.filter(
      (d) =>
        (d.departmentName || "").toLowerCase().includes(searchLower) ||
        (d.description || "").toLowerCase().includes(searchLower)
    );
  }, [allItems, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const items = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="card">
      <div className="table-toolbar">
        <h2>Danh sách khoa</h2>
        <div className="table-toolbar-filters">
          <SearchBar
            placeholder="Tìm tên khoa, mô tả..."
            value={search}
            onChange={setSearch}
            onClear={() => setSearch("")}
          />
        </div>
      </div>

      <PageState
        variant="inline"
        loading={loading}
        error={error}
        empty={!loading && !error && filtered.length === 0}
        emptyText="Chưa có khoa nào"
      >
        <>
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
              {items.map((d, index) => (
                <tr key={d.departmentId}>
                  <td>{index + 1 + (currentPage - 1) * PAGE_SIZE}</td>
                  <td>{d.departmentName}</td>
                  <td>{d.description || "-"}</td>
                  <td>
                    <Link to={`/departments/${d.departmentId}`} className="btn btn-sm">
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
