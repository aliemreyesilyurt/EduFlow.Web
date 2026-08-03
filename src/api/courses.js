import { http } from './http'

export function getAllCourses() {
  return http.get('courses').then((r) => r.data.courses)
}

export function getCourseById(id) {
  return http.get(`courses/${id}`).then((r) => r.data)
}
