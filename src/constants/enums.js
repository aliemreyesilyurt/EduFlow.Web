// Mirrors EduFlow.Domain.Enums.CourseStatus (serialized as an int by the API).
export const CourseStatus = {
  Draft: 0,
  Published: 1,
  Archived: 2,
}

// Mirrors EduFlow.Domain.Enums.StepContentType (serialized as an int by the API).
export const StepContentType = {
  Text: 0,
  Video: 1,
  Document: 2,
}

// Mirrors EduFlow.Domain.Enums.ProctoringEventType (serialized as an int by the API).
export const ProctoringEventType = {
  FullscreenExit: 0,
  WindowBlur: 1,
  TabHidden: 2,
  CopyAttempt: 3,
  PasteAttempt: 4,
  ContextMenu: 5,
  MultipleScreens: 6,
  CameraDenied: 7,
  CameraStopped: 8,
}
