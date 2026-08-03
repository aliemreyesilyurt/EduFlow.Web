import { http } from './http'

const skipRefresh = { _skipAuthRefresh: true }

export function login(email, password) {
  return http.post('auth/login', { email, password }, skipRefresh).then((r) => r.data)
}

export function registerTenant(payload) {
  return http.post('auth/register/tenant', payload, skipRefresh).then((r) => r.data)
}

export function registerStudent(payload) {
  return http.post('auth/register/student', payload, skipRefresh).then((r) => r.data)
}

export function confirmEmail(userId, token) {
  return http.post('auth/confirm-email', { userId, token }, skipRefresh).then((r) => r.data)
}

export function resendConfirmationEmail(email) {
  return http.post('auth/confirm-email/resend', { email }, skipRefresh).then((r) => r.data)
}

export function forgotPassword(email) {
  return http.post('auth/password/forgot', { email }, skipRefresh).then((r) => r.data)
}

export function resetPassword(userId, token, newPassword) {
  return http.post('auth/password/reset', { userId, token, newPassword }, skipRefresh).then((r) => r.data)
}

export function refresh(refreshToken) {
  return http.post('auth/refresh', { refreshToken }, skipRefresh).then((r) => r.data)
}

export function logout(refreshToken) {
  return http.post('auth/logout', { refreshToken }, skipRefresh).then((r) => r.data)
}

export function logoutAll() {
  return http.post('auth/logout-all', null, skipRefresh).then((r) => r.data)
}

export function acceptInvitation(userId, token, password) {
  return http.post('auth/invitations/accept', { userId, token, password }, skipRefresh).then((r) => r.data)
}
