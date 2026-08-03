<script setup>
import { ref, computed, onMounted } from 'vue'
import CourseCard from '@/components/CourseCard.vue'
import AlertMessage from '@/components/AlertMessage.vue'
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

    <p v-else-if="isLoading" class="text-sm text-slate-500">Yükleniyor...</p>

    <p v-else-if="filteredCourses.length === 0" class="text-sm text-slate-500">
      Aramanla eşleşen kurs bulunamadı.
    </p>

    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <CourseCard v-for="course in filteredCourses" :key="course.id" :course="course" />
    </div>
  </div>
</template>
