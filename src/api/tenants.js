import { http } from './http'

export function getSettings() {
  return http.get('tenants/settings').then((r) => r.data)
}

export function updateSettings({ allowSelfRegistration, proctoringConsentText, proctoringRetentionDays }) {
  return http
    .put('tenants/settings', { allowSelfRegistration, proctoringConsentText, proctoringRetentionDays })
    .then((r) => r.data)
}

export function createTenant(payload) {
  return http.post('tenants', payload).then((r) => r.data)
}
