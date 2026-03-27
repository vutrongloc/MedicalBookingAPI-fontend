import { axiosClient } from "../axiosClient";
import { unwrapApiResponse } from "./baseService";
import { mapKeysPascalToCamel, normalizeNullable } from "../../utils/mappers";

export async function getNotificationsService(page = 1, pageSize = 20) {
  const res = await axiosClient.get(`/api/Notifications?page=${page}&pageSize=${pageSize}`);
  const body = unwrapApiResponse(res);
  return {
    items: (body.data?.items || []).map(mapNotification),
    totalCount: body.data?.totalCount || 0,
    page: body.data?.page || page,
    pageSize: body.data?.pageSize || pageSize,
    totalPages: body.data?.totalPages || 1,
  };
}

export async function getUnreadCountService() {
  const res = await axiosClient.get("/api/Notifications/unread-count");
  const body = unwrapApiResponse(res);
  return body.data?.count || 0;
}

export async function markAsReadService(notificationId) {
  const res = await axiosClient.put(`/api/Notifications/${notificationId}/read`);
  return unwrapApiResponse(res);
}

export async function markAllAsReadService() {
  const res = await axiosClient.put("/api/Notifications/read-all");
  return unwrapApiResponse(res);
}

function mapNotification(dto) {
  const raw = mapKeysPascalToCamel(dto);
  return {
    notificationId: raw.notificationId,
    title: normalizeNullable(raw.title, ""),
    content: normalizeNullable(raw.content, ""),
    type: normalizeNullable(raw.type, "System"),
    relatedId: raw.relatedId || null,
    isRead: raw.isRead || false,
    createdAt: raw.createdAt,
    timeAgo: normalizeNullable(raw.timeAgo, ""),
  };
}
