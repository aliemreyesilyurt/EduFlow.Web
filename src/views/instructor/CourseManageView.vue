<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AlertMessage from '@/components/AlertMessage.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseCard from '@/components/BaseCard.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import StatTile from '@/components/StatTile.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import CourseFormModal from '@/components/instructor/CourseFormModal.vue'
import StepFormModal from '@/components/instructor/StepFormModal.vue'
import * as coursesApi from '@/api/courses'
import * as stepsApi from '@/api/steps'
import { extractErrorMessage } from '@/api/errors'
import { confirmDialog, successToast, errorToast } from '@/utils/notify'
import { CourseStatus, StepContentType } from '@/constants/enums'

const props = defineProps({
  id: { type: String, required: true },
})

const router = useRouter()

const course = ref(null)
const steps = ref([])
const enrolledCount = ref(0)
const isLoading = ref(true)
const error = ref('')
const isActing = ref(false)
const reorderingId = ref(null)
const showEditModal = ref(false)
const stepModalState = ref(null) // null | 'new' | stepId

const statusLabels = {
  [CourseStatus.Draft]: 'Taslak',
  [CourseStatus.Published]: 'Yayında',
  [CourseStatus.Archived]: 'Arşivlendi',
}

const statusVariants = {
  [CourseStatus.Draft]: 'neutral',
  [CourseStatus.Published]: 'success',
  [CourseStatus.Archived]: 'warning',
}

const contentTypeLabels = {
  [StepContentType.Text]: 'Metin',
  [StepContentType.Video]: 'Video',
  [StepContentType.Document]: 'Döküman',
}

const canPublish = computed(() => course.value?.status === CourseStatus.Draft)
const canArchive = computed(() => course.value?.status !== CourseStatus.Archived)

async function load() {
  isLoading.value = true
  error.value = ''

  try {
    const [courseData, stepsData, studentsData] = await Promise.all([
      coursesApi.getCourseById(props.id),
      stepsApi.getSteps(props.id),
      coursesApi.getEnrolledStudents(props.id),
    ])
    course.value = courseData
    steps.value = stepsData
    enrolledCount.value = studentsData.length
  } catch (err) {
    error.value = extractErrorMessage(err, 'Kurs yüklenemedi.')
  } finally {
    isLoading.value = false
  }
}

onMounted(load)

async function handlePublish() {
  isActing.value = true
  error.value = ''

  try {
    await coursesApi.publishCourse(props.id)
    await load()
  } catch (err) {
    error.value = extractErrorMessage(err, 'Kurs yayınlanamadı.')
  } finally {
    isActing.value = false
  }
}

async function handleArchive() {
  isActing.value = true
  error.value = ''

  try {
    await coursesApi.archiveCourse(props.id)
    await load()
  } catch (err) {
    error.value = extractErrorMessage(err, 'Kurs arşivlenemedi.')
  } finally {
    isActing.value = false
  }
}

async function handleDelete() {
  const confirmed = await confirmDialog(
    'Kursu sil',
    `"${course.value.title}" kursunu silmek istediğine emin misin? Bu işlem geri alınamaz.`,
  )

  if (!confirmed) {
    return
  }

  isActing.value = true
  error.value = ''

  try {
    await coursesApi.deleteCourse(props.id)
    successToast('Kurs silindi.')
    router.push({ name: 'dashboard' })
  } catch (err) {
    errorToast(extractErrorMessage(err, 'Kurs silinemedi.'))
    isActing.value = false
  }
}

async function handleDeleteStep(step) {
  const confirmed = await confirmDialog('Adımı sil', `"${step.title}" adımını silmek istediğine emin misin?`)

  if (!confirmed) {
    return
  }

  error.value = ''

  try {
    await stepsApi.deleteStep(step.id)
    successToast('Adım silindi.')
    await load()
  } catch (err) {
    errorToast(extractErrorMessage(err, 'Adım silinemedi.'))
  }
}

async function moveStep(index, direction) {
  const targetIndex = index + direction

  if (targetIndex < 0 || targetIndex >= steps.value.length) {
    return
  }

  const reordered = [...steps.value]
  ;[reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]]

  reorderingId.value = steps.value[index].id
  error.value = ''

  try {
    await stepsApi.reorderSteps(
      props.id,
      reordered.map((s) => s.id),
    )
    steps.value = reordered.map((s, i) => ({ ...s, order: i + 1 }))
  } catch (err) {
    error.value = extractErrorMessage(err, 'Adımlar yeniden sıralanamadı.')
  } finally {
    reorderingId.value = null
  }
}
</script>

<template>
  <div v-if="isLoading" class="space-y-6">
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <SkeletonBlock v-for="n in 4" :key="n" class="h-[68px] w-full" />
    </div>
    <BaseCard>
      <SkeletonBlock class="h-5 w-1/2" />
      <SkeletonBlock class="mt-4 h-9 w-64" />
    </BaseCard>
  </div>

  <AlertMessage v-else-if="error && !course" variant="error">{{ error }}</AlertMessage>

  <div v-else-if="course" class="space-y-6">
    <AlertMessage v-if="error" variant="error">{{ error }}</AlertMessage>

    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatTile label="Adım sayısı" :value="steps.length" variant="primary" />
      <StatTile label="Kayıtlı öğrenci" :value="enrolledCount" variant="info" />
      <StatTile label="Ortalama puan" :value="course.averageRating?.toFixed(1) ?? '—'" variant="warning" />
      <StatTile label="Yorum" :value="course.commentCount" variant="neutral" />
    </div>

    <BaseCard>
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-semibold text-slate-800">{{ course.title }}</h1>
            <StatusBadge :variant="statusVariants[course.status]">{{ statusLabels[course.status] }}</StatusBadge>
          </div>
          <p v-if="course.description" class="mt-2 text-sm text-slate-600">{{ course.description }}</p>
        </div>

        <button
          type="button"
          class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          @click="showEditModal = true"
        >
          Bilgileri Düzenle
        </button>
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <BaseButton v-if="canPublish" :disabled="isActing" @click="handlePublish">Yayınla</BaseButton>
        <BaseButton v-if="canArchive" variant="secondary" :disabled="isActing" @click="handleArchive">
          Arşivle
        </BaseButton>
        <RouterLink
          :to="{ name: 'course-manage-students', params: { id: course.id } }"
          class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Kayıtlı Öğrenciler
        </RouterLink>
        <RouterLink
          :to="{ name: 'course-manage-comments', params: { id: course.id } }"
          class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Yorumlar
        </RouterLink>
        <RouterLink
          :to="{ name: 'exam-manage', params: { id: course.id } }"
          class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Sınav
        </RouterLink>
        <BaseButton variant="danger" class="ml-auto" :disabled="isActing" @click="handleDelete">
          Kursu Sil
        </BaseButton>
      </div>
    </BaseCard>

    <BaseCard>
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-sm font-semibold text-slate-700">Adımlar</h2>
        <button type="button" class="text-sm font-medium text-indigo-600 hover:underline" @click="stepModalState = 'new'">
          + Adım Ekle
        </button>
      </div>

      <p v-if="steps.length === 0" class="text-sm text-slate-500">
        Bu kursta henüz adım yok. Kursu yayınlamadan önce en az bir adım eklemelisin.
      </p>

      <ul v-else class="space-y-2">
        <li
          v-for="(step, index) in steps"
          :key="step.id"
          class="flex items-center justify-between rounded-md border border-slate-200 px-4 py-2"
        >
          <div class="flex items-center gap-3">
            <div class="flex flex-col">
              <button
                type="button"
                :disabled="index === 0 || !!reorderingId"
                class="text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                title="Yukarı taşı"
                @click="moveStep(index, -1)"
              >
                ▲
              </button>
              <button
                type="button"
                :disabled="index === steps.length - 1 || !!reorderingId"
                class="text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                title="Aşağı taşı"
                @click="moveStep(index, 1)"
              >
                ▼
              </button>
            </div>
            <span class="text-sm text-slate-700">{{ step.order }}. {{ step.title }}</span>
            <span class="text-xs text-slate-400">{{ contentTypeLabels[step.contentType] }}</span>
          </div>

          <div class="flex items-center gap-3 text-sm">
            <button type="button" class="text-indigo-600 hover:underline" @click="stepModalState = step.id">
              Düzenle
            </button>
            <button type="button" class="text-red-600 hover:underline" @click="handleDeleteStep(step)">
              Sil
            </button>
          </div>
        </li>
      </ul>
    </BaseCard>

    <CourseFormModal v-if="showEditModal" :course-id="props.id" @close="showEditModal = false" @saved="load" />

    <StepFormModal
      v-if="stepModalState"
      :course-id="props.id"
      :step-id="stepModalState === 'new' ? null : stepModalState"
      @close="stepModalState = null"
      @saved="load"
    />
  </div>
</template>
