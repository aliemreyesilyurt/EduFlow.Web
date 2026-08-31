<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useForm, useField } from 'vee-validate'
import * as yup from 'yup'
import BaseModal from '@/components/BaseModal.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseCard from '@/components/BaseCard.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import * as stepsApi from '@/api/steps'
import { extractErrorMessage } from '@/api/errors'
import { successToast } from '@/utils/notify'
import { StepContentType } from '@/constants/enums'
import { isInternalContentUrl, fetchProtectedContentBlobUrl } from '@/utils/content'
import { toEmbedUrl } from '@/utils/video'

const props = defineProps({
  courseId: { type: String, required: true },
  stepId: { type: String, default: null },
})

const emit = defineEmits(['close', 'saved'])

// Once a video/document step is created it switches into edit mode in-place so a file can be
// uploaded right away, mirroring the old create -> redirect-to-edit flow without leaving the modal.
const currentStepId = ref(props.stepId)
const isLoading = ref(!!props.stepId)
const apiError = ref('')

const isEditing = computed(() => !!currentStepId.value)

const schema = yup.object({
  title: yup.string().trim().required('Başlık zorunlu').min(3, 'Başlık en az 3 karakter olmalı'),
  contentType: yup.string().required(),
  textContent: yup
    .string()
    .when('contentType', ([type], schema) => (type === StepContentType.Text ? schema.required('Metin içerik zorunlu') : schema.nullable())),
  contentUrl: yup
    .string()
    .when('contentType', ([type], schema) => (type !== StepContentType.Text ? schema.required('İçerik linki zorunlu') : schema.nullable())),
})

const { handleSubmit, setValues, isSubmitting } = useForm({
  validationSchema: schema,
  initialValues: { title: '', contentType: StepContentType.Text, textContent: '', contentUrl: '' },
})

const { value: title, errorMessage: titleError } = useField('title')
const { value: contentType } = useField('contentType')
const { value: textContent } = useField('textContent')
const { value: contentUrl, errorMessage: contentUrlError } = useField('contentUrl')

const contentTypeOptions = [
  { value: StepContentType.Text, label: 'Metin' },
  { value: StepContentType.Video, label: 'Video' },
  { value: StepContentType.Document, label: 'Döküman' },
]

const fileAccept = computed(() => (contentType.value === StepContentType.Video ? '.mp4,.webm,.mov' : '.pdf,.doc,.docx,.ppt,.pptx'))
const canUploadFile = computed(() => isEditing.value && contentType.value !== StepContentType.Text)

const uploadFile = ref(null)
const isUploading = ref(false)
const uploadProgress = ref(0)
const uploadError = ref('')
const previewUrl = ref(null)
const embedPreviewUrl = computed(() => (contentType.value === StepContentType.Video ? toEmbedUrl(contentUrl.value) : null))

async function loadPreview() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }

  if (isInternalContentUrl(contentUrl.value) && contentType.value !== StepContentType.Text) {
    previewUrl.value = await fetchProtectedContentBlobUrl(contentUrl.value)
  }
}

onMounted(async () => {
  if (!props.stepId) {
    return
  }

  try {
    const step = await stepsApi.getStepById(props.stepId)
    setValues({
      title: step.title,
      contentType: step.contentType,
      contentUrl: step.contentUrl ?? '',
      textContent: step.textContent ?? '',
    })
    await loadPreview()
  } catch (err) {
    apiError.value = extractErrorMessage(err, 'Adım yüklenemedi.')
  } finally {
    isLoading.value = false
  }
})

onBeforeUnmount(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
})

function handleFileChange(event) {
  uploadFile.value = event.target.files[0] ?? null
}

async function handleUpload() {
  if (!uploadFile.value) {
    return
  }

  isUploading.value = true
  uploadProgress.value = 0
  uploadError.value = ''

  try {
    await stepsApi.uploadStepContent(currentStepId.value, uploadFile.value, (progressEvent) => {
      if (progressEvent.total) {
        uploadProgress.value = Math.round((progressEvent.loaded / progressEvent.total) * 100)
      }
    })

    const step = await stepsApi.getStepById(currentStepId.value)
    contentUrl.value = step.contentUrl ?? ''
    uploadFile.value = null
    successToast('Dosya yüklendi.')
    await loadPreview()
  } catch (err) {
    uploadError.value = extractErrorMessage(err, 'Dosya yüklenemedi.')
  } finally {
    isUploading.value = false
  }
}

const onSubmit = handleSubmit(async (formValues) => {
  apiError.value = ''

  const payload = {
    title: formValues.title,
    contentType: formValues.contentType,
    contentUrl: formValues.contentType === StepContentType.Text ? null : formValues.contentUrl,
    textContent: formValues.contentType === StepContentType.Text ? formValues.textContent : null,
  }

  try {
    if (isEditing.value) {
      await stepsApi.updateStep(currentStepId.value, payload)
      successToast('Adım güncellendi.')
      emit('saved')
      emit('close')
    } else {
      const created = await stepsApi.createStep(props.courseId, payload)
      successToast('Adım oluşturuldu.')
      emit('saved')

      if (payload.contentType === StepContentType.Text) {
        emit('close')
      } else {
        // Stay open, now in edit mode, so a file can be uploaded right away.
        currentStepId.value = created.id
      }
    }
  } catch (err) {
    apiError.value = extractErrorMessage(err, 'Adım kaydedilemedi.')
  }
})
</script>

<template>
  <BaseModal :title="isEditing ? 'Adımı Düzenle' : 'Yeni Adım Ekle'" size="lg" @close="emit('close')">
    <div v-if="isLoading" class="space-y-4">
      <SkeletonBlock class="h-9 w-full" />
      <SkeletonBlock class="h-9 w-full" />
      <SkeletonBlock class="h-24 w-full" />
    </div>

    <template v-else>
      <form id="step-form" class="space-y-4" @submit="onSubmit">
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
          <span class="mb-1 block text-sm font-medium text-slate-700">İçerik Türü</span>
          <select
            v-model="contentType"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option v-for="opt in contentTypeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </label>

        <label v-if="contentType === StepContentType.Text" class="block">
          <span class="mb-1 block text-sm font-medium text-slate-700">Metin İçerik</span>
          <textarea
            v-model="textContent"
            rows="6"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </label>

        <label v-else class="block">
          <span class="mb-1 block text-sm font-medium text-slate-700">İçerik Linki (YouTube/Vimeo bağlantısı ya da döküman URL'si)</span>
          <input
            v-model="contentUrl"
            type="text"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <span v-if="contentUrlError" class="mt-1 block text-xs text-danger">{{ contentUrlError }}</span>
        </label>
      </form>

      <BaseCard v-if="canUploadFile" class="mt-6" padding="p-4">
        <h3 class="mb-1 text-sm font-semibold text-slate-700">Dosya Yükle</h3>
        <p class="mb-3 text-xs text-slate-500">
          Yukarıdaki linki dış bir kaynağa (ör. YouTube) yönlendirmek yerine kendi dosyanı yüklemek
          istersen aşağıdan seç. Yüklenen dosya bu adımın içerik linkinin yerine geçer.
        </p>

        <AlertMessage v-if="uploadError" variant="error">{{ uploadError }}</AlertMessage>

        <div class="flex flex-wrap items-center gap-3">
          <input :accept="fileAccept" type="file" class="text-sm" @change="handleFileChange" />
          <BaseButton variant="secondary" :disabled="!uploadFile || isUploading" @click="handleUpload">
            {{ isUploading ? `Yükleniyor... %${uploadProgress}` : 'Yükle' }}
          </BaseButton>
        </div>

        <div v-if="embedPreviewUrl" class="mt-4">
          <iframe :src="embedPreviewUrl" class="aspect-video w-full rounded-md" allowfullscreen frameborder="0" />
        </div>
        <div v-else-if="previewUrl && contentType === StepContentType.Video" class="mt-4">
          <video :src="previewUrl" controls class="w-full rounded-md" />
        </div>
        <a
          v-else-if="previewUrl && contentType === StepContentType.Document"
          :href="previewUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="mt-4 inline-block text-sm text-indigo-600 hover:underline"
        >
          Yüklenen dökümanı görüntüle
        </a>
      </BaseCard>
    </template>

    <template #footer>
      <BaseButton variant="secondary" :disabled="isSubmitting" @click="emit('close')">
        {{ canUploadFile ? 'Kapat' : 'Vazgeç' }}
      </BaseButton>
      <BaseButton v-if="!isLoading" type="submit" form="step-form" :disabled="isSubmitting">
        {{ isSubmitting ? 'Kaydediliyor...' : 'Kaydet' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
