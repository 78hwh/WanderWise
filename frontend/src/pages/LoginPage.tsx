import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setToken, api } from '../lib/api'

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login'
      const body: Record<string, string> = isRegister
        ? { username, email, password }
        : { email, password }

      const data = await api<{ access_token: string; detail?: string }>(
        endpoint,
        { method: 'POST', body: JSON.stringify(body) },
      )

      // 注册成功后自动切换到登录
      if (isRegister) {
        setIsRegister(false)
        setError('注册成功！请登录')
        setPassword('')
        return
      }

      // 登录成功
      setToken(data.access_token)
      navigate('/chat')
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100dvh-7rem)] md:min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 sm:px-6 py-8">
      <div className="w-full max-w-md">
        {/* 标题 */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="font-serif text-2xl sm:text-3xl text-shadow mb-2">
            {isRegister ? '加入 WanderWise' : '欢迎回来'}
          </h1>
          <p className="text-sage text-sm">
            {isRegister ? '创建账户，开始你的智能旅行' : '登录继续你的旅行规划'}
          </p>
        </div>

        {/* 表单 */}
        <form
          onSubmit={handleSubmit}
          className="bg-snow rounded-2xl p-6 sm:p-8 shadow-[0_2px_16px_rgba(45,90,39,0.06)] space-y-4 sm:space-y-5"
        >
          {isRegister && (
            <div>
              <label className="block text-sm text-shadow mb-1.5">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={2}
                placeholder="你的名字"
                className="w-full px-4 py-2.5 bg-mist border border-fern/50 rounded-xl text-sm
                  focus:outline-none focus:border-moss focus:ring-2 focus:ring-moss/20 transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-shadow mb-1.5">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              className="w-full px-4 py-2.5 bg-mist border border-fern/50 rounded-xl text-sm
                focus:outline-none focus:border-moss focus:ring-2 focus:ring-moss/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm text-shadow mb-1.5">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="至少 6 位"
              className="w-full px-4 py-2.5 bg-mist border border-fern/50 rounded-xl text-sm
                focus:outline-none focus:border-moss focus:ring-2 focus:ring-moss/20 transition-all"
            />
          </div>

          {error && (
            <p className={`text-sm ${error.includes('成功') ? 'text-moss' : 'text-amber'}`}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-evergreen text-snow rounded-full font-medium text-sm
              shadow-[0_2px_8px_rgba(45,90,39,0.2)]
              hover:bg-shadow transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '请稍候...' : isRegister ? '注册' : '登录'}
          </button>

          <p className="text-center text-sm text-sage">
            {isRegister ? '已有账户？' : '还没有账户？'}
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister)
                setError('')
              }}
              className="ml-1 text-evergreen hover:text-shadow transition-colors font-medium"
            >
              {isRegister ? '去登录' : '去注册'}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
