<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import ProgressBar from '@/components/ProgressBar.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import EmptyState from '@/components/EmptyState.vue'
import IconBookOpen from '@/components/icons/IconBookOpen.vue'
import * as enrollmentsApi from '@/api/enrollments'
import { extractErrorMessage } from '@/api/errors'

const myCourses = ref([])
const isLoading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    myCourses.value = await enrollmentsApi.getMyCourses()
  } catch (err) {
    error.value = extractErrorMessage(err, 'Kurslarım yüklenemedi.')
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div>
    <h1 class="mb-6 text-xl font-semibold text-slate-800">Kurslarım</h1>

    <AlertMessage v-if="error" variant="error">{{ error }}</AlertMessage>

    <div v-else-if="isLoading" class="space-y-4">
      <div v-for="n in 3" :key="n" class="rounded-lg border border-slate-200 bg-white p-5">
        <SkeletonBlock class="h-4 w-1/3" />
        <SkeletonBlock class="mt-2 h-3 w-1/4" />
        <SkeletonBlock class="mt-4 h-2 w-full" />
      </div>
    </div>

    <EmptyState v-else-if="myCourses.length === 0" title="Henüz bir kursa kayıtlı değilsin.">
      <template #icon><IconBookOpen /></template>
      <template #action>
        <RouterLink :to="{ name: 'course-catalog' }" class="text-sm font-medium text-indigo-600 hover:underline">
          Kurs kataloğuna göz at
        </RouterLink>
      </template>
    </EmptyState>

    <ul v-else class="space-y-4">
      <li
        v-for="entry in myCourses"
        :key="entry.enrollmentId"
        class="rounded-lg border border-slate-200 bg-white p-5"
      >
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 class="font-semibold text-slate-800">{{ entry.courseTitle }}</h3>
            <p class="text-xs text-slate-400">
              {{ entry.completedSteps }}/{{ entry.totalSteps }} adım tamamlandı
              <span v-if="entry.completedOn"> · Kurs tamamlandı</span>
            </p>
          </div>
          <div class="flex items-center gap-2">
            <RouterLink
              v-if="entry.completedOn && entry.examId"
              :to="{ name: 'exam-take', params: { courseId: entry.courseId } }"
              class="rounded-md border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
            >
              Sınava Gir
            </RouterLink>
            <RouterLink
              :to="{ name: 'course-detail', params: { id: entry.courseId } }"
              class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Devam Et
            </RouterLink>
          </div>
        </div>

        <div class="mt-3 max-w-sm">
          <ProgressBar :percentage="entry.progressPercentage" />
        </div>
      </li>
    </ul>
  </div>
</template>
