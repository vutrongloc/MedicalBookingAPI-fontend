import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDepartmentsService } from "../api/services/departmentService";
import PageState from "../components/common/PageState";
import Pagination from "../components/common/Pagination";
import SearchBar from "../components/common/SearchBar";

const PAGE_SIZE = 10;

export default function DepartmentsPage() {
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
      setError(e?.message || "Không thể tải khoa");
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
    <PageState loading={loading} error={error} empty={!items.length} emptyText="Chưa có khoa nào">
      <div className="card">
        <div className="table-toolbar">
          <h2>Danh sách khoa</h2>
          <div className="table-toolbar-filters">
            <SearchBar
              placeholder="Tìm tên khoa..."
              value={search}
              onChange={setSearch}
              onClear={() => setSearch("")}
            />
          </div>
        </div>

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
          onPageChange={(p) => load(p)}
        />
      </div>
    </PageState>
  );
}
