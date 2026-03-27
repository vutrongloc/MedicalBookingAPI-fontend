export default function PageState({ loading, error, empty, emptyText, children }) {
  if (loading) return <div className="card">Loading...</div>;
  if (error) return <div className="card error-text">{error}</div>;
  if (empty) return <div className="card">{emptyText || "No data"}</div>;
  return children;
}
