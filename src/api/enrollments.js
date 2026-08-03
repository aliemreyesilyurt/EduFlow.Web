import { http } from './http'

export function enroll(courseId) {
  return http.post(`courses/${courseId}/enroll`).then((r) => r.data)
}

export function unenroll(courseId) {
  return http.delete(`courses/${courseId}/enroll`)
}

export function completeStep(stepId) {
  return http.post(`steps/${stepId}/complete`).then((r) => r.data)
}

export function getMyCourses() {
  return http.get('students/me/courses').then((r) => r.data.courses)
}
