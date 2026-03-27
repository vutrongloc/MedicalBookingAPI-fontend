import { axiosClient } from "../axiosClient";
import { unwrapApiResponse } from "./baseService";
import { mapKeysPascalToCamel, normalizeNullable } from "../../utils/mappers";

export async function getDoctorsService(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", params.page);
  if (params.pageSize) query.set("pageSize", params.pageSize);
  if (params.search) query.set("search", params.search);
  if (params.departmentId) query.set("departmentId", params.departmentId);

  const res = await axiosClient.get(`/api/Doctors${query.toString() ? "?" + query.toString() : ""}`);
  const body = unwrapApiResponse(res);

  const rawData = body.data?.items || body.data || [];
  const items = Array.isArray(rawData) ? rawData : [];

  return {
    items: items.map((item) => {
      const d = mapKeysPascalToCamel(item);
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
    }),
    totalCount: body.data?.totalCount || items.length,
    page: body.data?.page || 1,
    pageSize: body.data?.pageSize || 10,
    totalPages: body.data?.totalPages || 1,
  };
}

export async function getDoctorByIdService(doctorId) {
  const res = await axiosClient.get(`/api/Doctors/${doctorId}`);
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
}

export async function getDoctorsByDepartmentService(departmentId) {
  const res = await axiosClient.get(`/api/Doctors/department/${departmentId}`);
  const body = unwrapApiResponse(res);
  return (body.data || []).map((item) => {
    const d = mapKeysPascalToCamel(item);
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
  });
}
