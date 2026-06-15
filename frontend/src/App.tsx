import { Routes, Route, Navigate, Link } from "react-router-dom";
import Header from "./components/layout/Header";
import HomePage from "./pages/HomePage";
import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import PreferencesPage from "./pages/PreferencesPage";
import ItineraryPage from "./pages/ItineraryPage";
import RecommendPage from "./pages/RecommendPage";
import TranslatePage from "./pages/TranslatePage";
import { isLoggedIn } from "./lib/api";

/** 路由守卫：未登录重定向到 /login */
function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

/** 已登录时访问登录页，重定向到 /chat */
function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  if (isLoggedIn()) {
    return <Navigate to="/chat" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <div className="min-h-screen bg-mist pb-14 md:pb-0">
      <Header />
      <main className="safe-top safe-bottom">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/chat"
            element={
              <RequireAuth>
                <ChatPage />
              </RequireAuth>
            }
          />
          <Route
            path="/login"
            element={
              <RedirectIfAuth>
                <LoginPage />
              </RedirectIfAuth>
            }
          />
          <Route
            path="/preferences"
            element={
              <RequireAuth>
                <PreferencesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/itinerary"
            element={
              <RequireAuth>
                <ItineraryPage />
              </RequireAuth>
            }
          />
          <Route
            path="/recommend"
            element={
              <RequireAuth>
                <RecommendPage />
              </RequireAuth>
            }
          />
          <Route
            path="/translate"
            element={
              <RequireAuth>
                <TranslatePage />
              </RequireAuth>
            }
          />
          {/* 404 catch-all */}
          <Route path="*" element={
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6">
              <div className="text-center">
                <p className="text-5xl mb-4">🗺️</p>
                <h1 className="font-serif text-2xl text-shadow mb-3">页面未找到</h1>
                <p className="text-sage text-sm mb-6">你访问的页面不存在，可能已经搬家了</p>
                <Link to="/" className="inline-block px-6 py-2.5 bg-evergreen text-snow rounded-full text-sm hover:bg-shadow transition-all">
                  返回首页
                </Link>
              </div>
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
}

export default App;