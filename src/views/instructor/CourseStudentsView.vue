<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AlertMessage from '@/components/AlertMessage.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import EmptyState from '@/components/EmptyState.vue'
import IconUsers from '@/components/icons/IconUsers.vue'
import * as coursesApi from '@/api/courses'
import { extractErrorMessage } from '@/api/errors'

const props = defineProps({
  id: { type: String, required: true },
})

const course = ref(null)
const students = ref([])
const isLoading = ref(true)
const error = ref('')

function formatDate(value) {
  return new Date(value).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

onMounted(async () => {
  try {
    const [courseData, studentsData] = await Promise.all([
      coursesApi.getCourseById(props.id),
      coursesApi.getEnrolledStudents(props.id),
    ])
    course.value = courseData
    students.value = studentsData
  } catch (err) {
    error.value = extractErrorMessage(err, 'Öğrenci listesi yüklenemedi.')
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div>
    <RouterLink :to="{ name: 'course-manage-detail', params: { id } }" class="text-sm text-indigo-600 hover:underline">
      ← Kursa dön
    </RouterLink>

    <h1 class="mt-3 mb-6 text-xl font-semibold text-slate-800">
      Kayıtlı Öğrenciler{{ course ? ` — ${course.title}` : '' }}
    </h1>

    <AlertMessage v-if="error" variant="error">{{ error }}</AlertMessage>

    <div v-else-if="isLoading" class="space-y-3">
      <div v-for="n in 3" :key="n" class="rounded-lg border border-slate-200 bg-white p-4">
        <SkeletonBlock class="h-4 w-1/4" />
        <SkeletonBlock class="mt-2 h-3 w-1/3" />
        <SkeletonBlock class="mt-3 h-2 w-full" />
      </div>
    </div>

    <EmptyState v-else-if="students.length === 0" title="Bu kursa henüz kayıtlı öğrenci yok.">
      <template #icon><IconUsers /></template>
    </EmptyState>

    <ul v-else class="space-y-3">
      <li
        v-for="student in students"
        :key="student.enrollmentId"
        class="rounded-lg border border-slate-200 bg-white p-4"
      >
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="font-medium text-slate-800">{{ student.studentName }}</p>
            <p class="text-xs text-slate-400">
              {{ formatDate(student.enrolledOn) }} tarihinde kaydoldu
              <span v-if="student.completedOn"> · Kursu tamamladı</span>
            </p>
          </div>
          <span class="text-sm text-slate-500">
            {{ student.completedSteps }}/{{ student.totalSteps }} adım
          </span>
        </div>

        <div class="mt-3 max-w-sm">
          <ProgressBar :percentage="student.progressPercentage" />
        </div>
      </li>
    </ul>
  </div>
</template>
