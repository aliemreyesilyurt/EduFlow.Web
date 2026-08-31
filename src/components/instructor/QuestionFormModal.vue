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
  questionId: { type: String, default: null },
})

const emit = defineEmits(['close', 'saved'])

const examId = ref(null)
const options = ref([
  { text: '', isCorrect: true },
  { text: '', isCorrect: false },
])
const isLoading = ref(true)
const apiError = ref('')

const isEditing = computed(() => !!props.questionId)

const schema = yup.object({
  text: yup.string().trim().required('Soru metni zorunlu').min(3, 'Soru metni en az 3 karakter olmalı'),
  points: yup.number().typeError('Sayı olmalı').required().min(1),
})

const { handleSubmit, setValues, isSubmitting } = useForm({
  validationSchema: schema,
  initialValues: { text: '', points: 1 },
})

const { value: text, errorMessage: textError } = useField('text')
const { value: points, errorMessage: pointsError } = useField('points')

onMounted(async () => {
  try {
    const exam = await examsApi.getCourseExam(props.courseId)
    examId.value = exam.id

    if (props.questionId) {
      const question = exam.questions.find((q) => q.id === props.questionId)

      if (!question) {
        apiError.value = 'Soru bulunamadı.'
        return
      }

      setValues({ text: question.text, points: question.points })
      options.value = question.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect }))
    }
  } catch (err) {
    apiError.value = extractErrorMessage(err, 'Sınav bilgisi yüklenemedi.')
  } finally {
    isLoading.value = false
  }
})

function addOption() {
  options.value.push({ text: '', isCorrect: false })
}

function removeOption(index) {
  if (options.value.length <= 2) {
    return
  }

  const wasCorrect = options.value[index].isCorrect
  options.value.splice(index, 1)

  if (wasCorrect) {
    options.value[0].isCorrect = true
  }
}

function setCorrect(index) {
  options.value.forEach((o, i) => {
    o.isCorrect = i === index
  })
}

const onSubmit = handleSubmit(async (values) => {
  apiError.value = ''

  if (options.value.some((o) => !o.text.trim())) {
    apiError.value = 'Tüm seçeneklerin metni doldurulmalı.'
    return
  }

  const payload = {
    text: values.text,
    points: Number(values.points),
    options: options.value.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
  }

  try {
    if (isEditing.value) {
      await examsApi.updateQuestion(props.questionId, payload)
      successToast('Soru güncellendi.')
    } else {
      await examsApi.createQuestion(examId.value, payload)
      successToast('Soru oluşturuldu.')
    }

    emit('saved')
    emit('close')
  } catch (err) {
    apiError.value = extractErrorMessage(err, 'Soru kaydedilemedi.')
  }
})
</script>

<template>
  <BaseModal :title="isEditing ? 'Soruyu Düzenle' : 'Yeni Soru Ekle'" size="lg" @close="emit('close')">
    <div v-if="isLoading" class="space-y-4">
      <SkeletonBlock class="h-9 w-full" />
      <SkeletonBlock class="h-24 w-full" />
    </div>

    <form v-else id="question-form" class="space-y-4" @submit="onSubmit">
      <AlertMessage v-if="apiError" variant="error">{{ apiError }}</AlertMessage>

      <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-700">Soru Metni</span>
        <textarea
          v-model="text"
          rows="3"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <span v-if="textError" class="mt-1 block text-xs text-danger">{{ textError }}</span>
      </label>

      <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-700">Puan</span>
        <input
          v-model="points"
          type="number"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <span v-if="pointsError" class="mt-1 block text-xs text-danger">{{ pointsError }}</span>
      </label>

      <div>
        <div class="mb-2 flex items-center justify-between">
          <span class="text-sm font-medium text-slate-700">Seçenekler</span>
          <button type="button" class="text-sm text-indigo-600 hover:underline" @click="addOption">
            + Seçenek Ekle
          </button>
        </div>

        <div class="space-y-2">
          <div v-for="(option, index) in options" :key="index" class="flex items-center gap-2">
            <input
              type="radio"
              name="correct-option"
              :checked="option.isCorrect"
              class="h-4 w-4 text-indigo-600"
              title="Doğru cevap"
              @change="setCorrect(index)"
            />
            <input
              v-model="option.text"
              type="text"
              placeholder="Seçenek metni"
              class="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="button"
              :disabled="options.length <= 2"
              class="text-red-600 hover:underline disabled:opacity-30"
              @click="removeOption(index)"
            >
              Sil
            </button>
          </div>
        </div>
        <p class="mt-1 text-xs text-slate-400">Doğru seçeneği işaretlemek için radyo düğmesini kullan.</p>
      </div>
    </form>

    <template #footer>
      <BaseButton variant="secondary" :disabled="isSubmitting" @click="emit('close')">Vazgeç</BaseButton>
      <BaseButton type="submit" form="question-form" :disabled="isSubmitting || isLoading">
        {{ isSubmitting ? 'Kaydediliyor...' : 'Kaydet' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
