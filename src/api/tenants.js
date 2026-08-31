import { http } from './http'

export function getSettings() {
  return http.get('tenants/settings').then((r) => r.data)
}

export function updateSettings(allowSelfRegistration) {
  return http.put('tenants/settings', { allowSelfRegistration }).then((r) => r.data)
}

export function createTenant(payload) {
  return http.post('tenants', payload).then((r) => r.data)
}
