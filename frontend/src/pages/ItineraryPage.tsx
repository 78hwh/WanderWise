import { useState, useEffect } from "react";
import { api, isLoggedIn } from "../lib/api";
import { Link } from "react-router-dom";

// ---- 类型 ----

interface Activity {
  time: string;
  name: string;
  description: string;
  tips: string;
}

interface Meal {
  type: string;
  name: string;
  description: string;
}

interface DayPlan {
  day: number;
  title: string;
  activities: Activity[];
  meals: Meal[];
  accommodation: string;
  notes: string;
}

interface ItineraryContent {
  overview: string;
  budget_estimate: string;
  days: DayPlan[];
  general_tips: string[];
}

interface ItineraryItem {
  id: number;
  title: string;
  destination: string;
  days: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ItineraryDetail extends ItineraryItem {
  content: ItineraryContent;
}

// ---- 生成表单 ----

function GenerateForm({
  onGenerated,
}: {
  onGenerated: (id: number) => void;
}) {
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState("中等");
  const [extra, setExtra] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;
    setError("");
    setLoading(true);

    try {
      const data = await api<ItineraryDetail>("/api/itinerary/generate", {
        method: "POST",
        body: JSON.stringify({
          destination: destination.trim(),
          days,
          budget,
          extra_requirements: extra.trim(),
        }),
      });
      onGenerated(data.id);
      setDestination("");
      setExtra("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-snow rounded-2xl p-6 shadow-[0_2px_16px_rgba(45,90,39,0.06)] space-y-4"
    >
      <h2 className="font-serif text-lg text-shadow">✨ 生成新行程</h2>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-shadow mb-1">目的地 *</label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="如：云南大理"
            required
            className="w-full px-3 py-2 bg-mist border border-fern/50 rounded-xl text-sm
              focus:outline-none focus:border-moss focus:ring-2 focus:ring-moss/20 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm text-shadow mb-1">天数</label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-full px-3 py-2 bg-mist border border-fern/50 rounded-xl text-sm
              focus:outline-none focus:border-moss focus:ring-2 focus:ring-moss/20 transition-all"
          >
            {[1, 2, 3, 4, 5, 7, 10, 14].map((d) => (
              <option key={d} value={d}>{d} 天</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-shadow mb-1">预算</label>
          <select
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="w-full px-3 py-2 bg-mist border border-fern/50 rounded-xl text-sm
              focus:outline-none focus:border-moss focus:ring-2 focus:ring-moss/20 transition-all"
          >
            <option value="经济">经济</option>
            <option value="中等">中等</option>
            <option value="豪华">豪华</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm text-shadow mb-1">额外需求</label>
        <input
          type="text"
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          placeholder="如：带老人、喜欢徒步、不要购物点..."
          className="w-full px-3 py-2 bg-mist border border-fern/50 rounded-xl text-sm
            focus:outline-none focus:border-moss focus:ring-2 focus:ring-moss/20 transition-all"
        />
      </div>

      {error && <p className="text-sm text-amber">{error}</p>}

      <button
        type="submit"
        disabled={loading || !destination.trim()}
        className="w-full py-2.5 bg-evergreen text-snow rounded-full font-medium text-sm
          hover:bg-shadow transition-all duration-300
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "AI 正在规划中..." : "开始生成"}
      </button>
    </form>
  );
}

// ---- 行程详情卡片 ----

function ItineraryDetailView({ id }: { id: number }) {
  const [detail, setDetail] = useState<ItineraryDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api<ItineraryDetail>(`/api/itinerary/${id}`);
        setDetail(data);
      } catch {
        // 获取失败
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-sage animate-pulse">加载行程详情...</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="text-center py-12">
        <p className="text-sage">行程加载失败</p>
      </div>
    );
  }

  const { content } = detail;

  return (
    <div className="space-y-6">
      {/* 行程概览 */}
      <section className="bg-snow rounded-2xl p-6 shadow-[0_2px_16px_rgba(45,90,39,0.06)]">
        <h2 className="font-serif text-xl text-shadow mb-1">{detail.title}</h2>
        <p className="text-sage text-sm mb-3">
          {detail.destination} · {detail.days} 天 · 创建于{" "}
          {new Date(detail.created_at).toLocaleDateString("zh-CN")}
        </p>
        <p className="text-charcoal text-sm leading-relaxed mb-2">
          {content.overview}
        </p>
        <p className="text-sage text-sm">{content.budget_estimate}</p>
      </section>

      {/* Day by Day */}
      {content.days.map((day) => (
        <section
          key={day.day}
          className="bg-snow rounded-2xl p-6 shadow-[0_2px_16px_rgba(45,90,39,0.06)]"
        >
          <h3 className="font-serif text-lg text-shadow mb-4">
            📅 第 {day.day} 天
            {day.title && (
              <span className="ml-2 text-evergreen">— {day.title}</span>
            )}
          </h3>

          {/* 活动时间线 */}
          <div className="space-y-3 mb-4">
            {day.activities.map((act, i) => (
              <div key={i} className="flex gap-3">
                <div className="shrink-0 w-20 pt-0.5">
                  <span className="text-xs text-sage bg-mist px-2 py-0.5 rounded-full">
                    {act.time || "全天"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-shadow font-medium">{act.name}</p>
                  {act.description && (
                    <p className="text-sm text-sage mt-0.5">
                      {act.description}
                    </p>
                  )}
                  {act.tips && (
                    <p className="text-xs text-amber mt-0.5">💡 {act.tips}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 餐饮 */}
          {day.meals.length > 0 && (
            <div className="border-t border-fern/20 pt-3 mb-3">
              <p className="text-xs text-sage mb-2">🍽️ 推荐餐饮</p>
              <div className="flex flex-wrap gap-2">
                {day.meals.map((m, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-mist rounded-full text-xs text-shadow"
                  >
                    {m.type}: {m.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 住宿 */}
          {day.accommodation && (
            <div className="border-t border-fern/20 pt-3 mb-3">
              <p className="text-xs text-sage">
                🏨 住宿：{day.accommodation}
              </p>
            </div>
          )}

          {/* 备注 */}
          {day.notes && (
            <div className="border-t border-fern/20 pt-3">
              <p className="text-xs text-sage">📝 {day.notes}</p>
            </div>
          )}
        </section>
      ))}

      {/* 通用贴士 */}
      {content.general_tips.length > 0 && (
        <section className="bg-snow rounded-2xl p-6 shadow-[0_2px_16px_rgba(45,90,39,0.06)]">
          <h3 className="font-serif text-lg text-shadow mb-3">💡 旅行贴士</h3>
          <ul className="space-y-2">
            {content.general_tips.map((tip, i) => (
              <li key={i} className="flex gap-2 text-sm text-sage">
                <span className="text-moss shrink-0">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// ---- 页面主体 ----

export default function ItineraryPage() {
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const loggedIn = isLoggedIn();

  const fetchItems = async () => {
    try {
      const data = await api<ItineraryItem[]>("/api/itinerary");
      setItems(data);
    } catch {
      // 获取失败
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loggedIn) fetchItems();
    else setLoading(false);
  }, [loggedIn]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("确定删除此行程？")) return;
    setDeleting(id);
    try {
      await api(`/api/itinerary/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch {
      // 删除失败
    } finally {
      setDeleting(null);
    }
  };

  // ---- 未登录 ----
  if (!loggedIn) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-5xl mb-4">🗺️</p>
          <h1 className="font-serif text-2xl text-shadow mb-3">我的行程</h1>
          <p className="text-sage text-sm mb-6">
            登录后查看和生成 AI 行程规划
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

  // ---- 主界面 ----
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="font-serif text-2xl text-shadow mb-6">🗺️ 我的行程</h1>

      {/* 生成表单 */}
      <div className="mb-8">
        <GenerateForm
          onGenerated={(id) => {
            fetchItems();
            setSelectedId(id);
          }}
        />
      </div>

      {/* 选中行程的详情 */}
      {selectedId && (
        <div className="mb-8">
          <button
            onClick={() => setSelectedId(null)}
            className="text-sm text-sage hover:text-evergreen transition-colors mb-4"
          >
            ← 返回列表
          </button>
          <ItineraryDetailView id={selectedId} />
        </div>
      )}

      {/* 行程列表 */}
      {!selectedId && (
        <>
          {loading ? (
            <p className="text-sage text-center py-8 animate-pulse">
              加载行程列表...
            </p>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sage text-sm">
                还没有行程。在上面填写目的地，让 AI 帮你规划一个吧！
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className="bg-snow rounded-2xl p-5 shadow-[0_2px_16px_rgba(45,90,39,0.06)]
                    hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(45,90,39,0.10)]
                    transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-serif text-shadow mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-sage">
                        {item.destination} · {item.days} 天
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      disabled={deleting === item.id}
                      className="text-sage/40 hover:text-amber transition-colors text-sm"
                      title="删除"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-xs text-sage mt-3">
                    {new Date(item.created_at).toLocaleDateString("zh-CN")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}