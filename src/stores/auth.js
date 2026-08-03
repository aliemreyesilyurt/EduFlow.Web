import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { jwtDecode } from 'jwt-decode'
import * as authApi from '@/api/auth'

const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
const NAME_ID_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
const TENANT_CLAIM = 'tenant_id'

const STORAGE_KEYS = {
  accessToken: 'eduflow.accessToken',
  refreshToken: 'eduflow.refreshToken',
  accessTokenExpiresOn: 'eduflow.accessTokenExpiresOn',
}

function decodeUser(accessToken) {
  if (!accessToken) {
    return null
  }

  const payload = jwtDecode(accessToken)
  const rolesClaim = payload[ROLE_CLAIM]
  const roles = Array.isArray(rolesClaim) ? rolesClaim : rolesClaim ? [rolesClaim] : []

  return {
    id: payload[NAME_ID_CLAIM],
    email: payload.email,
    roles,
    tenantId: payload[TENANT_CLAIM] ?? null,
  }
}

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(localStorage.getItem(STORAGE_KEYS.accessToken))
  const refreshToken = ref(localStorage.getItem(STORAGE_KEYS.refreshToken))
  const accessTokenExpiresOn = ref(localStorage.getItem(STORAGE_KEYS.accessTokenExpiresOn))
  const user = ref(decodeUser(accessToken.value))

  const isAuthenticated = computed(() => !!accessToken.value)
  const roles = computed(() => user.value?.roles ?? [])

  function hasRole(...names) {
    return names.some((role) => roles.value.includes(role))
  }

  function setSession(tokens) {
    accessToken.value = tokens.accessToken
    refreshToken.value = tokens.refreshToken
    accessTokenExpiresOn.value = tokens.accessTokenExpiresOn
    localStorage.setItem(STORAGE_KEYS.accessToken, tokens.accessToken)
    localStorage.setItem(STORAGE_KEYS.refreshToken, tokens.refreshToken)
    localStorage.setItem(STORAGE_KEYS.accessTokenExpiresOn, tokens.accessTokenExpiresOn)
    user.value = decodeUser(tokens.accessToken)
  }

  function clearSession() {
    accessToken.value = null
    refreshToken.value = null
    accessTokenExpiresOn.value = null
    user.value = null
    localStorage.removeItem(STORAGE_KEYS.accessToken)
    localStorage.removeItem(STORAGE_KEYS.refreshToken)
    localStorage.removeItem(STORAGE_KEYS.accessTokenExpiresOn)
  }

  async function login(email, password) {
    setSession(await authApi.login(email, password))
  }

  async function refresh() {
    if (!refreshToken.value) {
      throw new Error('No refresh token available')
    }

    const tokens = await authApi.refresh(refreshToken.value)
    setSession(tokens)
    return tokens
  }

  async function logout() {
    if (refreshToken.value) {
      try {
        await authApi.logout(refreshToken.value)
      } catch {
        // best-effort revoke; clear the local session regardless
      }
    }

    clearSession()
  }

  async function logoutAll() {
    try {
      await authApi.logoutAll()
    } catch {
      // best-effort revoke; clear the local session regardless
    }

    clearSession()
  }

  return {
    accessToken,
    refreshToken,
    user,
    isAuthenticated,
    roles,
    hasRole,
    setSession,
    clearSession,
    login,
    refresh,
    logout,
    logoutAll,
  }
})
