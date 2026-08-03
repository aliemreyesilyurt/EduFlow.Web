import { http } from './http'

export function getCourseComments(courseId) {
  return http.get(`courses/${courseId}/comments`).then((r) => r.data.comments)
}

export function getStepComments(stepId) {
  return http.get(`steps/${stepId}/comments`).then((r) => r.data.comments)
}

export function createCourseComment(courseId, content) {
  return http.post(`courses/${courseId}/comments`, { content }).then((r) => r.data)
}

export function createStepComment(stepId, content) {
  return http.post(`steps/${stepId}/comments`, { content }).then((r) => r.data)
}
