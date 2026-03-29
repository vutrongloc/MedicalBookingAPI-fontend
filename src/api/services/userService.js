import { axiosClient } from "../axiosClient";
import { unwrapApiResponse } from "./baseService";
import { mapKeysPascalToCamel, normalizeNullable } from "../../utils/mappers";

/** Backend UserDetailDto nests patient/doctor; flatten for the UI and auth merge. */
function mapUserDetailDto(bodyData) {
  const user = mapKeysPascalToCamel(bodyData);
  const patient = user.patient || null;
  const doctor = user.doctor || null;

  return {
    userId: user.userId,
    fullName: normalizeNullable(user.fullName, "-"),
    email: normalizeNullable(user.email, "-"),
    phone: normalizeNullable(user.phone, ""),
    role: normalizeNullable(user.role, "Patient"),
    dateOfBirth: patient?.dateOfBirth ?? null,
    gender: normalizeNullable(patient?.gender, ""),
    patientId: patient?.patientId ?? null,
    doctorId: doctor?.doctorId ?? null,
    departmentId: doctor?.departmentId ?? null,
    departmentName: normalizeNullable(doctor?.departmentName, ""),
    qualification: normalizeNullable(doctor?.qualification, ""),
  };
}

export async function getCurrentUserService() {
  const res = await axiosClient.get("/api/Users/me");
  const body = unwrapApiResponse(res);
  return mapUserDetailDto(body.data);
}

export async function updateCurrentUserService(form) {
  const payload = {};
  if (form.fullName !== undefined) payload.fullName = form.fullName;
  if (form.phone !== undefined) payload.phone = form.phone || null;
  if (form.dateOfBirth !== undefined) payload.dateOfBirth = form.dateOfBirth || null;
  if (form.gender !== undefined) payload.gender = form.gender || null;
  if (form.qualification !== undefined) payload.qualification = form.qualification || null;

  const res = await axiosClient.put("/api/Users/me", payload);
  const body = unwrapApiResponse(res);
  return mapUserDetailDto(body.data);
}

export async function changePasswordService(form) {
  const payload = {
    oldPassword: form.oldPassword,
    newPassword: form.newPassword,
    confirmPassword: form.newPassword,
  };
  const res = await axiosClient.put("/api/Auth/change-password", payload);
  return unwrapApiResponse(res);
}

export async function getAllUsersService(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", params.page);
  if (params.pageSize) query.set("pageSize", params.pageSize);
  if (params.search) query.set("search", params.search);
  if (params.role) query.set("role", params.role);

  const res = await axiosClient.get(`/api/Users?${query.toString()}`);
  const body = unwrapApiResponse(res);
  return {
    items: (body.data?.items || []).map((item) => {
      const u = mapKeysPascalToCamel(item);
      return {
        userId: u.userId,
        fullName: normalizeNullable(u.fullName, "-"),
        email: normalizeNullable(u.email, "-"),
        phone: normalizeNullable(u.phone, ""),
        role: normalizeNullable(u.role, "Patient"),
        createdAt: u.createdAt,
      };
    }),
    totalCount: body.data?.totalCount || 0,
    page: body.data?.page || 1,
    pageSize: body.data?.pageSize || 10,
    totalPages: body.data?.totalPages || 1,
  };
}
