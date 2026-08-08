<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import FormField from '@/components/FormField.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import BaseButton from '@/components/BaseButton.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import * as examsApi from '@/api/exams'
import { extractErrorMessage } from '@/api/errors'

const props = defineProps({
  courseId: { type: String, required: true },
})

const router = useRouter()

const examId = ref(null)
const title = ref('')
const passScorePercentage = ref(60)
const timeLimitMinutes = ref('')
const maxAttempts = ref('')
const isLoading = ref(true)
const isSubmitting = ref(false)
const error = ref('')

const isEditing = computed(() => !!examId.value)

onMounted(async () => {
  try {
    const exam = await examsApi.getCourseExam(props.courseId)
    examId.value = exam.id
    title.value = exam.title
    passScorePercentage.value = exam.passScorePercentage
    timeLimitMinutes.value = exam.timeLimitMinutes ?? ''
    maxAttempts.value = exam.maxAttempts ?? ''
  } catch (err) {
    if (err?.response?.status !== 404) {
      error.value = extractErrorMessage(err, 'Sınav bilgisi yüklenemedi.')
    }
  } finally {
    isLoading.value = false
  }
})

async function handleSubmit() {
  error.value = ''
  isSubmitting.value = true

  const payload = {
    title: title.value,
    passScorePercentage: Number(passScorePercentage.value),
    timeLimitMinutes: timeLimitMinutes.value === '' ? null : Number(timeLimitMinutes.value),
    maxAttempts: maxAttempts.value === '' ? null : Number(maxAttempts.value),
  }

  try {
    if (isEditing.value) {
      await examsApi.updateExam(examId.value, payload)
    } else {
      await examsApi.createExam(props.courseId, payload)
    }

    router.push({ name: 'exam-manage', params: { id: props.courseId } })
  } catch (err) {
    error.value = extractErrorMessage(err, 'Sınav kaydedilemedi.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-xl">
    <h1 class="mb-6 text-xl font-semibold text-slate-800">
      {{ isEditing ? 'Sınav Ayarlarını Düzenle' : 'Sınav Oluştur' }}
    </h1>

    <div v-if="isLoading" class="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      <SkeletonBlock class="h-9 w-full" />
      <SkeletonBlock class="h-9 w-full" />
      <SkeletonBlock class="h-9 w-full" />
    </div>

    <form v-else class="space-y-4 rounded-lg border border-slate-200 bg-white p-6" @submit.prevent="handleSubmit">
      <AlertMessage v-if="error" variant="error">{{ error }}</AlertMessage>

      <FormField v-model="title" label="Başlık" />

      <FormField
        v-model="passScorePercentage"
        type="number"
        label="Geçme Notu (%)"
        minlength="1"
      />

      <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-700">Süre Sınırı (dakika, opsiyonel)</span>
        <input
          v-model="timeLimitMinutes"
          type="number"
          min="1"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </label>

      <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-700">Deneme Hakkı (opsiyonel, boşsa sınırsız)</span>
        <input
          v-model="maxAttempts"
          type="number"
          min="1"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </label>

      <BaseButton type="submit" block :disabled="isSubmitting">
        {{ isSubmitting ? 'Kaydediliyor...' : 'Kaydet' }}
      </BaseButton>
    </form>
  </div>
</template>
