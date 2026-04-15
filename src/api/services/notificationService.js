import { axiosClient } from "../axiosClient";
import { unwrapApiResponse } from "./baseService";

export async function getNotificationsService(page = 1, pageSize = 20) {
  const query = new URLSearchParams();
  query.set("page", page);
  query.set("pageSize", pageSize);

  const res = await axiosClient.get(`/api/Notifications?${query.toString()}`);
  const body = unwrapApiResponse(res);

  const rawData = body.data?.items || body.data || [];
  const items = Array.isArray(rawData) ? rawData : [];

  return {
    items: items.map((n) => ({
      notificationId: n.notificationId || n.id,
      title: n.title || "",
      message: n.message || n.content || "",
      type: n.type || "info",
      isRead: n.isRead || false,
      createdAt: n.createdAt || n.createdTime || new Date().toISOString(),
      relatedEntityId: n.relatedEntityId || n.entityId || null,
      relatedEntityType: n.relatedEntityType || n.entityType || null,
    })),
    totalCount: body.data?.totalCount || items.length,
    page: body.data?.page || page,
    pageSize: body.data?.pageSize || pageSize,
    totalPages: body.data?.totalPages || 1,
  };
}

export async function getUnreadCountService() {
  const res = await axiosClient.get("/api/Notifications/unread-count");
  const body = unwrapApiResponse(res);
  return body.data?.count || body.data || 0;
}

export async function markAsReadService(notificationId) {
  const res = await axiosClient.put(`/api/Notifications/${notificationId}/read`, {});
  const body = unwrapApiResponse(res);
  return body.data;
}

export async function markAllAsReadService() {
  const res = await axiosClient.put("/api/Notifications/read-all", {});
  const body = unwrapApiResponse(res);
  return body.data;
}
