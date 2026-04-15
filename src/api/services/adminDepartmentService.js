import { axiosClient } from "../axiosClient";
import { unwrapApiResponse } from "./baseService";
import { mapKeysPascalToCamel, normalizeNullable } from "../../utils/mappers";

export async function createDepartmentService(form) {
  const payload = {
    departmentName: form.departmentName,
    description: form.description || "",
  };
  const res = await axiosClient.post("/api/Departments", payload);
  const body = unwrapApiResponse(res);
  const d = mapKeysPascalToCamel(body.data);
  return {
    departmentId: d.departmentId,
    departmentName: normalizeNullable(d.departmentName, "-"),
    description: normalizeNullable(d.description, ""),
  };
}

export async function updateDepartmentService(departmentId, form) {
  const payload = {
    departmentName: form.departmentName,
    description: form.description || "",
  };
  const res = await axiosClient.put(`/api/Departments/${departmentId}`, payload);
  const body = unwrapApiResponse(res);
  const d = mapKeysPascalToCamel(body.data);
  return {
    departmentId: d.departmentId,
    departmentName: normalizeNullable(d.departmentName, "-"),
    description: normalizeNullable(d.description, ""),
  };
}

export async function deleteDepartmentService(departmentId) {
  const res = await axiosClient.delete(`/api/Departments/${departmentId}`);
  return unwrapApiResponse(res);
}
