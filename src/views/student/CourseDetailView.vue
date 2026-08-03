<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import StarRating from '@/components/StarRating.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import CommentList from '@/components/CommentList.vue'
import CommentForm from '@/components/CommentForm.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import * as coursesApi from '@/api/courses'
import * as stepsApi from '@/api/steps'
import * as enrollmentsApi from '@/api/enrollments'
import * as commentsApi from '@/api/comments'
import * as ratingsApi from '@/api/ratings'
import { extractErrorMessage } from '@/api/errors'
import { StepContentType } from '@/constants/enums'

const props = defineProps({
  id: { type: String, required: true },
})

const course = ref(null)
const steps = ref([])
const comments = ref([])
const myEnrollment = ref(null)
const myRatingValue = ref(null)
const isLoading = ref(true)
const error = ref('')
const isEnrolling = ref(false)
const isRating = ref(false)
const isCommenting = ref(false)

const isEnrolled = computed(() => !!myEnrollment.value)

const contentTypeLabels = {
  [StepContentType.Text]: 'Metin',
  [StepContentType.Video]: 'Video',
  [StepContentType.Document]: 'Döküman',
}

async function loadAll() {
  isLoading.value = true
  error.value = ''

  try {
    const [courseData, stepsData, commentsData, myRating, myCourses] = await Promise.all([
      coursesApi.getCourseById(props.id),
      stepsApi.getSteps(props.id),
      commentsApi.getCourseComments(props.id),
      ratingsApi.getMyRating(props.id),
      enrollmentsApi.getMyCourses(),
    ])

    course.value = courseData
    steps.value = stepsData
    comments.value = commentsData
    myRatingValue.value = myRating.value
    myEnrollment.value = myCourses.find((c) => c.courseId === props.id) ?? null
  } catch (err) {
    error.value = extractErrorMessage(err, 'Kurs yüklenemedi.')
  } finally {
    isLoading.value = false
  }
}

onMounted(loadAll)

async function handleEnroll() {
  isEnrolling.value = true

  try {
    await enrollmentsApi.enroll(props.id)
    await loadAll()
  } catch (err) {
    error.value = extractErrorMessage(err, 'Kayıt işlemi başarısız oldu.')
  } finally {
    isEnrolling.value = false
  }
}

async function handleUnenroll() {
  isEnrolling.value = true

  try {
    await enrollmentsApi.unenroll(props.id)
    await loadAll()
  } catch (err) {
    error.value = extractErrorMessage(err, 'Kayıt silme işlemi başarısız oldu.')
  } finally {
    isEnrolling.value = false
  }
}

async function handleRatingChange(value) {
  isRating.value = true

  try {
    await ratingsApi.rateCourse(props.id, value)
    myRatingValue.value = value
    course.value = await coursesApi.getCourseById(props.id)
  } catch (err) {
    error.value = extractErrorMessage(err, 'Puanlama kaydedilemedi.')
  } finally {
    isRating.value = false
  }
}

async function handleRemoveRating() {
  isRating.value = true

  try {
    await ratingsApi.deleteRating(props.id)
    myRatingValue.value = null
    course.value = await coursesApi.getCourseById(props.id)
  } catch (err) {
    error.value = extractErrorMessage(err, 'Puan kaldırılamadı.')
  } finally {
    isRating.value = false
  }
}

async function handleComment(content) {
  isCommenting.value = true

  try {
    await commentsApi.createCourseComment(props.id, content)
    comments.value = await commentsApi.getCourseComments(props.id)
  } catch (err) {
    error.value = extractErrorMessage(err, 'Yorum gönderilemedi.')
  } finally {
    isCommenting.value = false
  }
}
</script>

<template>
  <div v-if="isLoading" class="text-sm text-slate-500">Yükleniyor...</div>

  <AlertMessage v-else-if="error && !course" variant="error">{{ error }}</AlertMessage>

  <div v-else-if="course" class="space-y-8">
    <AlertMessage v-if="error" variant="error">{{ error }}</AlertMessage>

    <div class="rounded-lg border border-slate-200 bg-white p-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-slate-800">{{ course.title }}</h1>
          <p class="mt-1 text-sm text-slate-500">Eğitmen: {{ course.instructorName }}</p>
          <p v-if="course.description" class="mt-3 text-sm text-slate-600">{{ course.description }}</p>

          <div class="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <StarRating :model-value="course.averageRating ?? 0" readonly size="text-sm" />
            <span v-if="course.averageRating">{{ course.averageRating.toFixed(1) }}</span>
            <span>({{ course.ratingCount }} değerlendirme, {{ course.commentCount }} yorum)</span>
          </div>
        </div>

        <button
          v-if="!isEnrolled"
          type="button"
          :disabled="isEnrolling"
          class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          @click="handleEnroll"
        >
          {{ isEnrolling ? 'Kaydediliyor...' : 'Kursa Kayıt Ol' }}
        </button>
        <button
          v-else
          type="button"
          :disabled="isEnrolling"
          class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          @click="handleUnenroll"
        >
          Kayıttan Ayrıl
        </button>
      </div>

      <div v-if="isEnrolled" class="mt-4 max-w-sm">
        <ProgressBar :percentage="myEnrollment.progressPercentage" />
      </div>
    </div>

    <div v-if="isEnrolled" class="rounded-lg border border-slate-200 bg-white p-6">
      <h2 class="mb-3 text-sm font-semibold text-slate-700">Puanın</h2>
      <div class="flex items-center gap-3">
        <StarRating :model-value="myRatingValue ?? 0" :readonly="isRating" @update:model-value="handleRatingChange" />
        <button
          v-if="myRatingValue"
          type="button"
          :disabled="isRating"
          class="text-sm text-slate-500 hover:underline disabled:opacity-50"
          @click="handleRemoveRating"
        >
          Puanı Kaldır
        </button>
      </div>
    </div>

    <div class="rounded-lg border border-slate-200 bg-white p-6">
      <h2 class="mb-3 text-sm font-semibold text-slate-700">Adımlar</h2>
      <ul class="space-y-2">
        <li v-if="steps.length === 0" class="text-sm text-slate-500">Bu kursta henüz adım yok.</li>

        <li v-for="step in steps" :key="step.id">
          <RouterLink
            v-if="isEnrolled"
            :to="{ name: 'step-viewer', params: { courseId: course.id, stepId: step.id } }"
            class="flex items-center justify-between rounded-md border border-slate-200 px-4 py-2 text-sm hover:border-indigo-300"
          >
            <span>{{ step.order }}. {{ step.title }}</span>
            <span class="text-xs text-slate-400">{{ contentTypeLabels[step.contentType] }}</span>
          </RouterLink>
          <div
            v-else
            class="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-4 py-2 text-sm text-slate-400"
          >
            <span>{{ step.order }}. {{ step.title }}</span>
            <span class="text-xs">{{ contentTypeLabels[step.contentType] }}</span>
          </div>
        </li>
      </ul>
    </div>

    <div class="rounded-lg border border-slate-200 bg-white p-6">
      <h2 class="mb-3 text-sm font-semibold text-slate-700">Yorumlar</h2>
      <CommentList :comments="comments" />

      <div class="mt-4">
        <CommentForm v-if="isEnrolled" :is-submitting="isCommenting" @submit="handleComment" />
        <p v-else class="text-sm text-slate-500">Yorum yapmak için kursa kayıt olmalısın.</p>
      </div>
    </div>
  </div>
</template>
