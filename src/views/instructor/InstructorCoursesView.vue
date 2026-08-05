<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AlertMessage from '@/components/AlertMessage.vue'
import StarRating from '@/components/StarRating.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import StatTile from '@/components/StatTile.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import EmptyState from '@/components/EmptyState.vue'
import IconBookOpen from '@/components/icons/IconBookOpen.vue'
import * as coursesApi from '@/api/courses'
import { extractErrorMessage } from '@/api/errors'
import { useAuthStore } from '@/stores/auth'
import { Roles } from '@/constants/roles'
import { CourseStatus } from '@/constants/enums'

const auth = useAuthStore()

const allCourses = ref([])
const isLoading = ref(true)
const error = ref('')

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

// TenantAdmin/SysAdmin manage every course in the tenant; an Instructor only sees their own
// (the "courses" endpoint also returns every published course to them, which isn't theirs to manage).
const courses = computed(() =>
  auth.hasRole(Roles.TenantAdmin, Roles.SysAdmin)
    ? allCourses.value
    : allCourses.value.filter((c) => c.instructorId === auth.user?.id),
)

const publishedCount = computed(() => courses.value.filter((c) => c.status === CourseStatus.Published).length)
const draftCount = computed(() => courses.value.filter((c) => c.status === CourseStatus.Draft).length)
const averageRating = computed(() => {
  const rated = courses.value.filter((c) => c.averageRating)
  if (rated.length === 0) {
    return '—'
  }
  return (rated.reduce((sum, c) => sum + c.averageRating, 0) / rated.length).toFixed(1)
})

onMounted(async () => {
  try {
    allCourses.value = await coursesApi.getAllCourses()
  } catch (err) {
    error.value = extractErrorMessage(err, 'Kurslar yüklenemedi.')
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 class="text-xl font-semibold text-slate-800">Kurslarım</h1>
      <RouterLink
        :to="{ name: 'course-manage-create' }"
        class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Yeni Kurs
      </RouterLink>
    </div>

    <AlertMessage v-if="error" variant="error">{{ error }}</AlertMessage>

    <div v-else-if="isLoading" class="space-y-4">
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SkeletonBlock v-for="n in 4" :key="n" class="h-[68px] w-full" />
      </div>
      <div v-for="n in 3" :key="n" class="rounded-lg border border-slate-200 bg-white p-5">
        <SkeletonBlock class="h-4 w-1/3" />
        <SkeletonBlock class="mt-2 h-3 w-1/2" />
      </div>
    </div>

    <template v-else>
      <div v-if="courses.length > 0" class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Toplam kurs" :value="courses.length" variant="primary" />
        <StatTile label="Yayında" :value="publishedCount" variant="success" />
        <StatTile label="Taslak" :value="draftCount" variant="neutral" />
        <StatTile label="Ortalama puan" :value="averageRating" variant="warning" />
      </div>

      <EmptyState
        v-if="courses.length === 0"
        title="Henüz bir kurs oluşturmadın."
        description='Başlamak için "Yeni Kurs" butonuna tıkla.'
      >
        <template #icon><IconBookOpen /></template>
      </EmptyState>
    </template>

    <ul v-if="!isLoading && courses.length > 0" class="space-y-4">
      <li v-for="course in courses" :key="course.id" class="rounded-lg border border-slate-200 bg-white p-5">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-semibold text-slate-800">{{ course.title }}</h3>
              <StatusBadge :variant="statusVariants[course.status]">{{ statusLabels[course.status] }}</StatusBadge>
            </div>
            <p v-if="auth.hasRole(Roles.TenantAdmin, Roles.SysAdmin)" class="mt-1 text-xs text-slate-400">
              Eğitmen: {{ course.instructorName }}
            </p>
            <div class="mt-2 flex items-center gap-1 text-sm text-slate-500">
              <StarRating :model-value="course.averageRating ?? 0" readonly size="text-sm" />
              <span v-if="course.averageRating">{{ course.averageRating.toFixed(1) }}</span>
              <span>({{ course.ratingCount }}) · {{ course.commentCount }} yorum</span>
            </div>
          </div>

          <RouterLink
            :to="{ name: 'course-manage-detail', params: { id: course.id } }"
            class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Yönet
          </RouterLink>
        </div>
      </li>
    </ul>
  </div>
</template>
