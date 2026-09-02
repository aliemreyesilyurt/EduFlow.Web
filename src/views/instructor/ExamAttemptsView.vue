<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AlertMessage from '@/components/AlertMessage.vue'
import BaseCard from '@/components/BaseCard.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import EmptyState from '@/components/EmptyState.vue'
import * as coursesApi from '@/api/courses'
import * as proctoringApi from '@/api/proctoring'
import { extractErrorMessage } from '@/api/errors'

const props = defineProps({
  id: { type: String, required: true },
})

const course = ref(null)
const attempts = ref([])
const isLoading = ref(true)
const error = ref('')

function reviewBadge(attempt) {
  if (attempt.reviewApproved === true) {
    return { variant: 'success', label: 'Onaylandı' }
  }
  if (attempt.reviewApproved === false) {
    return { variant: 'danger', label: 'Reddedildi' }
  }
  if (attempt.requiresReview) {
    return { variant: 'warning', label: 'İncelenmeli' }
  }
  return { variant: 'neutral', label: 'İnceleme gerekmiyor' }
}

async function load() {
  isLoading.value = true
  error.value = ''

  try {
    course.value = await coursesApi.getCourseById(props.id)
    attempts.value = await proctoringApi.getExamAttemptsForReview(props.id)
  } catch (err) {
    error.value = extractErrorMessage(err, 'Denemeler yüklenemedi.')
  } finally {
    isLoading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <RouterLink :to="{ name: 'exam-manage', params: { id } }" class="text-sm text-indigo-600 hover:underline">
      ← Sınava dön
    </RouterLink>

    <h1 class="mt-3 mb-6 text-xl font-semibold text-slate-800">
      Sınav Denemeleri{{ course ? ` — ${course.title}` : '' }}
    </h1>

    <div v-if="isLoading" class="space-y-3">
      <SkeletonBlock class="h-16 w-full" />
      <SkeletonBlock class="h-16 w-full" />
    </div>

    <template v-else>
      <AlertMessage v-if="error" variant="error">{{ error }}</AlertMessage>

      <EmptyState
        v-else-if="attempts.length === 0"
        title="Henüz deneme yok"
        description="Öğrenciler sınava girdikçe denemeler burada listelenecek."
      />

      <BaseCard v-else padding="p-0">
        <ul class="divide-y divide-slate-200">
          <li v-for="attempt in attempts" :key="attempt.id" class="flex items-center justify-between gap-4 px-4 py-3">
            <div>
              <p class="text-sm font-medium text-slate-800">
                {{ attempt.studentName }}
                <span class="text-xs font-normal text-slate-400">— Deneme {{ attempt.attemptNumber }}</span>
              </p>
              <p class="mt-1 text-xs text-slate-500">
                <span v-if="attempt.submittedOn">
                  %{{ attempt.scorePercentage?.toFixed(0) }} — {{ attempt.passed ? 'Geçti' : 'Kaldı' }}
                </span>
                <span v-else>Devam ediyor</span>
                <span> · {{ attempt.violationCount }} ihlal sinyali</span>
              </p>
            </div>

            <div class="flex items-center gap-3">
              <StatusBadge :variant="reviewBadge(attempt).variant">{{ reviewBadge(attempt).label }}</StatusBadge>
              <RouterLink
                :to="{ name: 'proctoring-report', params: { id, attemptId: attempt.id } }"
                class="text-sm font-medium text-indigo-600 hover:underline"
              >
                Rapor
              </RouterLink>
            </div>
          </li>
        </ul>
      </BaseCard>
    </template>
  </div>
</template>
