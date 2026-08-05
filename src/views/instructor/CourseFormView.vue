<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import FormField from '@/components/FormField.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import BaseButton from '@/components/BaseButton.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import * as coursesApi from '@/api/courses'
import { extractErrorMessage } from '@/api/errors'

const props = defineProps({
  id: { type: String, default: null },
})

const router = useRouter()

const title = ref('')
const description = ref('')
const isLoading = ref(!!props.id)
const isSubmitting = ref(false)
const error = ref('')

const isEditing = computed(() => !!props.id)

onMounted(async () => {
  if (!props.id) {
    return
  }

  try {
    const course = await coursesApi.getCourseById(props.id)
    title.value = course.title
    description.value = course.description ?? ''
  } catch (err) {
    error.value = extractErrorMessage(err, 'Kurs yüklenemedi.')
  } finally {
    isLoading.value = false
  }
})

async function handleSubmit() {
  error.value = ''
  isSubmitting.value = true

  try {
    if (isEditing.value) {
      await coursesApi.updateCourse(props.id, title.value, description.value || null)
      router.push({ name: 'course-manage-detail', params: { id: props.id } })
    } else {
      const created = await coursesApi.createCourse(title.value, description.value || null)
      router.push({ name: 'course-manage-detail', params: { id: created.id } })
    }
  } catch (err) {
    error.value = extractErrorMessage(err, 'Kurs kaydedilemedi.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-xl">
    <h1 class="mb-6 text-xl font-semibold text-slate-800">
      {{ isEditing ? 'Kursu Düzenle' : 'Yeni Kurs Oluştur' }}
    </h1>

    <p v-if="!isEditing" class="mb-4 text-sm text-slate-500">
      Önce kursun başlığını ve açıklamasını belirle; ardından adım eklemeye ve yayınlamaya
      geçeceğin yönetim ekranına yönlendirileceksin.
    </p>

    <div v-if="isLoading" class="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      <SkeletonBlock class="h-9 w-full" />
      <SkeletonBlock class="h-24 w-full" />
      <SkeletonBlock class="h-9 w-full" />
    </div>

    <form v-else class="space-y-4 rounded-lg border border-slate-200 bg-white p-6" @submit.prevent="handleSubmit">
      <AlertMessage v-if="error" variant="error">{{ error }}</AlertMessage>

      <FormField v-model="title" label="Başlık" />

      <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-700">Açıklama</span>
        <textarea
          v-model="description"
          rows="4"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </label>

      <BaseButton type="submit" block :disabled="isSubmitting">
        {{ isSubmitting ? 'Kaydediliyor...' : isEditing ? 'Kaydet' : 'Kursu Oluştur' }}
      </BaseButton>
    </form>
  </div>
</template>
