import { http } from './http'

export function getCourseExam(courseId) {
  return http.get(`courses/${courseId}/exam`).then((r) => r.data)
}

export function createExam(courseId, { title, passScorePercentage, timeLimitMinutes, maxAttempts }) {
  return http
    .post(`courses/${courseId}/exam`, { title, passScorePercentage, timeLimitMinutes, maxAttempts })
    .then((r) => r.data)
}

export function updateExam(examId, { title, passScorePercentage, timeLimitMinutes, maxAttempts }) {
  return http
    .put(`exams/${examId}`, { title, passScorePercentage, timeLimitMinutes, maxAttempts })
    .then((r) => r.data)
}

export function deleteExam(examId) {
  return http.delete(`exams/${examId}`)
}

export function publishExam(examId) {
  return http.post(`exams/${examId}/publish`).then((r) => r.data)
}

export function unpublishExam(examId) {
  return http.post(`exams/${examId}/unpublish`).then((r) => r.data)
}

export function createQuestion(examId, { text, points, options }) {
  return http.post(`exams/${examId}/questions`, { text, points, options }).then((r) => r.data)
}

export function updateQuestion(questionId, { text, points, options }) {
  return http.put(`questions/${questionId}`, { text, points, options }).then((r) => r.data)
}

export function deleteQuestion(questionId) {
  return http.delete(`questions/${questionId}`)
}

export function reorderQuestions(examId, questionIds) {
  return http.post(`exams/${examId}/questions/reorder`, { questionIds })
}

export function getExamForTaking(courseId) {
  return http.get(`courses/${courseId}/exam/take`).then((r) => r.data)
}

export function startExamAttempt(courseId) {
  return http.post(`courses/${courseId}/exam/attempts`).then((r) => r.data)
}

export function submitExamAttempt(attemptId, answers) {
  return http.post(`exam-attempts/${attemptId}/submit`, { answers }).then((r) => r.data)
}

export function getExamAttempt(attemptId) {
  return http.get(`exam-attempts/${attemptId}`).then((r) => r.data)
}

export function getMyExamAttempts(courseId) {
  return http.get(`courses/${courseId}/exam/attempts/me`).then((r) => r.data.attempts)
}
