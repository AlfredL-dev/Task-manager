// Central fetch wrapper. Attaches the Bearer token and normalises errors
// so every caller gets a consistent ApiError instead of raw Response objects.

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function getToken(): string | null {
  return localStorage.getItem('token')
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(path, { ...options, headers })

  if (!res.ok) {
    // Try to extract a message from the response body; fall back to status text
    let message = res.statusText
    try {
      const body = await res.json()
      message = body?.message ?? body?.title ?? message
    } catch {
      // ignore parse error — use statusText
    }
    throw new ApiError(res.status, message)
  }

  // 204 No Content — nothing to parse
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
