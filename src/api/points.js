import { http } from './http'

export function getMyWallet() {
  return http.get('points/wallet').then((r) => r.data)
}

export function getMyLedger() {
  return http.get('points/ledger').then((r) => r.data.entries)
}

export function getPointsRules() {
  return http.get('points/rules').then((r) => r.data.rules)
}

export function getTenantPointsRules() {
  return http.get('tenants/points-rules').then((r) => r.data.rules)
}

export function createPointsRule({ title, description, pointsCost, isActive }) {
  return http.post('tenants/points-rules', { title, description, pointsCost, isActive }).then((r) => r.data)
}

export function updatePointsRule(ruleId, { title, description, pointsCost, isActive }) {
  return http.put(`tenants/points-rules/${ruleId}`, { title, description, pointsCost, isActive }).then((r) => r.data)
}

export function deletePointsRule(ruleId) {
  return http.delete(`tenants/points-rules/${ruleId}`)
}
