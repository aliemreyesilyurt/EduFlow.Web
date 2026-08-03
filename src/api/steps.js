import { http } from './http'

export function getSteps(courseId) {
  return http.get(`courses/${courseId}/steps`).then((r) => r.data.steps)
}

export function getStepById(id) {
  return http.get(`steps/${id}`).then((r) => r.data)
}
