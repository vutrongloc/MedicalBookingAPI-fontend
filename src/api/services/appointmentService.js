import { axiosClient } from "../axiosClient";
import { unwrapApiResponse } from "./baseService";
import { mapAppointment } from "../../utils/mappers";

export async function getMyAppointmentsService(role, params = {}) {
  const endpoint = role === "Doctor" ? "/api/Appointments/doctor" : "/api/Appointments/patient";
  const query = new URLSearchParams();
  if (params.page) query.set("page", params.page);
  if (params.pageSize) query.set("pageSize", params.pageSize);
  if (params.status) query.set("status", params.status);
  if (params.fromDate) query.set("fromDate", params.fromDate);
  if (params.toDate) query.set("toDate", params.toDate);

  const res = await axiosClient.get(`${endpoint}${query.toString() ? "?" + query.toString() : ""}`);
  const body = unwrapApiResponse(res);

  const rawData = body.data?.items || body.data || [];
  const items = Array.isArray(rawData) ? rawData : [];
  return {
    items: items.map(mapAppointment),
    totalCount: body.data?.totalCount || items.length,
    page: body.data?.page || 1,
    pageSize: body.data?.pageSize || 10,
    totalPages: body.data?.totalPages || 1,
  };
}

export async function getAppointmentByIdService(appointmentId) {
  const res = await axiosClient.get(`/api/Appointments/${appointmentId}`);
  const body = unwrapApiResponse(res);
  return mapAppointment(body.data);
}

export async function createAppointmentService(form) {
  const payload = {
    doctorId: Number(form.doctorId),
    appointmentTime: new Date(form.appointmentTime).toISOString(),
  };
  const res = await axiosClient.post("/api/Appointments", payload);
  const body = unwrapApiResponse(res);
  return mapAppointment(body.data);
}

export async function updateAppointmentStatusService(appointmentId, status) {
  const payload = { status };
  const res = await axiosClient.put(`/api/Appointments/${appointmentId}/status`, payload);
  const body = unwrapApiResponse(res);
  return mapAppointment(body.data);
}

export async function cancelAppointmentService(appointmentId) {
  const res = await axiosClient.delete(`/api/Appointments/${appointmentId}`);
  return unwrapApiResponse(res);
}

export async function getAllAppointmentsService(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", params.page);
  if (params.pageSize) query.set("pageSize", params.pageSize);
  if (params.status) query.set("status", params.status);
  if (params.fromDate) query.set("fromDate", params.fromDate);
  if (params.toDate) query.set("toDate", params.toDate);
  if (params.doctorId) query.set("doctorId", params.doctorId);

  const res = await axiosClient.get(`/api/Appointments?${query.toString()}`);
  const body = unwrapApiResponse(res);
  const rawData = body.data?.items || body.data || [];
  const items = Array.isArray(rawData) ? rawData : [];
  return {
    items: items.map(mapAppointment),
    totalCount: body.data?.totalCount || items.length,
    page: body.data?.page || 1,
    pageSize: body.data?.pageSize || 10,
    totalPages: body.data?.totalPages || 1,
  };
}
