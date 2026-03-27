const STATUS_CONFIG = {
  Pending: { label: "Chờ xác nhận", className: "status-pending" },
  Confirmed: { label: "Đã xác nhận", className: "status-confirmed" },
  Completed: { label: "Hoàn thành", className: "status-completed" },
  Cancelled: { label: "Đã hủy", className: "status-cancelled" },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, className: "status-default" };

  return (
    <span className={`status-badge ${config.className}`}>
      {config.label}
    </span>
  );
}
