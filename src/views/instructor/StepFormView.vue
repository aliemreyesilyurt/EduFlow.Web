<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import FormField from '@/components/FormField.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseCard from '@/components/BaseCard.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import * as stepsApi from '@/api/steps'
import { extractErrorMessage } from '@/api/errors'
import { StepContentType } from '@/constants/enums'
import { isInternalContentUrl, fetchProtectedContentBlobUrl } from '@/utils/content'
import { toEmbedUrl } from '@/utils/video'

const props = defineProps({
  courseId: { type: String, required: true },
  stepId: { type: String, default: null },
})

const router = useRouter()

const title = ref('')
const contentType = ref(StepContentType.Text)
const contentUrl = ref('')
const textContent = ref('')
const isLoading = ref(!!props.stepId)
const isSubmitting = ref(false)
const error = ref('')

const isEditing = computed(() => !!props.stepId)

const contentTypeOptions = [
  { value: StepContentType.Text, label: 'Metin' },
  { value: StepContentType.Video, label: 'Video' },
  { value: StepContentType.Document, label: 'Döküman' },
]

const fileAccept = computed(() =>
  contentType.value === StepContentType.Video ? '.mp4,.webm,.mov' : '.pdf,.doc,.docx,.ppt,.pptx',
)

// Content upload can only happen once the step exists (the endpoint is steps/{id}/content),
// so it's only offered in edit mode.
const canUploadFile = computed(
  () => isEditing.value && contentType.value !== StepContentType.Text,
)

const uploadFile = ref(null)
const isUploading = ref(false)
const uploadProgress = ref(0)
const uploadError = ref('')
const previewUrl = ref(null)
const embedPreviewUrl = computed(() =>
  contentType.value === StepContentType.Video ? toEmbedUrl(contentUrl.value) : null,
)

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
    title.value = step.title
    contentType.value = step.contentType
    contentUrl.value = step.contentUrl ?? ''
    textContent.value = step.textContent ?? ''
    await loadPreview()
  } catch (err) {
    error.value = extractErrorMessage(err, 'Adım yüklenemedi.')
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
    await stepsApi.uploadStepContent(props.stepId, uploadFile.value, (progressEvent) => {
      if (progressEvent.total) {
        uploadProgress.value = Math.round((progressEvent.loaded / progressEvent.total) * 100)
      }
    })

    const step = await stepsApi.getStepById(props.stepId)
    contentUrl.value = step.contentUrl ?? ''
    uploadFile.value = null
    await loadPreview()
  } catch (err) {
    uploadError.value = extractErrorMessage(err, 'Dosya yüklenemedi.')
  } finally {
    isUploading.value = false
  }
}

async function handleSubmit() {
  error.value = ''
  isSubmitting.value = true

  const payload = {
    title: title.value,
    contentType: contentType.value,
    contentUrl: contentType.value === StepContentType.Text ? null : contentUrl.value,
    textContent: contentType.value === StepContentType.Text ? textContent.value : null,
  }

  try {
    if (isEditing.value) {
      await stepsApi.updateStep(props.stepId, payload)
      router.push({ name: 'course-manage-detail', params: { id: props.courseId } })
    } else {
      const created = await stepsApi.createStep(props.courseId, payload)

      if (payload.contentType === StepContentType.Text) {
        router.push({ name: 'course-manage-detail', params: { id: props.courseId } })
      } else {
        // Jump straight to edit mode so a video/document step can get an uploaded file
        // right away instead of only the link that was just required to create it.
        router.push({ name: 'step-manage-edit', params: { courseId: props.courseId, stepId: created.id } })
      }
    }
  } catch (err) {
    error.value = extractErrorMessage(err, 'Adım kaydedilemedi.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-xl">
    <h1 class="mb-6 text-xl font-semibold text-slate-800">
      {{ isEditing ? 'Adımı Düzenle' : 'Yeni Adım Ekle' }}
    </h1>

    <div v-if="isLoading" class="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      <SkeletonBlock class="h-9 w-full" />
      <SkeletonBlock class="h-9 w-full" />
      <SkeletonBlock class="h-24 w-full" />
    </div>

    <template v-else>
      <form class="space-y-4 rounded-lg border border-slate-200 bg-white p-6" @submit.prevent="handleSubmit">
        <AlertMessage v-if="error" variant="error">{{ error }}</AlertMessage>

        <FormField v-model="title" label="Başlık" />

        <label class="block">
          <span class="mb-1 block text-sm font-medium text-slate-700">İçerik Türü</span>
          <select
            v-model="contentType"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option v-for="opt in contentTypeOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </label>

        <label v-if="contentType === StepContentType.Text" class="block">
          <span class="mb-1 block text-sm font-medium text-slate-700">Metin İçerik</span>
          <textarea
            v-model="textContent"
            rows="6"
            required
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </label>

        <FormField
          v-else
          v-model="contentUrl"
          label="İçerik Linki (YouTube/Vimeo bağlantısı ya da döküman URL'si)"
          required
        />

        <BaseButton type="submit" block :disabled="isSubmitting">
          {{ isSubmitting ? 'Kaydediliyor...' : 'Kaydet' }}
        </BaseButton>
      </form>

      <BaseCard v-if="canUploadFile" class="mt-6">
        <h2 class="mb-1 text-sm font-semibold text-slate-700">Dosya Yükle</h2>
        <p class="mb-3 text-xs text-slate-500">
          Yukarıdaki linki dış bir kaynağa (ör. YouTube) yönlendirmek yerine kendi dosyanı
          yüklemek istersen aşağıdan seç. Yüklenen dosya bu adımın içerik linkinin yerine geçer.
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
  </div>
</template>
