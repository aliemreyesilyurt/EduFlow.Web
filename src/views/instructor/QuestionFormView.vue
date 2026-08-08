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
  questionId: { type: String, default: null },
})

const router = useRouter()

const examId = ref(null)
const text = ref('')
const points = ref(1)
const options = ref([
  { text: '', isCorrect: true },
  { text: '', isCorrect: false },
])
const isLoading = ref(true)
const isSubmitting = ref(false)
const error = ref('')

const isEditing = computed(() => !!props.questionId)

onMounted(async () => {
  try {
    const exam = await examsApi.getCourseExam(props.courseId)
    examId.value = exam.id

    if (props.questionId) {
      const question = exam.questions.find((q) => q.id === props.questionId)

      if (!question) {
        error.value = 'Soru bulunamadı.'
        return
      }

      text.value = question.text
      points.value = question.points
      options.value = question.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect }))
    }
  } catch (err) {
    error.value = extractErrorMessage(err, 'Sınav bilgisi yüklenemedi.')
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

async function handleSubmit() {
  error.value = ''
  isSubmitting.value = true

  const payload = {
    text: text.value,
    points: Number(points.value),
    options: options.value.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
  }

  try {
    if (isEditing.value) {
      await examsApi.updateQuestion(props.questionId, payload)
    } else {
      await examsApi.createQuestion(examId.value, payload)
    }

    router.push({ name: 'exam-manage', params: { id: props.courseId } })
  } catch (err) {
    error.value = extractErrorMessage(err, 'Soru kaydedilemedi.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-xl">
    <h1 class="mb-6 text-xl font-semibold text-slate-800">
      {{ isEditing ? 'Soruyu Düzenle' : 'Yeni Soru Ekle' }}
    </h1>

    <div v-if="isLoading" class="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      <SkeletonBlock class="h-9 w-full" />
      <SkeletonBlock class="h-24 w-full" />
    </div>

    <form v-else class="space-y-4 rounded-lg border border-slate-200 bg-white p-6" @submit.prevent="handleSubmit">
      <AlertMessage v-if="error" variant="error">{{ error }}</AlertMessage>

      <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-700">Soru Metni</span>
        <textarea
          v-model="text"
          rows="3"
          required
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </label>

      <FormField v-model="points" type="number" label="Puan" minlength="1" />

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
              required
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

      <BaseButton type="submit" block :disabled="isSubmitting">
        {{ isSubmitting ? 'Kaydediliyor...' : 'Kaydet' }}
      </BaseButton>
    </form>
  </div>
</template>
