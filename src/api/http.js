import axios from 'axios'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

let refreshPromise = null
let onAuthExpired = () => {}

export function setAuthExpiredHandler(handler) {
  onAuthExpired = handler
}

// Lazy import to avoid a circular dependency at module-init time between
// http.js <-> stores/auth.js <-> api/auth.js (which itself uses http.js).
async function getAuthStore() {
  const { useAuthStore } = await import('@/stores/auth')
  return useAuthStore()
}

http.interceptors.request.use(async (config) => {
  if (!config._skipAuth) {
    const auth = await getAuthStore()
    if (auth.accessToken) {
      config.headers.Authorization = `Bearer ${auth.accessToken}`
    }
  }

  return config
})

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error

    if (!config || !response || response.status !== 401 || config._skipAuthRefresh || config._retried) {
      return Promise.reject(error)
    }

    const auth = await getAuthStore()

    if (!auth.refreshToken) {
      auth.clearSession()
      onAuthExpired()
      return Promise.reject(error)
    }

    config._retried = true

    try {
      refreshPromise ??= auth.refresh().finally(() => {
        refreshPromise = null
      })
      await refreshPromise

      config.headers.Authorization = `Bearer ${auth.accessToken}`
      return http(config)
    } catch (refreshError) {
      auth.clearSession()
      onAuthExpired()
      return Promise.reject(refreshError)
    }
  },
)
