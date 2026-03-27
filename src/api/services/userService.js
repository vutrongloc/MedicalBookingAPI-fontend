import { axiosClient } from "../axiosClient";
import { unwrapApiResponse } from "./baseService";
import { mapKeysPascalToCamel, normalizeNullable } from "../../utils/mappers";

export async function getCurrentUserService() {
  const res = await axiosClient.get("/api/Users/me");
  const body = unwrapApiResponse(res);
  const user = mapKeysPascalToCamel(body.data);

  return {
    userId: user.userId,
    fullName: normalizeNullable(user.fullName, "-"),
    email: normalizeNullable(user.email, "-"),
    phone: normalizeNullable(user.phone, ""),
    role: normalizeNullable(user.role, "Patient"),
    dateOfBirth: user.dateOfBirth || null,
    gender: normalizeNullable(user.gender, ""),
    patientId: user.patientId || null,
    doctorId: user.doctorId || null,
    departmentId: user.departmentId || null,
    departmentName: normalizeNullable(user.departmentName, ""),
    qualification: normalizeNullable(user.qualification, ""),
  };
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
  return mapKeysPascalToCamel(body.data);
}

export async function changePasswordService(form) {
  const payload = {
    currentPassword: form.currentPassword,
    newPassword: form.newPassword,
  };
  const res = await axiosClient.post("/api/Auth/change-password", payload);
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
