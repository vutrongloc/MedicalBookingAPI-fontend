import { axiosClient } from "../axiosClient";
import { unwrapApiResponse } from "./baseService";
import { mapKeysPascalToCamel, normalizeNullable } from "../../utils/mappers";

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

export async function createDoctorService(form) {
  const payload = {
    email: form.email,
    password: form.password,
    fullName: form.fullName,
    phone: form.phone || null,
    departmentId: Number(form.departmentId) || 0,
    qualification: form.qualification || null,
  };
  try {
    const res = await axiosClient.post("/api/Doctors", payload);
    const body = unwrapApiResponse(res);
    const d = mapKeysPascalToCamel(body.data);
    return {
      doctorId: d.doctorId,
      userId: d.userId,
      fullName: normalizeNullable(d.fullName, "-"),
      email: normalizeNullable(d.email, "-"),
      phone: normalizeNullable(d.phone, ""),
      departmentId: d.departmentId,
      departmentName: normalizeNullable(d.departmentName, "-"),
      qualification: normalizeNullable(d.qualification, ""),
    };
  } catch (e) {
    handleApiError(e);
  }
}

export async function updateDoctorService(doctorId, form) {
  const payload = {};
  if (form.qualification !== undefined) payload.qualification = form.qualification || null;
  if (form.phone !== undefined) payload.phone = form.phone || null;
  try {
    const res = await axiosClient.put(`/api/Doctors/${doctorId}`, payload);
    const body = unwrapApiResponse(res);
    const d = mapKeysPascalToCamel(body.data);
    return {
      doctorId: d.doctorId,
      userId: d.userId,
      fullName: normalizeNullable(d.fullName, "-"),
      email: normalizeNullable(d.email, "-"),
      phone: normalizeNullable(d.phone, ""),
      departmentId: d.departmentId,
      departmentName: normalizeNullable(d.departmentName, "-"),
      qualification: normalizeNullable(d.qualification, ""),
    };
  } catch (e) {
    handleApiError(e);
  }
}

export async function assignDoctorDepartmentService(doctorId, departmentId) {
  try {
    const res = await axiosClient.put(`/api/Doctors/${doctorId}/department`, { departmentId });
    return unwrapApiResponse(res);
  } catch (e) {
    handleApiError(e);
  }
}
