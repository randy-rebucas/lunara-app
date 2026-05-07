'use client'

const ACCESS_MAX_AGE  = 60 * 15           // 15 min
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export function setTokens(accessToken: string, refreshToken: string) {
  document.cookie = `access_token=${accessToken}; path=/; max-age=${ACCESS_MAX_AGE}; SameSite=Strict`
  document.cookie = `refresh_token=${refreshToken}; path=/; max-age=${REFRESH_MAX_AGE}; SameSite=Strict`
}

export function clearTokens() {
  document.cookie = 'access_token=; path=/; max-age=0'
  document.cookie = 'refresh_token=; path=/; max-age=0'
}

export function getAccessToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|; )access_token=([^;]+)/)
  return match?.[1] ?? null
}

function getRefreshToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|; )refresh_token=([^;]+)/)
  return match?.[1] ?? null
}

let refreshPromise: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  // Deduplicate concurrent refresh attempts
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return false
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      const data = (await res.json()) as {
        success: boolean
        data?: { accessToken: string; refreshToken: string }
      }
      if (!data.success || !data.data) return false
      setTokens(data.data.accessToken, data.data.refreshToken)
      return true
    } catch {
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const doFetch = (token: string | null) =>
    fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers ?? {}),
      },
    })

  const res = await doFetch(getAccessToken())

  // Auto-refresh once on 401 and retry
  if (res.status === 401) {
    const refreshed = await refreshAccessToken()
    if (refreshed) return doFetch(getAccessToken())
    // Refresh failed → clear stale tokens so the next navigation triggers middleware login
    clearTokens()
  }

  return res
}
