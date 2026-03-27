import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="container">
      <div className="card">
        <h2>404 - Not Found</h2>
        <Link to="/">Về dashboard</Link>
      </div>
    </div>
  );
}
