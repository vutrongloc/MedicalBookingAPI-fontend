import { axiosClient } from "../axiosClient";
import { unwrapApiResponse } from "./baseService";
import { mapKeysPascalToCamel, normalizeNullable } from "../../utils/mappers";
import { mapMedicalRecord } from "../../utils/mappers";

export async function getMedicalRecordsService(role, params = {}) {
  if (role === "Admin") {
    throw new Error("Backend chưa hỗ trợ endpoint list medical records cho Admin.");
  }
  const endpoint = role === "Patient" ? "/api/MedicalRecords/patient" : "/api/MedicalRecords/doctor";
  const query = new URLSearchParams();
  if (params.page) query.set("page", params.page);
  if (params.pageSize) query.set("pageSize", params.pageSize);
  if (params.fromDate) query.set("fromDate", params.fromDate);
  if (params.toDate) query.set("toDate", params.toDate);

  const res = await axiosClient.get(`${endpoint}${query.toString() ? "?" + query.toString() : ""}`);
  const body = unwrapApiResponse(res);

  const rawData = body.data?.items || body.data || [];
  const items = Array.isArray(rawData) ? rawData : [];
  return {
    items: items.map(mapMedicalRecord),
    totalCount: body.data?.totalCount || items.length,
    page: body.data?.page || 1,
    pageSize: body.data?.pageSize || 10,
    totalPages: body.data?.totalPages || 1,
  };
}

export async function createMedicalRecordService(form) {
  const payload = {
    appointmentId: Number(form.appointmentId),
    doctorDiagnosis: form.doctorDiagnosis || "",
    treatment: form.treatment || "",
    prescription: form.prescription || "",
  };
  const res = await axiosClient.post("/api/MedicalRecords", payload);
  const body = unwrapApiResponse(res);
  return mapMedicalRecord(body.data);
}

export async function updateMedicalRecordService(medicalRecordId, form) {
  const payload = {};
  if (form.doctorDiagnosis !== undefined) payload.doctorDiagnosis = form.doctorDiagnosis;
  if (form.treatment !== undefined) payload.treatment = form.treatment;
  if (form.prescription !== undefined) payload.prescription = form.prescription;

  const res = await axiosClient.put(`/api/MedicalRecords/${medicalRecordId}`, payload);
  const body = unwrapApiResponse(res);
  return mapMedicalRecord(body.data);
}
