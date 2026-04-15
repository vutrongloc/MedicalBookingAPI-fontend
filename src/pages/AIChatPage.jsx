import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  createChatSession,
  getChatSessions,
  getChatHistory,
  sendMessage,
  deleteChatSession,
} from "../api/services/aiService";
import { useCooldown } from "../hooks/useCooldown";
import dayjs from "dayjs";

export default function AIChatPage() {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [creatingSession, setCreatingSession] = useState(false);
  const messagesEndRef = useRef(null);
  const { isLocked: sendLocked, run: runSend } = useCooldown(3000);
  const { isLocked: newLocked, run: runNew } = useCooldown(2000);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await getChatSessions();
      setSessions(data || []);
    } catch (e) {
      toast.error("Không thể tải lịch sử trò chuyện");
    } finally {
      setLoading(false);
    }
  };

  const loadChatHistory = async (sessionId) => {
    try {
      const data = await getChatHistory(sessionId);
      setMessages(data.messages || []);
    } catch {
      setMessages([]);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleSelectSession = async (session) => {
    setCurrentSession(session);
    await loadChatHistory(session.sessionId);
  };

  const handleNewSession = async () => {
    if (newLocked) return;
    setCreatingSession(true);
    
    runNew(async () => {
      try {
        await createChatSession();
        await loadSessions();
        
        // Reload sessions để lấy session mới nhất với sessionId chính xác
        const updatedSessions = await getChatSessions();
        if (updatedSessions && updatedSessions.length > 0) {
          // Chọn session đầu tiên (mới nhất)
          const newSession = updatedSessions[0];
          setCurrentSession(newSession);
          setMessages([]);
          toast.success("Đã tạo phiên trò chuyện mới");

        }
      } catch (e) {
        toast.error(e?.message || "Không thể tạo phiên trò chuyện mới");
      } finally {
        setCreatingSession(false);
      }
    });
  };

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();
    try {
      await deleteChatSession(sessionId);
      //toast.success("Đã xóa phiên trò chuyện");
      if (currentSession?.sessionId === sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }
      await loadSessions();
    } catch (e) {
      toast.error(e?.message || "Không thể xóa phiên trò chuyện");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !currentSession || sendLocked) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");

    setMessages((prev) => [...prev, { role: "user", content: userMessage, timestamp: dayjs().add(7, "hour").format("YYYY-MM-DD HH:mm") }]);

    runSend(async () => {
      try {
        const response = await sendMessage(currentSession.sessionId, userMessage);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: response.response, timestamp: dayjs().add(7, "hour").format("YYYY-MM-DD HH:mm") },
        ]);
      } catch (e) {
        toast.error(e?.message || "Không thể gửi tin nhắn");
        setMessages((prev) => prev.filter((_, i) => i < prev.length - 1));
      }
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    return dayjs(timestamp).format("HH:mm");
  };

  return (
    <div className="ai-chat-container">
      <div className="ai-chat-sidebar">
        <div className="ai-chat-sidebar-header">
          <h3>Lịch sử chat</h3>
          <button
            className="ai-chat-new-btn"
            onClick={handleNewSession}
            disabled={creatingSession || newLocked}
          >
            {creatingSession ? "..." : "+ Mới"}
          </button>
        </div>
        <div className="ai-chat-session-list">
          {loading ? (
            <div className="ai-chat-loading">Đang tải...</div>
          ) : sessions.length === 0 ? (
            <div className="ai-chat-empty">Chưa có phiên trò chuyện nào</div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.sessionId}
                className={`ai-chat-session-item ${currentSession?.sessionId === session.sessionId ? "active" : ""}`}
                onClick={() => handleSelectSession(session)}
              >
                <div className="ai-chat-session-info">
                  <div className="ai-chat-session-time">{session.createdAtText}</div>
                </div>
                <button
                  className="ai-chat-session-delete"
                  onClick={(e) => handleDeleteSession(session.sessionId, e)}
                  title="Xóa phiên trò chuyện"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="ai-chat-main">
        {currentSession ? (
          <>
            <div className="ai-chat-header">
              <div className="ai-chat-header-info">
                <span className="ai-chat-avatar">🤖</span>
                <div>
                  <div className="ai-chat-header-title">Trợ lý AI</div>
                  <div className="ai-chat-header-subtitle">Hỏi đáp về sức khỏe</div>
                </div>
              </div>
            </div>

            <div className="ai-chat-messages">
              {messages.length === 0 && (
                <div className="ai-chat-welcome">
                  <div className="ai-chat-welcome-icon">🤖</div>
                  <h3>Xin chào! Tôi là trợ lý AI</h3>
                  <p>Hãy hỏi tôi về sức khỏe, bệnh lý, hoặc nhận tư vấn sơ bộ.</p>
                </div>
              )}
              {messages.map((msg, index) => (
                <div key={index} className={`ai-chat-message ${msg.role}`}>
                  <div className="ai-chat-message-avatar">
                    {msg.role === "user" ? "👤" : "🤖"}
                  </div>
                  <div className="ai-chat-message-content">
                    <div className="ai-chat-message-bubble">{msg.content}</div>
                    <div className="ai-chat-message-time">{formatTime(msg.timestamp)}</div>
                  </div>
                </div>
              ))}
              {sendLocked && (
                <div className="ai-chat-message assistant">
                  <div className="ai-chat-message-avatar">🤖</div>
                  <div className="ai-chat-message-content">
                    <div className="ai-chat-message-bubble ai-chat-typing">
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="ai-chat-input-area" onSubmit={handleSendMessage}>
              <input
                type="text"
                className="ai-chat-input"
                placeholder="Nhập tin nhắn..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={sendLocked}
              />
              <button
                type="submit"
                className="ai-chat-send-btn"
                disabled={!inputMessage.trim() || sendLocked}
              >
                Gửi
              </button>
            </form>
          </>
        ) : (
          <div className="ai-chat-no-session">
            <div className="ai-chat-no-session-icon">💬</div>
            <h3>Chọn một phiên trò chuyện</h3>
            <p>Hoặc tạo phiên trò chuyện mới để bắt đầu</p>
            <button
              className="btn ai-chat-start-btn"
              onClick={handleNewSession}
              disabled={creatingSession || newLocked}
            >
              {creatingSession ? "Đang tạo..." : "Bắt đầu trò chuyện mới"}
            </button>
          </div>
        )}
      </div>

      <style>{`
        .ai-chat-container {
          display: flex;
          height: calc(100vh - 140px);
          background: #f8fafc;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .ai-chat-sidebar {
          width: 280px;
          background: white;
          border-right: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
        }

        .ai-chat-sidebar-header {
          padding: 16px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ai-chat-sidebar-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
        }

        .ai-chat-new-btn {
          padding: 6px 12px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .ai-chat-new-btn:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .ai-chat-new-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .ai-chat-session-list {
          flex: 1;
          overflow-y: auto;
        }

        .ai-chat-loading,
        .ai-chat-empty {
          padding: 20px;
          text-align: center;
          color: #64748b;
          font-size: 14px;
        }

        .ai-chat-session-item {
          padding: 12px 16px;
          border-bottom: 1px solid #f1f5f9;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: background 0.2s;
        }

        .ai-chat-session-item:hover {
          background: #f8fafc;
        }

        .ai-chat-session-item.active {
          background: #eff6ff;
          border-left: 3px solid #2563eb;
        }

        .ai-chat-session-info {
          flex: 1;
        }

        .ai-chat-session-time {
          font-size: 13px;
          color: #475569;
        }

        .ai-chat-session-delete {
          padding: 4px 8px;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
          border-radius: 4px;
        }

        .ai-chat-session-delete:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        .ai-chat-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #f8fafc;
        }

        .ai-chat-header {
          padding: 16px 20px;
          background: white;
          border-bottom: 1px solid #e2e8f0;
        }

        .ai-chat-header-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ai-chat-avatar {
          width: 40px;
          height: 40px;
          background: #eff6ff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .ai-chat-header-title {
          font-weight: 600;
          color: #1e293b;
        }

        .ai-chat-header-subtitle {
          font-size: 13px;
          color: #64748b;
        }

        .ai-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .ai-chat-welcome {
          text-align: center;
          padding: 40px 20px;
          color: #64748b;
        }

        .ai-chat-welcome-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .ai-chat-welcome h3 {
          margin: 0 0 8px;
          color: #1e293b;
        }

        .ai-chat-welcome p {
          margin: 0;
        }

        .ai-chat-message {
          display: flex;
          gap: 12px;
          max-width: 80%;
        }

        .ai-chat-message.user {
          margin-left: auto;
          flex-direction: row-reverse;
        }

        .ai-chat-message-avatar {
          width: 32px;
          height: 32px;
          background: #e2e8f0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }

        .ai-chat-message.assistant .ai-chat-message-avatar {
          background: #dbeafe;
        }

        .ai-chat-message-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .ai-chat-message.user .ai-chat-message-content {
          align-items: flex-end;
        }

        .ai-chat-message-bubble {
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .ai-chat-message.assistant .ai-chat-message-bubble {
          background: white;
          color: #1e293b;
          border-bottom-left-radius: 4px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .ai-chat-message.user .ai-chat-message-bubble {
          background: #2563eb;
          color: white;
          border-bottom-right-radius: 4px;
        }

        .ai-chat-message-time {
          font-size: 11px;
          color: #94a3b8;
        }

        .ai-chat-typing {
          display: flex;
          gap: 4px;
          padding: 16px 20px;
        }

        .typing-dot {
          width: 8px;
          height: 8px;
          background: #94a3b8;
          border-radius: 50%;
          animation: typing 1.4s infinite;
        }

        .typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-4px);
          }
        }

        .ai-chat-input-area {
          padding: 16px 20px;
          background: white;
          border-top: 1px solid #e2e8f0;
          display: flex;
          gap: 12px;
        }

        .ai-chat-input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }

        .ai-chat-input:focus {
          border-color: #2563eb;
        }

        .ai-chat-input:disabled {
          background: #f1f5f9;
        }

        .ai-chat-send-btn {
          padding: 12px 24px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .ai-chat-send-btn:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .ai-chat-send-btn:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }

        .ai-chat-no-session {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #64748b;
        }

        .ai-chat-no-session-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }

        .ai-chat-no-session h3 {
          margin: 0 0 8px;
          color: #1e293b;
        }

        .ai-chat-no-session p {
          margin: 0 0 24px;
        }

        .ai-chat-start-btn {
          padding: 12px 24px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }

        .ai-chat-start-btn:hover:not(:disabled) {
          background: #1d4ed8;
        }

        @media (max-width: 768px) {
          .ai-chat-container {
            flex-direction: column;
            height: calc(100vh - 120px);
          }

          .ai-chat-sidebar {
            width: 100%;
            height: 200px;
            border-right: none;
            border-bottom: 1px solid #e2e8f0;
          }

          .ai-chat-message {
            max-width: 90%;
          }
        }
      `}</style>
    </div>
  );
}
