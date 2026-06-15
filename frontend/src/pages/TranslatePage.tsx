import { useState } from "react";
import { api } from "../lib/api";

// 常用语言
const LANGUAGES = [
  { code: "中文", label: "中文" },
  { code: "English", label: "English" },
  { code: "日本語", label: "日本語" },
  { code: "한국어", label: "한국어" },
  { code: "Français", label: "Français" },
  { code: "Deutsch", label: "Deutsch" },
  { code: "Español", label: "Español" },
  { code: "Italiano", label: "Italiano" },
  { code: "Português", label: "Português" },
  { code: "Русский", label: "Русский" },
  { code: "العربية", label: "العربية" },
  { code: "ไทย", label: "ไทย" },
];

export default function TranslatePage() {
  const [text, setText] = useState("");
  const [targetLang, setTargetLang] = useState("English");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTranslate = async () => {
    if (!text.trim() || loading) return;
    setError("");
    setLoading(true);

    try {
      const data = await api<{ translated: string }>("/api/translate", {
        method: "POST",
        body: JSON.stringify({
          text: text.trim(),
          target_lang: targetLang,
          source_lang: "auto",
        }),
      });
      setResult(data.translated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "翻译失败");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleTranslate();
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="font-serif text-xl sm:text-2xl text-shadow mb-6">🌐 翻译</h1>

      {/* 源语言文本 */}
      <div className="mb-4">
        <label className="block text-sm text-shadow mb-1.5">输入文本</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入要翻译的文字..."
          rows={4}
          className="w-full px-4 py-3 bg-snow border border-fern/50 rounded-xl text-sm
            focus:outline-none focus:border-moss focus:ring-2 focus:ring-moss/20
            transition-all resize-none"
        />
      </div>

      {/* 目标语言选择 */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4">
        <span className="text-sm text-sage shrink-0">翻译为</span>
        <div className="flex items-center gap-2">
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="flex-1 sm:w-auto px-3 py-2 bg-snow border border-fern/50 rounded-xl text-sm
              focus:outline-none focus:border-moss focus:ring-2 focus:ring-moss/20 transition-all min-h-[44px]"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleTranslate}
            disabled={loading || !text.trim()}
            className="px-5 py-2 bg-evergreen text-snow rounded-full font-medium text-sm
              hover:bg-shadow transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] shrink-0"
          >
            {loading ? "翻译中..." : "翻译"}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-amber mb-4">{error}</p>}

      {/* 结果 */}
      {result && (
        <div className="bg-snow rounded-2xl p-6 shadow-[0_2px_16px_rgba(45,90,39,0.06)]">
          <p className="text-xs text-sage mb-2">译文</p>
          <p className="text-charcoal text-sm leading-relaxed whitespace-pre-wrap">
            {result}
          </p>
        </div>
      )}
    </div>
  );
}