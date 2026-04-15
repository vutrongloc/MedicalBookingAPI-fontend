/**
 * variant="full" (default): thay thế toàn bộ nội dung khi loading/error/empty.
 * variant="inline": chỉ render phần nội dung bảng/danh sách — dùng khi toolbar/tìm kiếm nằm ngoài PageState.
 */
export default function PageState({
  loading,
  error,
  empty,
  emptyText,
  children,
  variant = "full",
}) {
  if (variant === "inline") {
    if (loading) {
      return <p className="page-state-inline-loading">Đang tải...</p>;
    }
    if (error) {
      return <p className="error-text page-state-inline-error">{error}</p>;
    }
    if (empty) {
      return <p className="table-empty-hint">{emptyText || "Không có dữ liệu"}</p>;
    }
    return children;
  }

  if (loading) return <div className="card">Đang tải...</div>;
  if (error) return <div className="card error-text">{error}</div>;
  if (empty) return <div className="card">{emptyText || "No data"}</div>;
  return children;
}
