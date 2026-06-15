import { useState, useRef, useEffect, useCallback } from "react";
import { api, apiStream } from "../lib/api";

// ---- 类型 ----

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ConvSummary {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

// ---- 侧边栏 ----

function Sidebar({
  conversations,
  activeId,
  loading,
  onSelect,
  onNew,
  onDelete,
}: {
  conversations: ConvSummary[];
  activeId: number | null;
  loading: boolean;
  onSelect: (id: number) => void;
  onNew: () => void;
  onDelete: (id: number) => void;
}) {
  return (
    <aside className="w-64 shrink-0 h-[calc(100vh-4rem)] overflow-y-auto border-r border-fern/20 bg-snow/50 p-4 flex flex-col">
      {/* 新建按钮 */}
      <button
        onClick={onNew}
        className="w-full py-2.5 mb-4 bg-evergreen text-snow rounded-full text-sm font-medium
          hover:bg-shadow transition-colors duration-200"
      >
        ＋ 新对话
      </button>

      {/* 列表 */}
      {loading ? (
        <p className="text-sage text-xs text-center py-8 animate-pulse">加载中...</p>
      ) : conversations.length === 0 ? (
        <p className="text-sage text-xs text-center py-8">暂无对话</p>
      ) : (
        <div className="flex-1 space-y-1 overflow-y-auto">
          {conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer
                transition-colors text-sm
                ${activeId === c.id
                  ? "bg-evergreen/10 text-evergreen font-medium"
                  : "text-shadow hover:bg-mist"
                }`}
            >
              <span className="truncate flex-1">{c.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                }}
                className="ml-2 text-sage/30 hover:text-amber opacity-0 group-hover:opacity-100
                  transition-all text-xs shrink-0"
                title="删除"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

// ---- 主页面 ----

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [convList, setConvList] = useState<ConvSummary[]>([]);
  const [convLoading, setConvLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const bufferRef = useRef("");

  // 加载对话列表
  const fetchConvList = useCallback(async () => {
    try {
      const data = await api<ConvSummary[]>("/api/chat/history");
      setConvList(data);
    } catch {
      // 忽略
    } finally {
      setConvLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConvList();
  }, [fetchConvList]);

  // 加载单条对话
  const loadConversation = useCallback(async (id: number) => {
    try {
      const data = await api<{ messages: Message[] }>(`/api/chat/${id}`);
      setMessages(data.messages);
      setConversationId(id);
    } catch {
      // 忽略
    }
  }, []);

  // 删除对话
  const deleteConversation = async (id: number) => {
    try {
      await api(`/api/chat/${id}`, { method: "DELETE" });
      setConvList((prev) => prev.filter((c) => c.id !== id));
      if (conversationId === id) {
        setMessages([]);
        setConversationId(null);
      }
    } catch {
      // 忽略
    }
  };

  // 新建对话
  const newConversation = () => {
    setMessages([]);
    setConversationId(null);
  };

  // 滚动到底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 发送消息
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    bufferRef.current = "";

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const reader = await apiStream("/api/chat/send", {
        conversation_id: conversationId,
        message: userMsg.content,
      });

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        bufferRef.current += decoder.decode(value, { stream: true });
        const lines = bufferRef.current.split("\n");
        bufferRef.current = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;
          try {
            const data = JSON.parse(jsonStr);
            if (data.chunk) {
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = {
                  role: "assistant",
                  content: copy[copy.length - 1].content + data.chunk,
                };
                return copy;
              });
            }
            if (data.done && data.conversation_id) {
              setConversationId(data.conversation_id);
              // 刷新列表
              fetchConvList();
            }
            if (data.error) {
              console.error("AI error:", data.error);
            }
          } catch {
            // 跳过
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "连接出错";
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: "assistant",
          content: `抱歉，${msg}，请重试。`,
        };
        return copy;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* 侧边栏 */}
      <Sidebar
        conversations={convList}
        activeId={conversationId}
        loading={convLoading}
        onSelect={loadConversation}
        onNew={newConversation}
        onDelete={deleteConversation}
      />

      {/* 聊天区 */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-sage mt-20">
              <p className="font-serif text-2xl text-shadow mb-3">
                🍃 今天想去哪里旅行？
              </p>
              <p className="text-sm">
                告诉我你的目的地、预算和时间，我帮你规划
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                  ${msg.role === "user"
                    ? "bg-evergreen text-snow rounded-br-md"
                    : "bg-snow text-charcoal rounded-bl-md shadow-[0_2px_8px_rgba(45,90,39,0.06)]"
                  }`}
              >
                {msg.content ||
                  (loading && (
                    <span className="flex gap-1">
                      <span className="w-2 h-2 bg-moss rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-moss rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <span className="w-2 h-2 bg-moss rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </span>
                  ))}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* 输入栏 */}
        <div className="border-t border-fern/50 px-6 py-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入旅行计划需求..."
              disabled={loading}
              className="flex-1 px-4 py-3 bg-snow border border-fern/50 rounded-full
                text-sm focus:outline-none focus:border-moss focus:ring-2 focus:ring-moss/20
                transition-all disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-evergreen text-snow rounded-full font-medium text-sm
                shadow-[0_2px_8px_rgba(45,90,39,0.2)]
                hover:bg-shadow transition-all duration-300
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
