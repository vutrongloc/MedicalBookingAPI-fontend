import { axiosClient } from "../axiosClient";
import { unwrapApiResponse } from "./baseService";
import { mapKeysPascalToCamel } from "../../utils/mappers";

export async function loginService(form) {
  const payload = {
    email: form.email.trim(),
    password: form.password,
  };

  const res = await axiosClient.post("/api/Auth/login", payload);
  const body = unwrapApiResponse(res);
  const data = mapKeysPascalToCamel(body.data);
  return {
    token: data.token,
    user: {
      userId: data.userId ?? null,
      fullName: data.fullName ?? "",
      email: data.email ?? "",
      role: data.role ?? "Patient",
    },
    message: body.message,
  };
}

export async function registerService(form) {
  const payload = {
    fullName: form.fullName.trim(),
    email: form.email.trim(),
    password: form.password,
    phone: form.phone?.trim() || null,
    role: "Patient",
    dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth).toISOString() : null,
    gender: form.gender || null,
    departmentId: null,
    qualification: null,
  };

  const res = await axiosClient.post("/api/Auth/register", payload);
  const body = unwrapApiResponse(res);
  return {
    message: body.message || "Đăng ký thành công",
  };
}
