<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import ProgressBar from '@/components/ProgressBar.vue'
import AlertMessage from '@/components/AlertMessage.vue'
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

    <p v-else-if="isLoading" class="text-sm text-slate-500">Yükleniyor...</p>

    <p v-else-if="myCourses.length === 0" class="text-sm text-slate-500">
      Henüz bir kursa kayıtlı değilsin.
      <RouterLink :to="{ name: 'course-catalog' }" class="text-indigo-600 hover:underline">
        Kurs kataloğuna göz at
      </RouterLink>
    </p>

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
          <RouterLink
            :to="{ name: 'course-detail', params: { id: entry.courseId } }"
            class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Devam Et
          </RouterLink>
        </div>

        <div class="mt-3 max-w-sm">
          <ProgressBar :percentage="entry.progressPercentage" />
        </div>
      </li>
    </ul>
  </div>
</template>
