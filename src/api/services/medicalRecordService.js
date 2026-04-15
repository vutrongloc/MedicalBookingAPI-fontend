import { axiosClient } from "../axiosClient";
import { unwrapApiResponse } from "./baseService";
import { mapKeysPascalToCamel, normalizeNullable } from "../../utils/mappers";
import { formatDateTime, formatCreatedAt } from "../../utils/date";

export async function getMyMedicalRecordsService() {
  const res = await axiosClient.get("/api/MedicalRecords/patient");
  const body = unwrapApiResponse(res);
  const rawData = body.data || [];
  return rawData.map(mapMedicalRecord);
}

export async function getDoctorMedicalRecordsService() {
  const res = await axiosClient.get("/api/MedicalRecords/doctor");
  const body = unwrapApiResponse(res);
  const rawData = body.data || [];
  return rawData.map(mapMedicalRecord);
}

export async function getMedicalRecordByIdService(recordId) {
  const res = await axiosClient.get(`/api/MedicalRecords/${recordId}`);
  const body = unwrapApiResponse(res);
  return mapMedicalRecord(body.data);
}

export async function createMedicalRecordService(form) {
  const payload = {
    appointmentId: Number(form.appointmentId),
    doctorDiagnosis: form.doctorDiagnosis || null,
    treatment: form.treatment || null,
    prescription: form.prescription || null,
  };
  const res = await axiosClient.post("/api/MedicalRecords", payload);
  const body = unwrapApiResponse(res);
  return mapMedicalRecord(body.data);
}

export async function updateMedicalRecordService(recordId, form) {
  const payload = {
    doctorDiagnosis: form.doctorDiagnosis || "",
    treatment: form.treatment || "",
    prescription: form.prescription || "",
  };
  const res = await axiosClient.put(`/api/MedicalRecords/${recordId}`, payload);
  const body = unwrapApiResponse(res);
  return mapMedicalRecord(body.data);
}

function mapMedicalRecord(dto) {
  const raw = mapKeysPascalToCamel(dto);
  return {
    medicalRecordId: raw.medicalRecordId,
    appointmentId: raw.appointmentId,
    appointmentTime: raw.appointmentTime,
    appointmentTimeText: formatDateTime(raw.appointmentTime),
    patientName: normalizeNullable(raw.patientName, "-"),
    patientEmail: normalizeNullable(raw.patientEmail, "-"),
    patientPhone: normalizeNullable(raw.patientPhone, "-"),
    doctorName: normalizeNullable(raw.doctorName, "-"),
    doctorEmail: normalizeNullable(raw.doctorEmail, "-"),
    departmentName: normalizeNullable(raw.departmentName, "-"),
    doctorDiagnosis: normalizeNullable(raw.doctorDiagnosis, ""),
    treatment: normalizeNullable(raw.treatment, ""),
    prescription: normalizeNullable(raw.prescription, ""),
    notes: normalizeNullable(raw.notes, ""),
    createdAt: raw.createdAt,
    createdAtText: formatCreatedAt(raw.createdAt),
    updatedAt: raw.updatedAt,
    updatedAtText: formatCreatedAt(raw.updatedAt),
  };
}
