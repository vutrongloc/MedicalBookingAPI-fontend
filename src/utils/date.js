import dayjs from "dayjs";

export function formatDateTime(value) {
  if (!value) return "-";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("DD/MM/YYYY HH:mm") : "-";
}
