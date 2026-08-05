<script setup>
import { ref, computed, onMounted } from 'vue'
import CourseCard from '@/components/CourseCard.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import EmptyState from '@/components/EmptyState.vue'
import IconSearch from '@/components/icons/IconSearch.vue'
import * as coursesApi from '@/api/courses'
import { extractErrorMessage } from '@/api/errors'

const courses = ref([])
const search = ref('')
const isLoading = ref(true)
const error = ref('')

const filteredCourses = computed(() => {
  const term = search.value.trim().toLowerCase()

  if (!term) {
    return courses.value
  }

  return courses.value.filter((course) => course.title.toLowerCase().includes(term))
})

onMounted(async () => {
  try {
    courses.value = await coursesApi.getAllCourses()
  } catch (err) {
    error.value = extractErrorMessage(err, 'Kurslar yüklenemedi.')
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between gap-4">
      <h1 class="text-xl font-semibold text-slate-800">Kurs Kataloğu</h1>
      <input
        v-model="search"
        type="search"
        placeholder="Kurs ara..."
        class="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
    </div>

    <AlertMessage v-if="error" variant="error">{{ error }}</AlertMessage>

    <div v-else-if="isLoading" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="n in 6" :key="n" class="rounded-lg border border-slate-200 bg-white p-5">
        <SkeletonBlock class="h-4 w-2/3" />
        <SkeletonBlock class="mt-2 h-3 w-1/3" />
        <SkeletonBlock class="mt-4 h-3 w-full" />
      </div>
    </div>

    <EmptyState v-else-if="filteredCourses.length === 0" title="Aramanla eşleşen kurs bulunamadı.">
      <template #icon><IconSearch /></template>
    </EmptyState>

    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <CourseCard v-for="course in filteredCourses" :key="course.id" :course="course" />
    </div>
  </div>
</template>
