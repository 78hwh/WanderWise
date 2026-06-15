import { Link } from "react-router-dom";
import { isLoggedIn } from "../lib/api";

export default function HomePage() {
  const loggedIn = isLoggedIn();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      {/* Hero */}
      <section className="text-center mb-12 sm:mb-20">
        <h1 className="font-serif text-3xl sm:text-4xl md:text-6xl text-shadow mb-4 sm:mb-6 leading-tight">
          让每一次出发
          <br />
          <span className="text-evergreen">都充满期待</span>
        </h1>
        <p className="text-sage text-base sm:text-lg max-w-xl mx-auto leading-relaxed px-4">
          智能旅行助手，懂你的喜好，记你的足迹。从规划到出发，一路相伴。
        </p>
        <Link
          to={loggedIn ? "/chat" : "/login"}
          className="inline-block mt-6 sm:mt-8 px-6 sm:px-8 py-3 bg-evergreen text-snow rounded-full
            text-sm sm:text-base
            shadow-[0_2px_8px_rgba(45,90,39,0.2)]
            hover:bg-shadow transition-all duration-300 ease-out
            hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(45,90,39,0.3)]
            min-h-[44px] flex items-center"
        >
          开始规划行程
        </Link>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-16 sm:mb-20 px-0 sm:px-0">
        {[
          { icon: "🗺️", title: "智能行程", desc: "AI 驱动的个性化行程规划，一键生成" },
          { icon: "🧠", title: "记忆偏好", desc: "越用越懂你，自动学习你的旅行偏好" },
          { icon: "💬", title: "对话交互", desc: "像和朋友聊天一样规划旅行" },
        ].map((f) => (
          <div
            key={f.title}
            className="bg-snow rounded-xl p-5 sm:p-6
              shadow-[0_2px_16px_rgba(45,90,39,0.06)]
              hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(45,90,39,0.10)]
              transition-all duration-300 ease-out"
          >
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-serif text-lg text-shadow mb-2">{f.title}</h3>
            <p className="text-sage text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
