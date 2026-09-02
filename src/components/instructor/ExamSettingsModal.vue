<script setup>
import { ref, computed, onMounted } from 'vue'
import { useForm, useField } from 'vee-validate'
import * as yup from 'yup'
import BaseModal from '@/components/BaseModal.vue'
import BaseButton from '@/components/BaseButton.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import * as examsApi from '@/api/exams'
import { extractErrorMessage } from '@/api/errors'
import { successToast } from '@/utils/notify'

const props = defineProps({
  courseId: { type: String, required: true },
})

const emit = defineEmits(['close', 'saved'])

const examId = ref(null)
const isLoading = ref(true)
const apiError = ref('')

const isEditing = computed(() => !!examId.value)

const schema = yup.object({
  title: yup.string().trim().required('Başlık zorunlu').min(3, 'Başlık en az 3 karakter olmalı'),
  passScorePercentage: yup.number().typeError('Sayı olmalı').required().min(1).max(100),
  timeLimitMinutes: yup.number().typeError('Sayı olmalı').nullable().transform((v, o) => (o === '' ? null : v)).min(1),
  maxAttempts: yup.number().typeError('Sayı olmalı').nullable().transform((v, o) => (o === '' ? null : v)).min(1),
  proctoringEnabled: yup.boolean(),
  requireCamera: yup.boolean(),
  snapshotIntervalSeconds: yup
    .number()
    .typeError('Sayı olmalı')
    .nullable()
    .transform((v, o) => (o === '' ? null : v))
    .min(15)
    .max(600),
  violationWarningThreshold: yup
    .number()
    .typeError('Sayı olmalı')
    .nullable()
    .transform((v, o) => (o === '' ? null : v))
    .min(1),
})

const { handleSubmit, setValues, isSubmitting } = useForm({
  validationSchema: schema,
  initialValues: {
    title: '',
    passScorePercentage: 60,
    timeLimitMinutes: '',
    maxAttempts: '',
    proctoringEnabled: false,
    requireCamera: false,
    snapshotIntervalSeconds: 30,
    violationWarningThreshold: 3,
  },
})

const { value: title, errorMessage: titleError } = useField('title')
const { value: passScorePercentage, errorMessage: passScoreError } = useField('passScorePercentage')
const { value: timeLimitMinutes } = useField('timeLimitMinutes')
const { value: maxAttempts } = useField('maxAttempts')
const { value: proctoringEnabled } = useField('proctoringEnabled')
const { value: requireCamera } = useField('requireCamera')
const { value: snapshotIntervalSeconds } = useField('snapshotIntervalSeconds')
const { value: violationWarningThreshold } = useField('violationWarningThreshold')

onMounted(async () => {
  try {
    const exam = await examsApi.getCourseExam(props.courseId)
    examId.value = exam.id
    setValues({
      title: exam.title,
      passScorePercentage: exam.passScorePercentage,
      timeLimitMinutes: exam.timeLimitMinutes ?? '',
      maxAttempts: exam.maxAttempts ?? '',
      proctoringEnabled: exam.proctoringEnabled,
      requireCamera: exam.requireCamera,
      snapshotIntervalSeconds: exam.snapshotIntervalSeconds ?? '',
      violationWarningThreshold: exam.violationWarningThreshold ?? '',
    })
  } catch (err) {
    if (err?.response?.status !== 404) {
      apiError.value = extractErrorMessage(err, 'Sınav bilgisi yüklenemedi.')
    }
  } finally {
    isLoading.value = false
  }
})

const onSubmit = handleSubmit(async (values) => {
  apiError.value = ''

  const payload = {
    title: values.title,
    passScorePercentage: Number(values.passScorePercentage),
    timeLimitMinutes: values.timeLimitMinutes === '' || values.timeLimitMinutes == null ? null : Number(values.timeLimitMinutes),
    maxAttempts: values.maxAttempts === '' || values.maxAttempts == null ? null : Number(values.maxAttempts),
    proctoringEnabled: !!values.proctoringEnabled,
    requireCamera: !!values.requireCamera,
    snapshotIntervalSeconds:
      values.snapshotIntervalSeconds === '' || values.snapshotIntervalSeconds == null
        ? null
        : Number(values.snapshotIntervalSeconds),
    violationWarningThreshold:
      values.violationWarningThreshold === '' || values.violationWarningThreshold == null
        ? null
        : Number(values.violationWarningThreshold),
  }

  try {
    if (isEditing.value) {
      await examsApi.updateExam(examId.value, payload)
      successToast('Sınav güncellendi.')
    } else {
      await examsApi.createExam(props.courseId, payload)
      successToast('Sınav oluşturuldu.')
    }

    emit('saved')
    emit('close')
  } catch (err) {
    apiError.value = extractErrorMessage(err, 'Sınav kaydedilemedi.')
  }
})
</script>

<template>
  <BaseModal :title="isEditing ? 'Sınav Ayarlarını Düzenle' : 'Sınav Oluştur'" @close="emit('close')">
    <div v-if="isLoading" class="space-y-4">
      <SkeletonBlock class="h-9 w-full" />
      <SkeletonBlock class="h-9 w-full" />
      <SkeletonBlock class="h-9 w-full" />
    </div>

    <form v-else id="exam-settings-form" class="space-y-4" @submit="onSubmit">
      <AlertMessage v-if="apiError" variant="error">{{ apiError }}</AlertMessage>

      <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-700">Başlık</span>
        <input
          v-model="title"
          type="text"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <span v-if="titleError" class="mt-1 block text-xs text-danger">{{ titleError }}</span>
      </label>

      <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-700">Geçme Notu (%)</span>
        <input
          v-model="passScorePercentage"
          type="number"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <span v-if="passScoreError" class="mt-1 block text-xs text-danger">{{ passScoreError }}</span>
      </label>

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

      <div class="border-t border-slate-200 pt-4">
        <p class="mb-3 text-sm font-medium text-slate-700">Sınav Bütünlüğü (Proctoring)</p>

        <label class="flex items-center gap-2 text-sm text-slate-700">
          <input v-model="proctoringEnabled" type="checkbox" class="h-4 w-4" />
          Bütünlük izlemeyi etkinleştir (fullscreen, odak kaybı, kopyala-yapıştır kaydı)
        </label>

        <label class="mt-2 flex items-center gap-2 text-sm text-slate-700">
          <input v-model="requireCamera" type="checkbox" class="h-4 w-4" :disabled="!proctoringEnabled" />
          Kamera görüntüsü zorunlu
        </label>

        <div v-if="proctoringEnabled" class="mt-3 grid grid-cols-2 gap-3">
          <label class="block">
            <span class="mb-1 block text-xs font-medium text-slate-600">Snapshot Aralığı (sn)</span>
            <input
              v-model="snapshotIntervalSeconds"
              type="number"
              min="15"
              max="600"
              :disabled="!requireCamera"
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </label>

          <label class="block">
            <span class="mb-1 block text-xs font-medium text-slate-600">Uyarı Eşiği (ihlal sayısı)</span>
            <input
              v-model="violationWarningThreshold"
              type="number"
              min="1"
              class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </label>
        </div>
      </div>
    </form>

    <template #footer>
      <BaseButton variant="secondary" :disabled="isSubmitting" @click="emit('close')">Vazgeç</BaseButton>
      <BaseButton type="submit" form="exam-settings-form" :disabled="isSubmitting || isLoading">
        {{ isSubmitting ? 'Kaydediliyor...' : 'Kaydet' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
