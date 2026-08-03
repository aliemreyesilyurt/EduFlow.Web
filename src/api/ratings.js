import { http } from './http'

export function rateCourse(courseId, value) {
  return http.put(`courses/${courseId}/rating`, { value }).then((r) => r.data)
}

export function getMyRating(courseId) {
  return http.get(`courses/${courseId}/rating/me`).then((r) => r.data)
}

export function deleteRating(courseId) {
  return http.delete(`courses/${courseId}/rating`)
}
