import { axiosClient } from "../axiosClient";
import { unwrapApiResponse } from "./baseService";
import { mapKeysPascalToCamel } from "../../utils/mappers";
import dayjs from "dayjs";

const VIETNAM_OFFSET_HOURS = 7;

const addVietnamOffset = (dateStr) => {
  if (!dateStr) return "";
  return dayjs(dateStr).add(VIETNAM_OFFSET_HOURS, "hour").format("YYYY-MM-DD HH:mm");
};

const addVietnamOffsetShort = (dateStr) => {
  if (!dateStr) return "";
  return dayjs(dateStr).add(VIETNAM_OFFSET_HOURS, "hour").format("DD/MM/YYYY HH:mm");
};

function mapMessage(raw) {
  return {
    role: raw.sender?.toLowerCase() || raw.role || "user",
    content: raw.content || "",
    timestamp: raw.createdAt ? addVietnamOffset(raw.createdAt) : "",
  };
}

export async function createChatSession() {
  const res = await axiosClient.post("/api/AI/chat/sessions");
  const body = unwrapApiResponse(res);
  const data = mapKeysPascalToCamel(body.data);
  return {
    sessionId: data.chatSessionId,
    patientId: data.patientId,
    createdAt: data.createdAt,
    chatSessionId: data.chatSessionId,
  };
}

export async function getChatSessions() {
  const res = await axiosClient.get("/api/AI/chat/sessions");
  const body = unwrapApiResponse(res);
  const rawData = body.data || [];
  return rawData.map((item) => {
    const data = mapKeysPascalToCamel(item);
    return {
      sessionId: data.chatSessionId,
      chatSessionId: data.chatSessionId,
      patientId: data.patientId,
      createdAt: addVietnamOffset(data.createdAt),
      createdAtText: addVietnamOffsetShort(data.createdAt),
    };
  });
}

export async function getChatHistory(sessionId) {
  const res = await axiosClient.get(`/api/AI/chat/sessions/${sessionId}`);
  const body = unwrapApiResponse(res);
  const data = mapKeysPascalToCamel(body.data);
  return {
    sessionId: data.chatSessionId,
    chatSessionId: data.chatSessionId,
    messages: (data.messages || []).map(mapMessage),
  };
}

export async function sendMessage(sessionId, message) {
  const payload = { content: message };
  const res = await axiosClient.post(`/api/AI/chat/sessions/${sessionId}/message`, payload);
  const body = unwrapApiResponse(res);
  const data = mapKeysPascalToCamel(body.data);
  return {
    message: data.assistantMessage?.content,
    response: data.assistantMessage?.content,
    sessionToken: data.chatSessionId,
  };
}

export async function deleteChatSession(sessionId) {
  const res = await axiosClient.delete(`/api/AI/chat/sessions/${sessionId}`);
  return unwrapApiResponse(res);
}
