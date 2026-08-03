<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import CommentList from '@/components/CommentList.vue'
import CommentForm from '@/components/CommentForm.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import * as stepsApi from '@/api/steps'
import * as enrollmentsApi from '@/api/enrollments'
import * as commentsApi from '@/api/comments'
import { extractErrorMessage } from '@/api/errors'
import { StepContentType } from '@/constants/enums'
import { toEmbedUrl } from '@/utils/video'

const props = defineProps({
  courseId: { type: String, required: true },
  stepId: { type: String, required: true },
})

const allSteps = ref([])
const step = ref(null)
const comments = ref([])
const isLoading = ref(true)
const error = ref('')
const isCompleting = ref(false)
const isCommenting = ref(false)
const completionStatus = ref(null)

const currentIndex = computed(() => allSteps.value.findIndex((s) => s.id === props.stepId))
const previousStep = computed(() => (currentIndex.value > 0 ? allSteps.value[currentIndex.value - 1] : null))
const nextStep = computed(() =>
  currentIndex.value >= 0 && currentIndex.value < allSteps.value.length - 1
    ? allSteps.value[currentIndex.value + 1]
    : null,
)

const embedUrl = computed(() => (step.value?.contentType === StepContentType.Video ? toEmbedUrl(step.value.contentUrl) : null))

async function load() {
  isLoading.value = true
  error.value = ''
  completionStatus.value = null

  try {
    const [stepData, stepsData, commentsData] = await Promise.all([
      stepsApi.getStepById(props.stepId),
      stepsApi.getSteps(props.courseId),
      commentsApi.getStepComments(props.stepId),
    ])

    step.value = stepData
    allSteps.value = stepsData
    comments.value = commentsData
  } catch (err) {
    error.value = extractErrorMessage(err, 'Adım yüklenemedi.')
  } finally {
    isLoading.value = false
  }
}

onMounted(load)
watch(() => props.stepId, load)

async function handleComplete() {
  isCompleting.value = true

  try {
    completionStatus.value = await enrollmentsApi.completeStep(props.stepId)
  } catch (err) {
    error.value = extractErrorMessage(err, 'Adım tamamlanamadı.')
  } finally {
    isCompleting.value = false
  }
}

async function handleComment(content) {
  isCommenting.value = true

  try {
    await commentsApi.createStepComment(props.stepId, content)
    comments.value = await commentsApi.getStepComments(props.stepId)
  } catch (err) {
    error.value = extractErrorMessage(err, 'Yorum gönderilemedi.')
  } finally {
    isCommenting.value = false
  }
}
</script>

<template>
  <div v-if="isLoading" class="text-sm text-slate-500">Yükleniyor...</div>

  <AlertMessage v-else-if="error && !step" variant="error">{{ error }}</AlertMessage>

  <div v-else-if="step" class="space-y-6">
    <RouterLink :to="{ name: 'course-detail', params: { id: courseId } }" class="text-sm text-indigo-600 hover:underline">
      ← Kursa dön
    </RouterLink>

    <AlertMessage v-if="error" variant="error">{{ error }}</AlertMessage>

    <div class="rounded-lg border border-slate-200 bg-white p-6">
      <h1 class="text-lg font-semibold text-slate-800">{{ step.order }}. {{ step.title }}</h1>

      <div class="mt-4">
        <p v-if="step.contentType === StepContentType.Text" class="whitespace-pre-line text-sm text-slate-700">
          {{ step.textContent }}
        </p>

        <template v-else-if="step.contentType === StepContentType.Video">
          <iframe
            v-if="embedUrl"
            :src="embedUrl"
            class="aspect-video w-full rounded-md"
            allowfullscreen
            frameborder="0"
          />
          <video v-else-if="step.contentUrl" :src="step.contentUrl" controls class="w-full rounded-md" />
        </template>

        <a
          v-else-if="step.contentType === StepContentType.Document && step.contentUrl"
          :href="step.contentUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-block rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-slate-50"
        >
          Dökümanı Aç
        </a>
      </div>

      <div class="mt-6 flex items-center justify-between">
        <div>
          <RouterLink
            v-if="previousStep"
            :to="{ name: 'step-viewer', params: { courseId, stepId: previousStep.id } }"
            class="text-sm text-slate-600 hover:underline"
          >
            ← Önceki Adım
          </RouterLink>
        </div>

        <button
          type="button"
          :disabled="isCompleting"
          class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          @click="handleComplete"
        >
          {{ isCompleting ? 'Kaydediliyor...' : 'Tamamlandı İşaretle' }}
        </button>

        <RouterLink
          v-if="nextStep"
          :to="{ name: 'step-viewer', params: { courseId, stepId: nextStep.id } }"
          class="text-sm text-slate-600 hover:underline"
        >
          Sonraki Adım →
        </RouterLink>
      </div>

      <AlertMessage v-if="completionStatus?.courseCompleted" variant="success" class="mt-4">
        Tebrikler, kursu tamamladın!
      </AlertMessage>
      <p v-else-if="completionStatus" class="mt-4 text-sm text-slate-500">
        İlerleme: {{ completionStatus.completedSteps }}/{{ completionStatus.totalSteps }} adım (%{{
          completionStatus.progressPercentage.toFixed(0)
        }})
      </p>
    </div>

    <div class="rounded-lg border border-slate-200 bg-white p-6">
      <h2 class="mb-3 text-sm font-semibold text-slate-700">Yorumlar</h2>
      <CommentList :comments="comments" />
      <div class="mt-4">
        <CommentForm :is-submitting="isCommenting" @submit="handleComment" />
      </div>
    </div>
  </div>
</template>
