import { useState } from "react";
import { api, isLoggedIn } from "../lib/api";
import { Link } from "react-router-dom";

// ---- 类型 ----

interface DestinationItem {
  id: number;
  destination: string;
  reason: string;
  tags: string[];
  score: number;
  matched_preferences: string;
  weather: string;
}

interface RecommendResponse {
  summary: string;
  destinations: DestinationItem[];
}

// ---- 颜色映射 ----

function scoreColor(s: number): string {
  if (s >= 85) return "bg-moss";
  if (s >= 70) return "bg-evergreen";
  return "bg-amber";
}

function scoreLabel(s: number): string {
  if (s >= 85) return "强烈推荐";
  if (s >= 70) return "推荐";
  return "可考虑";
}

// ---- 页面 ----

export default function RecommendPage() {
  const [travelStyle, setTravelStyle] = useState("");
  const [budget, setBudget] = useState("中等");
  const [season, setSeason] = useState("");
  const [extra, setExtra] = useState("");
  const [result, setResult] = useState<RecommendResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [feedbackMap, setFeedbackMap] = useState<Record<number, string>>({});
  const loggedIn = isLoggedIn();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await api<RecommendResponse>("/api/recommend/generate", {
        method: "POST",
        body: JSON.stringify({
          travel_style: travelStyle.trim(),
          budget,
          season: season.trim(),
          extra: extra.trim(),
        }),
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "推荐失败");
    } finally {
      setLoading(false);
    }
  };

  // ---- 未登录 ----
  if (!loggedIn) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-5xl mb-4">🔮</p>
          <h1 className="font-serif text-2xl text-shadow mb-3">智能推荐</h1>
          <p className="text-sage text-sm mb-6">
            登录后让 AI 根据你的偏好推荐目的地
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="font-serif text-xl sm:text-2xl text-shadow mb-6">🔮 智能推荐</h1>

      {/* 筛选表单 */}
      <form
        onSubmit={handleSubmit}
        className="bg-snow rounded-2xl p-6 shadow-[0_2px_16px_rgba(45,90,39,0.06)] space-y-4 mb-8"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm text-shadow mb-1">旅行风格</label>
            <select
              value={travelStyle}
              onChange={(e) => setTravelStyle(e.target.value)}
              className="w-full px-3 py-2 bg-mist border border-fern/50 rounded-xl text-sm
                focus:outline-none focus:border-moss focus:ring-2 focus:ring-moss/20 transition-all"
            >
              <option value="">不限</option>
              <option value="悠闲度假">悠闲度假</option>
              <option value="探险户外">探险户外</option>
              <option value="文化历史">文化历史</option>
              <option value="美食之旅">美食之旅</option>
              <option value="购物时尚">购物时尚</option>
              <option value="亲子家庭">亲子家庭</option>
              <option value="蜜月浪漫">蜜月浪漫</option>
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
          <div>
            <label className="block text-sm text-shadow mb-1">季节</label>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="w-full px-3 py-2 bg-mist border border-fern/50 rounded-xl text-sm
                focus:outline-none focus:border-moss focus:ring-2 focus:ring-moss/20 transition-all"
            >
              <option value="">不限</option>
              <option value="春季">春季</option>
              <option value="夏季">夏季</option>
              <option value="秋季">秋季</option>
              <option value="冬季">冬季</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-shadow mb-1">额外要求</label>
            <input
              type="text"
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              placeholder="如：不要高海拔..."
              className="w-full px-3 py-2 bg-mist border border-fern/50 rounded-xl text-sm
                focus:outline-none focus:border-moss focus:ring-2 focus:ring-moss/20 transition-all"
            />
          </div>
        </div>

        {error && <p className="text-sm text-amber">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-evergreen text-snow rounded-full font-medium text-sm
            hover:bg-shadow transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "AI 正在分析中..." : "🎯 开始推荐"}
        </button>
      </form>

      {/* 结果 */}
      {result && (
        <div className="space-y-6">
          {/* 摘要 */}
          <div className="bg-snow rounded-2xl p-6 shadow-[0_2px_16px_rgba(45,90,39,0.06)]">
            <p className="text-charcoal text-sm leading-relaxed">{result.summary}</p>
          </div>

          {/* 目的地卡片 */}
          <div className="grid sm:grid-cols-2 gap-4">
            {result.destinations.map((d, i) => (
              <div
                key={i}
                className="bg-snow rounded-2xl p-6 shadow-[0_2px_16px_rgba(45,90,39,0.06)]
                  hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(45,90,39,0.10)]
                  transition-all duration-200"
              >
                {/* 顶部：地名 + 分数 */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-serif text-lg text-shadow">{d.destination}</h3>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-sage">{scoreLabel(d.score)}</span>
                    <span
                      className={`inline-flex items-center justify-center w-10 h-10 rounded-full
                        ${scoreColor(d.score)} text-snow text-sm font-bold`}
                    >
                      {d.score}
                    </span>
                  </div>
                </div>

                {/* 天气 */}
                {d.weather && (
                  <p className="text-xs text-sage mb-2">{d.weather}</p>
                )}

                {/* 推荐理由 */}
                <p className="text-sm text-charcoal leading-relaxed mb-3">
                  {d.reason}
                </p>

                {/* 匹配偏好 */}
                {d.matched_preferences && (
                  <p className="text-xs text-evergreen bg-mist px-3 py-2 rounded-xl mb-3">
                    🎯 {d.matched_preferences}
                  </p>
                )}

                {/* 标签 */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {d.tags.map((t, j) => (
                    <span
                      key={j}
                      className="px-2.5 py-0.5 bg-mist text-sage text-xs rounded-full
                        border border-fern/20"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* 反馈按钮 */}
                <div className="flex gap-2 pt-3 border-t border-fern/20">
                  <button
                    onClick={async () => {
                      setFeedbackMap((prev) => ({ ...prev, [d.id]: "want" }));
                      try {
                        await api(`/api/recommend/${d.id}/feedback`, {
                          method: "POST",
                          body: JSON.stringify({ feedback: "want" }),
                        });
                      } catch { /* 静默失败 */ }
                    }}
                    className={`flex-1 py-1.5 text-xs rounded-full transition-colors
                      ${feedbackMap[d.id] === "want"
                        ? "bg-moss/20 text-moss border border-moss/40"
                        : "bg-mist text-sage border border-transparent hover:border-moss/30"
                      }`}
                  >
                    👍 想去
                  </button>
                  <button
                    onClick={async () => {
                      setFeedbackMap((prev) => ({ ...prev, [d.id]: "not_interested" }));
                      try {
                        await api(`/api/recommend/${d.id}/feedback`, {
                          method: "POST",
                          body: JSON.stringify({ feedback: "not_interested" }),
                        });
                      } catch { /* 静默失败 */ }
                    }}
                    className={`flex-1 py-1.5 text-xs rounded-full transition-colors
                      ${feedbackMap[d.id] === "not_interested"
                        ? "bg-amber/10 text-amber"
                        : "bg-mist text-sage border border-transparent hover:border-amber/30"
                      }`}
                  >
                    👎 不感兴趣
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}