/** 后端 API 基础地址（开发时通过 Vite proxy 转发，生产时需改为实际地址） */
const BASE_URL = "";

/** 存储 JWT Token */
let token: string | null = localStorage.getItem("token");

export function setToken(t: string | null) {
  token = t;
  if (t) {
    localStorage.setItem("token", t);
  } else {
    localStorage.removeItem("token");
  }
}

export function isLoggedIn(): boolean {
  return !!token;
}

export function getToken(): string | null {
  return token;
}

/** 通用 JSON 请求封装 */
export async function api<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "请求失败" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

/** SSE 流式请求 —— 返回 ReadableStream reader，用于 AI 流式回复等场景 */
export async function apiStream(
  path: string,
  body: Record<string, unknown>,
): Promise<ReadableStreamDefaultReader<Uint8Array>> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ detail: "请求失败" }));
    throw new Error(errData.detail || `HTTP ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("无法读取响应流");
  return reader;
}
