import { useState, useEffect } from "react";
import { api, isLoggedIn } from "../lib/api";
import { Link } from "react-router-dom";

interface Memory {
  id: number;
  category: string;
  key: string;
  value: string;
  confidence: number;
  created_at: string;
}

const CATEGORY_LABELS: Record<string, { emoji: string; label: string }> = {
  destination: { emoji: "🏖️", label: "目的地偏好" },
  budget: { emoji: "💰", label: "预算偏好" },
  travel_style: { emoji: "🎒", label: "旅行风格" },
  food: { emoji: "🍜", label: "饮食偏好" },
  accommodation: { emoji: "🏨", label: "住宿偏好" },
  transportation: { emoji: "🚗", label: "交通偏好" },
  pace: { emoji: "⏳", label: "节奏偏好" },
  companion: { emoji: "👨‍👩‍👧", label: "同行者" },
  season: { emoji: "📅", label: "季节偏好" },
  special_interest: { emoji: "⭐", label: "特别兴趣" },
  language: { emoji: "🗣️", label: "语言偏好" },
  other: { emoji: "📌", label: "其他偏好" },
};

export default function PreferencesPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const loggedIn = isLoggedIn();

  const fetchMemories = async () => {
    try {
      const data = await api<Memory[]>("/api/chat/memories");
      setMemories(data);
    } catch {
      // 未登录或获取失败
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loggedIn) fetchMemories();
    else setLoading(false);
  }, [loggedIn]);

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      await api(`/api/chat/memories/${id}`, { method: "DELETE" });
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch {
      // 删除失败静默处理
    } finally {
      setDeleting(null);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("确定要清空所有偏好记忆吗？此操作不可撤销。")) return;
    try {
      await api("/api/chat/memories/clear", { method: "DELETE" });
      setMemories([]);
    } catch {
      // 清空失败静默处理
    }
  };

  // ---- 按类别分组 ----
  const grouped: Record<string, Memory[]> = {};
  for (const m of memories) {
    (grouped[m.category] ??= []).push(m);
  }

  // ---- 未登录 ----
  if (!loggedIn) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-5xl mb-4">🧠</p>
          <h1 className="font-serif text-2xl text-shadow mb-3">我的偏好</h1>
          <p className="text-sage text-sm mb-6">
            登录后才能查看 AI 学到的偏好
          </p>
          <Link
            to="/login"
            className="inline-block px-6 py-2.5 bg-evergreen text-snow rounded-full text-sm
              hover:bg-shadow transition-all duration-300"
          >
            去登录
          </Link>
        </div>
      </div>
    );
  }

  // ---- 加载中 ----
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <p className="text-sage animate-pulse">正在加载偏好...</p>
      </div>
    );
  }

  // ---- 无偏好 ----
  if (memories.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center">
          <p className="text-5xl mb-4">🧠</p>
          <h1 className="font-serif text-2xl text-shadow mb-3">我的偏好</h1>
          <p className="text-sage text-sm mb-6">
            AI 还没有学到你的旅行偏好。去和「小游」聊聊天吧，它会自动从对话中学习你的喜好。
          </p>
          <Link
            to="/chat"
            className="inline-block px-6 py-2.5 bg-evergreen text-snow rounded-full text-sm
              hover:bg-shadow transition-all duration-300"
          >
            开始对话
          </Link>
        </div>
      </div>
    );
  }

  // ---- 有偏好 ----
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl text-shadow mb-1">
            🧠 我的偏好
          </h1>
          <p className="text-sage text-sm">
            AI 从对话中自动学习的旅行偏好（共 {memories.length} 条）
          </p>
        </div>
        <button
          onClick={handleClearAll}
          className="px-4 py-2 text-sm text-amber border border-amber/30 rounded-full
            hover:bg-amber/5 transition-all duration-300"
        >
          清空全部
        </button>
      </div>

      {/* 按类别展示 */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([cat, items]) => {
          const info = CATEGORY_LABELS[cat] ?? { emoji: "📌", label: cat };

          return (
            <section
              key={cat}
              className="bg-snow rounded-2xl p-6 shadow-[0_2px_16px_rgba(45,90,39,0.06)]"
            >
              <h2 className="font-serif text-lg text-shadow mb-4">
                {info.emoji} {info.label}
                <span className="ml-2 text-sage text-sm font-sans">
                  ({items.length} 条)
                </span>
              </h2>
              <div className="space-y-3">
                {items.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between py-2.5 px-4
                      bg-mist rounded-xl border border-fern/20
                      hover:border-fern/50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-shadow font-medium">{m.key}</p>
                      <p className="text-sm text-sage mt-0.5 truncate">
                        {m.value}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      {/* 置信度指示器 */}
                      <div className="hidden sm:flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-fern/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-moss rounded-full transition-all"
                            style={{
                              width: `${Math.round(m.confidence * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-sage">
                          {Math.round(m.confidence * 100)}%
                        </span>
                      </div>
                      {/* 删除按钮 */}
                      <button
                        onClick={() => handleDelete(m.id)}
                        disabled={deleting === m.id}
                        className="text-sage/40 hover:text-amber transition-colors
                          opacity-0 group-hover:opacity-100 text-sm leading-none p-1"
                        title="删除此偏好"
                      >
                        {deleting === m.id ? "..." : "✕"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
