import { Link, useNavigate, useLocation } from "react-router-dom";
import { getToken, setToken } from "../../lib/api";
import { useState, useEffect } from "react";

type NavLink = { to: string; label: string; icon: string };

const NAV_LINKS: NavLink[] = [
  { to: "/", label: "首页", icon: "🏠" },
  { to: "/chat", label: "对话", icon: "💬" },
  { to: "/preferences", label: "偏好", icon: "🧠" },
  { to: "/itinerary", label: "行程", icon: "🗺️" },
  { to: "/recommend", label: "推荐", icon: "🔮" },
  { to: "/translate", label: "翻译", icon: "🌐" },
];

const BOTTOM_NAV: NavLink[] = [
  { to: "/", label: "首页", icon: "🏠" },
  { to: "/chat", label: "对话", icon: "💬" },
  { to: "/itinerary", label: "行程", icon: "🗺️" },
  { to: "/preferences", label: "我的", icon: "👤" },
];

export default function Header() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setLoggedIn(!!getToken());
  }, [location.pathname]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setToken(null);
    setLoggedIn(false);
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <>
      {/* ====== Top Header ====== */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-mist/70 border-b border-fern/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link to="/" className="font-serif text-lg sm:text-xl text-shadow tracking-wide shrink-0">
            🌿 WanderWise
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-5 text-sm">
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

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
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

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl
              text-shadow hover:bg-fern/20 transition-colors"
            aria-label={menuOpen ? "关闭菜单" : "打开菜单"}
          >
            <span className="text-xl">{menuOpen ? "✕" : "☰"}</span>
          </button>
        </div>
      </header>

      {/* ====== Mobile Slide-out Drawer ====== */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-shadow/40 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          {/* Drawer */}
          <nav className="absolute right-0 top-0 h-full w-64 bg-snow shadow-2xl p-6 pt-20 flex flex-col animate-[slideIn_200ms_ease-out]">
            <div className="space-y-1 flex-1">
              {NAV_LINKS.map(({ to, label, icon }) => {
                const active = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm transition-colors min-h-[44px]
                      ${active
                        ? "bg-evergreen/10 text-evergreen font-medium"
                        : "text-shadow hover:bg-mist"
                      }`}
                  >
                    <span className="text-lg">{icon}</span>
                    {label}
                  </Link>
                );
              })}
            </div>
            <div className="pt-4 border-t border-fern/20">
              {loggedIn ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm text-sage
                    hover:text-amber hover:bg-mist transition-colors w-full min-h-[44px]"
                >
                  <span className="text-lg">🚪</span>
                  退出登录
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm text-evergreen
                    hover:bg-mist transition-colors min-h-[44px]"
                >
                  <span className="text-lg">🔑</span>
                  登录
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}

      {/* ====== Mobile Bottom Tab Bar ====== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-snow/90 backdrop-blur-md
        border-t border-fern/20 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="flex items-center justify-around h-14">
          {BOTTOM_NAV.map(({ to, label, icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full
                  min-h-[44px] transition-colors
                  ${active
                    ? "text-evergreen"
                    : "text-sage hover:text-evergreen"
                  }`}
              >
                <span className="text-lg leading-none">{icon}</span>
                <span className="text-[10px] leading-none">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
