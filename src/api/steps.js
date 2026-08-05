import { http } from './http'

export function getSteps(courseId) {
  return http.get(`courses/${courseId}/steps`).then((r) => r.data.steps)
}

export function getStepById(id) {
  return http.get(`steps/${id}`).then((r) => r.data)
}

export function createStep(courseId, { title, contentType, contentUrl, textContent }) {
  return http
    .post(`courses/${courseId}/steps`, { title, contentType, contentUrl, textContent })
    .then((r) => r.data)
}

export function updateStep(id, { title, contentType, contentUrl, textContent }) {
  return http.put(`steps/${id}`, { title, contentType, contentUrl, textContent }).then((r) => r.data)
}

export function deleteStep(id) {
  return http.delete(`steps/${id}`)
}

export function reorderSteps(courseId, stepIds) {
  return http.post(`courses/${courseId}/steps/reorder`, { stepIds })
}

export function uploadStepContent(id, file, onUploadProgress) {
  const formData = new FormData()
  formData.append('file', file)

  return http
    .post(`steps/${id}/content`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    })
    .then((r) => r.data)
}
