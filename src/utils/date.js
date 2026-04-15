import dayjs from "dayjs";

export function formatDateTime(value) {
  if (!value) return "-";
  let date = dayjs(value);
  if (!date.isValid()) return "-";
  const formatted = date.format("YYYY-MM-DD HH:mm");
  const [datePart, timePart] = formatted.split(" ");
  const [year, month, day] = datePart.split("-");
  return `${day}/${month}/${year} ${timePart}`;
}

export function formatCreatedAt(value) {
  if (!value) return "-";
  let date = dayjs(value);
  if (!date.isValid()) return "-";
  // Cộng thêm 7 tiếng để bù timezone
  date = date.add(7, "hour");
  const formatted = date.format("YYYY-MM-DD HH:mm");
  const [datePart, timePart] = formatted.split(" ");
  const [year, month, day] = datePart.split("-");
  return `${day}/${month}/${year} ${timePart}`;
}

export function formatDateLocal(value) {
  if (!value) return "-";
  let date = dayjs(value);
  if (!date.isValid()) return "-";
  date = date.add(7, "hour");
  const formatted = date.format("YYYY-MM-DD");
  const [year, month, day] = formatted.split("-");
  return `${day}/${month}/${year}`;
}
