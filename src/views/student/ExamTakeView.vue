<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AlertMessage from '@/components/AlertMessage.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseCard from '@/components/BaseCard.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import ProctoringConsentModal from '@/components/student/ProctoringConsentModal.vue'
import * as examsApi from '@/api/exams'
import * as proctoringApi from '@/api/proctoring'
import { extractErrorMessage } from '@/api/errors'
import { useProctoring } from '@/composables/useProctoring'

const props = defineProps({
  courseId: { type: String, required: true },
})

const router = useRouter()
const proctoring = useProctoring()

const examInfo = ref(null)
const pastAttempts = ref([])
const attempt = ref(null)
const answers = ref({})
const isLoading = ref(true)
const isStarting = ref(false)
const isSubmitting = ref(false)
const error = ref('')
const showConsentModal = ref(false)

const deadlineMs = ref(null)
const remainingSeconds = ref(null)
let timerId = null

const canStart = computed(
  () => examInfo.value && (examInfo.value.inProgressAttemptId || examInfo.value.attemptsRemaining !== 0),
)

const remainingLabel = computed(() => {
  if (remainingSeconds.value === null) {
    return null
  }

  const minutes = Math.floor(remainingSeconds.value / 60)
  const seconds = remainingSeconds.value % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
})

async function load() {
  isLoading.value = true
  error.value = ''

  try {
    const [info, attempts] = await Promise.all([
      examsApi.getExamForTaking(props.courseId),
      examsApi.getMyExamAttempts(props.courseId),
    ])
    examInfo.value = info
    pastAttempts.value = attempts
  } catch (err) {
    error.value = extractErrorMessage(err, 'Sınav bilgisi yüklenemedi.')
  } finally {
    isLoading.value = false
  }
}

onMounted(load)

onBeforeUnmount(() => {
  if (timerId) {
    clearInterval(timerId)
  }
  proctoring.stop()
})

function startTimer() {
  if (!attempt.value.timeLimitMinutes) {
    return
  }

  deadlineMs.value = new Date(attempt.value.startedOn).getTime() + attempt.value.timeLimitMinutes * 60000

  const tick = () => {
    const secondsLeft = Math.max(0, Math.round((deadlineMs.value - Date.now()) / 1000))
    remainingSeconds.value = secondsLeft

    if (secondsLeft === 0) {
      clearInterval(timerId)
      handleSubmit()
    }
  }

  tick()
  timerId = setInterval(tick, 1000)
}

function handleStart() {
  if (examInfo.value.proctoringEnabled && !examInfo.value.consentGivenOn) {
    showConsentModal.value = true
    return
  }

  beginAttempt()
}

async function handleConsentAccept() {
  showConsentModal.value = false
  await beginAttempt()
}

async function beginAttempt() {
  isStarting.value = true
  error.value = ''

  // Fullscreen must be requested synchronously off the click that led here (button click, or the
  // consent modal's accept click) — browsers drop "user activation" after an awaited network call,
  // so requesting it *after* startExamAttempt/giveConsent below gets silently rejected instead.
  if (examInfo.value.proctoringEnabled) {
    await proctoring.requestFullscreen()
  }

  try {
    attempt.value = await examsApi.startExamAttempt(props.courseId)
    answers.value = {}
    startTimer()

    if (examInfo.value.proctoringEnabled) {
      await proctoringApi.giveConsent(attempt.value.id)
      await proctoring.start({
        id: attempt.value.id,
        requireCamera: examInfo.value.requireCamera,
        snapshotIntervalSeconds: examInfo.value.snapshotIntervalSeconds,
        useFullscreen: false,
      })
    }
  } catch (err) {
    error.value = extractErrorMessage(err, 'Sınav başlatılamadı.')
  } finally {
    isStarting.value = false
  }
}

async function handleSubmit() {
  if (isSubmitting.value) {
    return
  }

  isSubmitting.value = true
  error.value = ''

  await proctoring.flush()

  const payload = Object.entries(answers.value).map(([questionId, selectedOptionId]) => ({
    questionId,
    selectedOptionId,
  }))

  try {
    const result = await examsApi.submitExamAttempt(attempt.value.id, payload)
    await proctoring.stop()
    router.push({ name: 'exam-result', params: { courseId: props.courseId, attemptId: result.id } })
  } catch (err) {
    error.value = extractErrorMessage(err, 'Sınav gönderilemedi.')
    isSubmitting.value = false
  }
}
</script>

<template>
  <BaseCard v-if="isLoading">
    <SkeletonBlock class="h-5 w-1/3" />
    <SkeletonBlock class="mt-4 h-24 w-full" />
  </BaseCard>

  <AlertMessage v-else-if="error && !examInfo" variant="error">{{ error }}</AlertMessage>

  <div v-else-if="examInfo" class="space-y-6">
    <RouterLink :to="{ name: 'course-detail', params: { id: courseId } }" class="text-sm text-indigo-600 hover:underline">
      ← Kursa dön
    </RouterLink>

    <AlertMessage v-if="error" variant="error">{{ error }}</AlertMessage>

    <BaseCard v-if="!attempt">
      <h1 class="text-lg font-semibold text-slate-800">{{ examInfo.title }}</h1>
      <p class="mt-2 text-sm text-slate-500">
        Geçme notu: %{{ examInfo.passScorePercentage }}
        <span v-if="examInfo.timeLimitMinutes"> · Süre: {{ examInfo.timeLimitMinutes }} dk</span>
        <span v-if="examInfo.maxAttempts">
          · Deneme hakkı: {{ examInfo.attemptsUsed }}/{{ examInfo.maxAttempts }}
        </span>
      </p>

      <BaseButton v-if="canStart" class="mt-4" :disabled="isStarting" @click="handleStart">
        {{ isStarting ? 'Başlatılıyor...' : examInfo.inProgressAttemptId ? 'Devam Et' : 'Sınava Başla' }}
      </BaseButton>
      <AlertMessage v-else class="mt-4" variant="error">Bu sınav için tüm deneme haklarını kullandın.</AlertMessage>

      <div v-if="pastAttempts.length > 0" class="mt-6 border-t border-slate-200 pt-4">
        <h2 class="mb-2 text-sm font-semibold text-slate-700">Geçmiş Denemeler</h2>
        <ul class="space-y-1">
          <li v-for="past in pastAttempts.filter((a) => a.submittedOn)" :key="past.id" class="text-sm">
            <RouterLink
              :to="{ name: 'exam-result', params: { courseId, attemptId: past.id } }"
              class="text-indigo-600 hover:underline"
            >
              Deneme {{ past.attemptNumber }} — %{{ past.scorePercentage?.toFixed(0) }}
              ({{ past.passed ? 'Geçti' : 'Kaldı' }})
            </RouterLink>
          </li>
        </ul>
      </div>
    </BaseCard>

    <template v-else>
      <BaseCard v-if="remainingLabel !== null" padding="p-4">
        <p class="text-sm font-medium text-slate-700">Kalan süre: {{ remainingLabel }}</p>
      </BaseCard>

      <AlertMessage v-if="proctoring.thresholdExceeded.value" variant="error">
        Sınav bütünlüğü ihlal sayınız eşiği aştı. Bu deneme eğitmen incelemesine gönderilecek.
      </AlertMessage>

      <AlertMessage v-if="proctoring.cameraError.value" variant="error">
        {{ proctoring.cameraError.value }}
      </AlertMessage>

      <BaseCard v-for="question in examInfo.questions" :key="question.id">
        <p class="font-medium text-slate-800">{{ question.order }}. {{ question.text }}</p>
        <p class="mt-1 text-xs text-slate-400">{{ question.points }} puan</p>

        <div class="mt-3 space-y-2">
          <label
            v-for="option in question.options"
            :key="option.id"
            class="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
          >
            <input
              v-model="answers[question.id]"
              type="radio"
              :name="`question-${question.id}`"
              :value="option.id"
              class="h-4 w-4 text-indigo-600"
            />
            {{ option.text }}
          </label>
        </div>
      </BaseCard>

      <BaseButton block :disabled="isSubmitting" @click="handleSubmit">
        {{ isSubmitting ? 'Gönderiliyor...' : 'Sınavı Bitir' }}
      </BaseButton>
    </template>

    <ProctoringConsentModal
      v-if="showConsentModal"
      :consent-text="examInfo.consentText"
      :require-camera="examInfo.requireCamera"
      @accept="handleConsentAccept"
      @cancel="showConsentModal = false"
    />
  </div>
</template>
