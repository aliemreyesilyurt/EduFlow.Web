<script setup>
import { RouterLink } from 'vue-router'
import StarRating from '@/components/StarRating.vue'

defineProps({
  course: { type: Object, required: true },
})
</script>

<template>
  <RouterLink
    :to="{ name: 'course-detail', params: { id: course.id } }"
    class="block rounded-lg border border-slate-200 bg-white p-5 shadow-card transition duration-150 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
  >
    <h3 class="font-heading font-semibold text-slate-800">{{ course.title }}</h3>
    <p class="mt-1 text-sm text-slate-500">{{ course.instructorName }}</p>
    <p v-if="course.description" class="mt-2 line-clamp-2 text-sm text-slate-600">
      {{ course.description }}
    </p>

    <div class="mt-4 flex items-center justify-between text-sm text-slate-500">
      <div class="flex items-center gap-1">
        <StarRating :model-value="course.averageRating ?? 0" readonly size="text-sm" />
        <span v-if="course.averageRating">{{ course.averageRating.toFixed(1) }}</span>
        <span>({{ course.ratingCount }})</span>
      </div>
      <span>{{ course.commentCount }} yorum</span>
    </div>
  </RouterLink>
</template>
