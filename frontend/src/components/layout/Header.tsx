import { Link, useNavigate, useLocation } from "react-router-dom";
import { getToken, setToken } from "../../lib/api";
import { useState, useEffect } from "react";

type NavLink = { to: string; label: string };

const NAV_LINKS: NavLink[] = [
  { to: "/", label: "首页" },
  { to: "/chat", label: "对话" },
  { to: "/preferences", label: "偏好" },
  { to: "/itinerary", label: "行程" },
  { to: "/recommend", label: "推荐" },
  { to: "/translate", label: "翻译" },
];

export default function Header() {
  const [loggedIn, setLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setLoggedIn(!!getToken());
  }, [location.pathname]);

  const handleLogout = () => {
    setToken(null);
    setLoggedIn(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-mist/70 border-b border-fern/50">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-serif text-xl text-shadow tracking-wide">
          🌿 WanderWise
        </Link>

        <nav className="flex gap-6 text-sm">
          {NAV_LINKS.map(({ to, label }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`transition-colors ${
                  active
                    ? "text-evergreen font-medium"
                    : "text-sage hover:text-evergreen"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {loggedIn ? (
            <button
              onClick={handleLogout}
              className="text-sm text-sage hover:text-amber transition-colors"
            >
              退出
            </button>
          ) : (
            <Link
              to="/login"
              className="text-sm text-evergreen hover:text-shadow transition-colors"
            >
              登录
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}