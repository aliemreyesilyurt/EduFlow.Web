<script setup>
import { ref, computed, onMounted } from 'vue'
import { useForm, useField } from 'vee-validate'
import * as yup from 'yup'
import BaseModal from '@/components/BaseModal.vue'
import BaseButton from '@/components/BaseButton.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import * as coursesApi from '@/api/courses'
import { extractErrorMessage } from '@/api/errors'
import { successToast } from '@/utils/notify'

const props = defineProps({
  courseId: { type: String, default: null },
})

const emit = defineEmits(['close', 'saved'])

const isEditing = computed(() => !!props.courseId)
const isLoading = ref(isEditing.value)
const apiError = ref('')

const schema = yup.object({
  title: yup.string().trim().required('Başlık zorunlu').min(3, 'Başlık en az 3 karakter olmalı'),
  description: yup.string().nullable(),
})

const { handleSubmit, setValues, isSubmitting } = useForm({
  validationSchema: schema,
  initialValues: { title: '', description: '' },
})

const { value: title, errorMessage: titleError } = useField('title')
const { value: description } = useField('description')

onMounted(async () => {
  if (!isEditing.value) {
    return
  }

  try {
    const course = await coursesApi.getCourseById(props.courseId)
    setValues({ title: course.title, description: course.description ?? '' })
  } catch (err) {
    apiError.value = extractErrorMessage(err, 'Kurs yüklenemedi.')
  } finally {
    isLoading.value = false
  }
})

const onSubmit = handleSubmit(async (values) => {
  apiError.value = ''

  try {
    if (isEditing.value) {
      await coursesApi.updateCourse(props.courseId, values.title, values.description || null)
      successToast('Kurs güncellendi.')
      emit('saved', { id: props.courseId })
    } else {
      const created = await coursesApi.createCourse(values.title, values.description || null)
      successToast('Kurs oluşturuldu.')
      emit('saved', created)
    }

    emit('close')
  } catch (err) {
    apiError.value = extractErrorMessage(err, 'Kurs kaydedilemedi.')
  }
})
</script>

<template>
  <BaseModal :title="isEditing ? 'Kursu Düzenle' : 'Yeni Kurs Oluştur'" @close="emit('close')">
    <div v-if="isLoading" class="space-y-4">
      <SkeletonBlock class="h-9 w-full" />
      <SkeletonBlock class="h-24 w-full" />
    </div>

    <form v-else id="course-form" class="space-y-4" @submit="onSubmit">
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
        <span class="mb-1 block text-sm font-medium text-slate-700">Açıklama</span>
        <textarea
          v-model="description"
          rows="4"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </label>
    </form>

    <template #footer>
      <BaseButton variant="secondary" :disabled="isSubmitting" @click="emit('close')">Vazgeç</BaseButton>
      <BaseButton type="submit" form="course-form" :disabled="isSubmitting || isLoading">
        {{ isSubmitting ? 'Kaydediliyor...' : 'Kaydet' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
