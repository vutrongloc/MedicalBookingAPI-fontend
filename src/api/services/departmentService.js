import { axiosClient } from "../axiosClient";
import { unwrapApiResponse } from "./baseService";
import { mapKeysPascalToCamel, normalizeNullable } from "../../utils/mappers";

export async function getDepartmentsService(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", params.page);
  if (params.pageSize) query.set("pageSize", params.pageSize);
  if (params.search) query.set("search", params.search);

  const res = await axiosClient.get(`/api/Departments${query.toString() ? "?" + query.toString() : ""}`);
  const body = unwrapApiResponse(res);

  const rawData = body.data?.items || body.data || [];
  const items = Array.isArray(rawData) ? rawData : [];

  return {
    items: items.map((item) => {
      const d = mapKeysPascalToCamel(item);
      return {
        departmentId: d.departmentId,
        departmentName: normalizeNullable(d.departmentName, "-"),
        description: normalizeNullable(d.description, ""),
      };
    }),
    totalCount: body.data?.totalCount || items.length,
    page: body.data?.page || 1,
    pageSize: body.data?.pageSize || 10,
    totalPages: body.data?.totalPages || 1,
  };
}

export async function getDepartmentByIdService(departmentId) {
  const res = await axiosClient.get(`/api/Departments/${departmentId}`);
  const body = unwrapApiResponse(res);
  const d = mapKeysPascalToCamel(body.data);
  return {
    departmentId: d.departmentId,
    departmentName: normalizeNullable(d.departmentName, "-"),
    description: normalizeNullable(d.description, ""),
  };
}
