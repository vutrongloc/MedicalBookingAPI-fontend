import { axiosClient } from "../axiosClient";
import { unwrapApiResponse } from "./baseService";
import { mapKeysPascalToCamel } from "../../utils/mappers";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const VIETNAM_TZ = "Asia/Ho_Chi_Minh";

const addVietnamOffset = (dateStr) => {
  if (!dateStr) return "";
  if (dateStr.endsWith("Z")) {
    return dayjs.utc(dateStr).tz(VIETNAM_TZ).format("YYYY-MM-DD HH:mm");
  }
  return dayjs.tz(dateStr, VIETNAM_TZ).format("YYYY-MM-DD HH:mm");
};

const addVietnamOffsetShort = (dateStr) => {
  if (!dateStr) return "";
  if (dateStr.endsWith("Z")) {
    return dayjs.utc(dateStr).tz(VIETNAM_TZ).format("DD/MM/YYYY HH:mm");
  }
  return dayjs.tz(dateStr, VIETNAM_TZ).format("DD/MM/YYYY HH:mm");
};

function mapMessage(raw) {
  return {
    role: raw.sender?.toLowerCase() || raw.role || "user",
    content: raw.content || "",
    timestamp: raw.createdAt ? addVietnamOffset(raw.createdAt) : "",
    suggestedSpecialty: raw.suggestedSpecialty || null,
    confidenceScore: raw.confidenceScore || null,
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
    suggestedSpecialty: data.assistantMessage?.suggestedSpecialty || null,
    confidenceScore: data.assistantMessage?.confidenceScore || null,
  };
}

export async function deleteChatSession(sessionId) {
  const res = await axiosClient.delete(`/api/AI/chat/sessions/${sessionId}`);
  return unwrapApiResponse(res);
}
