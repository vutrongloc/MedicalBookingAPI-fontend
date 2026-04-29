import { axiosClient } from "../axiosClient";
import { unwrapApiResponse } from "./baseService";
import { mapKeysPascalToCamel, normalizeNullable } from "../../utils/mappers";
import { formatDateTime, formatCreatedAt } from "../../utils/date";

function handleApiError(error) {
  if (error?.response?.data) {
    const data = error.response.data;
    if (data.message) {
      throw new Error(data.message);
    }
    if (data.errors) {
      const firstErrorKey = Object.keys(data.errors)[0];
      const firstError = Array.isArray(data.errors[firstErrorKey])
        ? data.errors[firstErrorKey][0]
        : data.errors[firstErrorKey];
      throw new Error(firstError || "Dữ liệu không hợp lệ");
    }
  }
  throw new Error(error?.message || "Đã xảy ra lỗi");
}

function normalizeAppointment(d) {
  return {
    appointmentId: d.appointmentId,
    patientId: d.patientId,
    patientName: normalizeNullable(d.patientName, "-"),
    patientEmail: normalizeNullable(d.patientEmail, "-"),
    doctorId: d.doctorId,
    doctorName: normalizeNullable(d.doctorName, "-"),
    departmentName: normalizeNullable(d.departmentName, "-"),
    appointmentTime: d.appointmentTime,
    appointmentTimeText: formatDateTime(d.appointmentTime),
    status: d.status,
    createdAt: d.createdAt,
    createdAtText: formatCreatedAt(d.createdAt),
    hasMedicalRecord: !!d.hasMedicalRecord,
  };
}

export async function getAllAppointmentsService(params = {}) {
  const query = new URLSearchParams();
  if (params.fromDate) query.set("fromDate", params.fromDate);
  if (params.toDate) query.set("toDate", params.toDate);
  if (params.status) query.set("status", params.status);
  if (params.doctorId) query.set("doctorId", params.doctorId);
  if (params.patientId) query.set("patientId", params.patientId);

  try {
    const res = await axiosClient.get(
      `/api/Appointments/admin/all${query.toString() ? "?" + query.toString() : ""}`
    );
    const body = unwrapApiResponse(res);
    const rawItems = Array.isArray(body.data) ? body.data : [];
    return rawItems.map((item) => {
      const d = mapKeysPascalToCamel(item);
      return normalizeAppointment(d);
    });
  } catch (e) {
    handleApiError(e);
  }
}

export async function getAppointmentDetailService(appointmentId) {
  try {
    const res = await axiosClient.get(`/api/Appointments/admin/${appointmentId}`);
    const body = unwrapApiResponse(res);
    const d = mapKeysPascalToCamel(body.data);
    return normalizeAppointment(d);
  } catch (e) {
    handleApiError(e);
  }
}

export async function updateAppointmentStatusService(appointmentId, status) {
  try {
    const res = await axiosClient.put(
      `/api/Appointments/admin/${appointmentId}/status`,
      { status }
    );
    const body = unwrapApiResponse(res);
    const d = mapKeysPascalToCamel(body.data);
    return normalizeAppointment(d);
  } catch (e) {
    handleApiError(e);
  }
}

export async function cancelAppointmentService(appointmentId) {
  try {
    const res = await axiosClient.delete(`/api/Appointments/admin/${appointmentId}`);
    return unwrapApiResponse(res);
  } catch (e) {
    handleApiError(e);
  }
}
