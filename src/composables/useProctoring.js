import { ref } from 'vue'
import * as proctoringApi from '@/api/proctoring'
import { ProctoringEventType } from '@/constants/enums'

const FLUSH_INTERVAL_MS = 10_000
const FLUSH_BATCH_SIZE = 5

// Collects best-effort exam-integrity signals (fullscreen exit, tab/window focus loss,
// copy/paste/right-click attempts, connected-screen count, periodic camera snapshots) and
// batches them to the backend. None of this blocks or auto-submits the exam — it only feeds
// the instructor's review report (see ROADMAP.md Faz 9: evidence collection, not disqualification).
export function useProctoring() {
  const violationCount = ref(0)
  const requiresReview = ref(false)
  const thresholdExceeded = ref(false)
  const cameraError = ref('')

  let attemptId = null
  let queue = []
  let flushTimer = null
  let snapshotTimer = null
  let mediaStream = null
  let videoEl = null
  let canvasEl = null
  let started = false

  function pushEvent(type, details) {
    queue.push({ type, occurredOn: new Date().toISOString(), details: details ?? null })

    if (queue.length >= FLUSH_BATCH_SIZE) {
      flush()
    }
  }

  async function flush() {
    if (!attemptId || queue.length === 0) {
      return
    }

    const events = queue
    queue = []

    try {
      const result = await proctoringApi.logEvents(attemptId, events)
      violationCount.value = result.violationCount
      requiresReview.value = result.requiresReview

      if (result.thresholdExceeded) {
        thresholdExceeded.value = true
      }
    } catch {
      // Best-effort: put the events back so the next flush retries them instead of losing evidence.
      queue = events.concat(queue)
    }
  }

  function handleFullscreenChange() {
    if (!document.fullscreenElement) {
      pushEvent(ProctoringEventType.FullscreenExit)
    }
  }

  function handleVisibilityChange() {
    if (document.hidden) {
      pushEvent(ProctoringEventType.TabHidden)
    }
  }

  function handleBlur() {
    pushEvent(ProctoringEventType.WindowBlur)
  }

  function handleCopy(event) {
    event.preventDefault()
    pushEvent(ProctoringEventType.CopyAttempt)
  }

  function handlePaste(event) {
    event.preventDefault()
    pushEvent(ProctoringEventType.PasteAttempt)
  }

  function handleContextMenu(event) {
    event.preventDefault()
    pushEvent(ProctoringEventType.ContextMenu)
  }

  async function requestFullscreen() {
    try {
      await document.documentElement.requestFullscreen()
    } catch {
      // Best-effort — some browsers/embeds refuse it; the exam still proceeds.
    }
  }

  async function checkMultipleScreens() {
    try {
      if (typeof window.getScreenDetails !== 'function') {
        return
      }

      const details = await window.getScreenDetails()

      if (details.screens.length > 1) {
        pushEvent(ProctoringEventType.MultipleScreens, `${details.screens.length} screens`)
      }
    } catch {
      // Not supported or permission denied — best-effort signal only.
    }
  }

  async function startCamera(intervalSeconds) {
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
    } catch {
      pushEvent(ProctoringEventType.CameraDenied)
      cameraError.value = 'Kamera izni verilmedi, bu deneme kamera kanıtı olmadan devam ediyor.'
      return
    }

    videoEl = document.createElement('video')
    videoEl.muted = true
    videoEl.srcObject = mediaStream
    await videoEl.play()

    canvasEl = document.createElement('canvas')

    const captureAndUpload = () => {
      if (!mediaStream || !videoEl.videoWidth || !attemptId) {
        return
      }

      canvasEl.width = videoEl.videoWidth
      canvasEl.height = videoEl.videoHeight
      canvasEl.getContext('2d').drawImage(videoEl, 0, 0)

      canvasEl.toBlob(
        async (blob) => {
          if (!blob || !attemptId) {
            return
          }

          try {
            await proctoringApi.uploadSnapshot(attemptId, blob)
          } catch {
            // Best-effort — a missed snapshot doesn't interrupt the exam.
          }
        },
        'image/jpeg',
        0.7,
      )
    }

    snapshotTimer = setInterval(captureAndUpload, (intervalSeconds ?? 30) * 1000)
    captureAndUpload()
  }

  function stopCamera() {
    if (snapshotTimer) {
      clearInterval(snapshotTimer)
      snapshotTimer = null
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop())
      pushEvent(ProctoringEventType.CameraStopped)
      mediaStream = null
    }

    videoEl = null
    canvasEl = null
  }

  async function start({ id, requireCamera, snapshotIntervalSeconds, useFullscreen = true }) {
    if (started) {
      return
    }

    started = true
    attemptId = id
    violationCount.value = 0
    requiresReview.value = false
    thresholdExceeded.value = false
    cameraError.value = ''

    if (useFullscreen) {
      await requestFullscreen()
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('copy', handleCopy)
    document.addEventListener('paste', handlePaste)
    document.addEventListener('contextmenu', handleContextMenu)

    await checkMultipleScreens()

    if (requireCamera) {
      await startCamera(snapshotIntervalSeconds)
    }

    flushTimer = setInterval(flush, FLUSH_INTERVAL_MS)
  }

  async function stop() {
    if (!started) {
      return
    }

    started = false

    document.removeEventListener('fullscreenchange', handleFullscreenChange)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('blur', handleBlur)
    document.removeEventListener('copy', handleCopy)
    document.removeEventListener('paste', handlePaste)
    document.removeEventListener('contextmenu', handleContextMenu)

    if (flushTimer) {
      clearInterval(flushTimer)
      flushTimer = null
    }

    stopCamera()
    await flush()

    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen()
      } catch {
        // ignore
      }
    }

    attemptId = null
  }

  return { violationCount, requiresReview, thresholdExceeded, cameraError, requestFullscreen, start, stop, flush }
}
