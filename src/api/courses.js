import { http } from './http'

export function getAllCourses() {
  return http.get('courses').then((r) => r.data.courses)
}

export function getCourseById(id) {
  return http.get(`courses/${id}`).then((r) => r.data)
}

export function createCourse(title, description) {
  return http.post('courses', { title, description }).then((r) => r.data)
}

export function updateCourse(id, title, description) {
  return http.put(`courses/${id}`, { title, description }).then((r) => r.data)
}

export function deleteCourse(id) {
  return http.delete(`courses/${id}`)
}

export function publishCourse(id) {
  return http.post(`courses/${id}/publish`).then((r) => r.data)
}

export function archiveCourse(id) {
  return http.post(`courses/${id}/archive`).then((r) => r.data)
}

export function getEnrolledStudents(courseId) {
  return http.get(`courses/${courseId}/students`).then((r) => r.data.students)
}
