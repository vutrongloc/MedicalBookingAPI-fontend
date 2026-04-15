import { formatDateTime, formatCreatedAt } from "./date";

function toCamelCase(str) {
  return str ? str.charAt(0).toLowerCase() + str.slice(1) : str;
}

export function mapKeysPascalToCamel(input) {
  if (Array.isArray(input)) return input.map(mapKeysPascalToCamel);
  if (input && typeof input === "object") {
    return Object.keys(input).reduce((acc, key) => {
      const camelKey = toCamelCase(key);
      acc[camelKey] = mapKeysPascalToCamel(input[key]);
      return acc;
    }, {});
  }
  return input ?? null;
}

export function normalizeNullable(value, fallback = "") {
  return value === null || value === undefined ? fallback : value;
}

export function mapAppointment(dto) {
  const raw = mapKeysPascalToCamel(dto);
  return {
    ...raw,
    patientName: normalizeNullable(raw.patientName, "-"),
    doctorName: normalizeNullable(raw.doctorName, "-"),
    departmentName: normalizeNullable(raw.departmentName, "-"),
    appointmentTimeText: formatDateTime(raw.appointmentTime),
    createdAtText: formatCreatedAt(raw.createdAt),
  };
}
