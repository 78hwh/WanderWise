import { Link } from "react-router-dom";
import { isLoggedIn } from "../lib/api";

export default function HomePage() {
  const loggedIn = isLoggedIn();

  return (
    <div className="max-w-5xl mx-auto px-6 py-20">
      {/* Hero */}
      <section className="text-center mb-20">
        <h1 className="font-serif text-4xl md:text-6xl text-shadow mb-6 leading-tight">
          让每一次出发
          <br />
          <span className="text-evergreen">都充满期待</span>
        </h1>
        <p className="text-sage text-lg max-w-xl mx-auto leading-relaxed">
          智能旅行助手，懂你的喜好，记你的足迹。从规划到出发，一路相伴。
        </p>
        <Link
          to={loggedIn ? "/chat" : "/login"}
          className="inline-block mt-8 px-8 py-3 bg-evergreen text-snow rounded-full
            shadow-[0_2px_8px_rgba(45,90,39,0.2)]
            hover:bg-shadow transition-all duration-300 ease-out
            hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(45,90,39,0.3)]"
        >
          开始规划行程
        </Link>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-6 mb-20">
        {[
          { icon: "🗺️", title: "智能行程", desc: "AI 驱动的个性化行程规划，一键生成" },
          { icon: "🧠", title: "记忆偏好", desc: "越用越懂你，自动学习你的旅行偏好" },
          { icon: "💬", title: "对话交互", desc: "像和朋友聊天一样规划旅行" },
        ].map((f) => (
          <div
            key={f.title}
            className="bg-snow rounded-xl p-6
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