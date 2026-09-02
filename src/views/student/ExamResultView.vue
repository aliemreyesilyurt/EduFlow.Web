<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AlertMessage from '@/components/AlertMessage.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseCard from '@/components/BaseCard.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import * as examsApi from '@/api/exams'
import { extractErrorMessage } from '@/api/errors'

const props = defineProps({
  courseId: { type: String, required: true },
  attemptId: { type: String, required: true },
})

const attempt = ref(null)
const canRetry = ref(false)
const rewardPoints = ref(0)
const isLoading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    attempt.value = await examsApi.getExamAttempt(props.attemptId)

    try {
      const examInfo = await examsApi.getExamForTaking(props.courseId)
      canRetry.value = examInfo.attemptsRemaining === null || examInfo.attemptsRemaining > 0
      rewardPoints.value = examInfo.rewardPoints ?? 0
    } catch {
      canRetry.value = false
    }
  } catch (err) {
    error.value = extractErrorMessage(err, 'Sınav sonucu yüklenemedi.')
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <BaseCard v-if="isLoading">
    <SkeletonBlock class="h-5 w-1/3" />
    <SkeletonBlock class="mt-4 h-24 w-full" />
  </BaseCard>

  <AlertMessage v-else-if="error" variant="error">{{ error }}</AlertMessage>

  <div v-else-if="attempt" class="space-y-6">
    <RouterLink :to="{ name: 'course-detail', params: { id: courseId } }" class="text-sm text-indigo-600 hover:underline">
      ← Kursa dön
    </RouterLink>

    <BaseCard>
      <div class="flex items-center gap-2">
        <h1 class="text-lg font-semibold text-slate-800">Sınav Sonucu</h1>
        <StatusBadge :variant="attempt.passed ? 'success' : 'danger'">
          {{ attempt.passed ? 'Geçti' : 'Kaldı' }}
        </StatusBadge>
      </div>
      <p class="mt-2 text-sm text-slate-600">
        Puan: %{{ attempt.scorePercentage?.toFixed(0) }} (Geçme notu: %{{ attempt.passScorePercentage }})
      </p>

      <AlertMessage v-if="attempt.pointsAwarded" variant="success" class="mt-3">
        🎉 {{ rewardPoints }} puan kazandınız!
      </AlertMessage>
      <AlertMessage v-else-if="attempt.passed && attempt.requiresReview" variant="warning" class="mt-3">
        Bu deneme incelemeye alındı — puan kazanımı eğitmenin onayından sonra hesabınıza yansıyacak.
      </AlertMessage>

      <RouterLink v-if="canRetry" :to="{ name: 'exam-take', params: { courseId } }" class="mt-4 inline-block">
        <BaseButton variant="secondary">Tekrar Dene</BaseButton>
      </RouterLink>
    </BaseCard>

    <BaseCard v-for="(answer, index) in attempt.answers" :key="answer.questionId">
      <div class="flex items-start justify-between gap-4">
        <p class="font-medium text-slate-800">{{ index + 1 }}. {{ answer.questionText }}</p>
        <StatusBadge :variant="answer.isCorrect ? 'success' : 'danger'">
          {{ answer.isCorrect ? 'Doğru' : 'Yanlış' }}
        </StatusBadge>
      </div>
      <p v-if="!answer.selectedOptionId" class="mt-2 text-sm text-slate-400">Cevaplanmadı</p>
    </BaseCard>
  </div>
</template>
