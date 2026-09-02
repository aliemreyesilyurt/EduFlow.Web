import { http } from './http'

export function giveConsent(attemptId) {
  return http.post(`exam-attempts/${attemptId}/proctoring/consent`).then((r) => r.data)
}

export function logEvents(attemptId, events) {
  return http.post(`exam-attempts/${attemptId}/proctoring/events`, { events }).then((r) => r.data)
}

export function uploadSnapshot(attemptId, blob) {
  const form = new FormData()
  form.append('file', blob, 'snapshot.jpg')
  return http
    .post(`exam-attempts/${attemptId}/proctoring/snapshots`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data)
}

export function getExamAttemptsForReview(courseId) {
  return http.get(`courses/${courseId}/exam/attempts`).then((r) => r.data.attempts)
}

export function getProctoringReport(attemptId) {
  return http.get(`exam-attempts/${attemptId}/proctoring`).then((r) => r.data)
}

export function snapshotContentUrl(attemptId, snapshotId) {
  return `exam-attempts/${attemptId}/proctoring/snapshots/${snapshotId}`
}

export function reviewAttempt(attemptId, { approved, note }) {
  return http.post(`exam-attempts/${attemptId}/review`, { approved, note }).then((r) => r.data)
}
