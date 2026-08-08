<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AlertMessage from '@/components/AlertMessage.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseCard from '@/components/BaseCard.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import * as coursesApi from '@/api/courses'
import * as examsApi from '@/api/exams'
import { extractErrorMessage } from '@/api/errors'

const props = defineProps({
  id: { type: String, required: true },
})

const course = ref(null)
const exam = ref(null)
const isLoading = ref(true)
const error = ref('')
const isActing = ref(false)
const reorderingId = ref(null)

async function load() {
  isLoading.value = true
  error.value = ''

  try {
    course.value = await coursesApi.getCourseById(props.id)

    try {
      exam.value = await examsApi.getCourseExam(props.id)
    } catch (err) {
      if (err?.response?.status === 404) {
        exam.value = null
      } else {
        throw err
      }
    }
  } catch (err) {
    error.value = extractErrorMessage(err, 'Sınav bilgisi yüklenemedi.')
  } finally {
    isLoading.value = false
  }
}

onMounted(load)

async function handlePublish() {
  isActing.value = true
  error.value = ''

  try {
    await examsApi.publishExam(exam.value.id)
    await load()
  } catch (err) {
    error.value = extractErrorMessage(err, 'Sınav yayınlanamadı.')
  } finally {
    isActing.value = false
  }
}

async function handleUnpublish() {
  isActing.value = true
  error.value = ''

  try {
    await examsApi.unpublishExam(exam.value.id)
    await load()
  } catch (err) {
    error.value = extractErrorMessage(err, 'Sınav yayından kaldırılamadı.')
  } finally {
    isActing.value = false
  }
}

async function handleDeleteExam() {
  if (!confirm('Bu sınavı silmek istediğine emin misin? Bu işlem geri alınamaz.')) {
    return
  }

  isActing.value = true
  error.value = ''

  try {
    await examsApi.deleteExam(exam.value.id)
    exam.value = null
  } catch (err) {
    error.value = extractErrorMessage(err, 'Sınav silinemedi.')
  } finally {
    isActing.value = false
  }
}

async function handleDeleteQuestion(question) {
  if (!confirm(`Bu soruyu silmek istediğine emin misin?`)) {
    return
  }

  error.value = ''

  try {
    await examsApi.deleteQuestion(question.id)
    await load()
  } catch (err) {
    error.value = extractErrorMessage(err, 'Soru silinemedi.')
  }
}

async function moveQuestion(index, direction) {
  const targetIndex = index + direction
  const questions = exam.value.questions

  if (targetIndex < 0 || targetIndex >= questions.length) {
    return
  }

  const reordered = [...questions]
  ;[reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]]

  reorderingId.value = questions[index].id
  error.value = ''

  try {
    await examsApi.reorderQuestions(
      exam.value.id,
      reordered.map((q) => q.id),
    )
    exam.value = { ...exam.value, questions: reordered.map((q, i) => ({ ...q, order: i + 1 })) }
  } catch (err) {
    error.value = extractErrorMessage(err, 'Sorular yeniden sıralanamadı.')
  } finally {
    reorderingId.value = null
  }
}
</script>

<template>
  <div>
    <RouterLink :to="{ name: 'course-manage-detail', params: { id } }" class="text-sm text-indigo-600 hover:underline">
      ← Kursa dön
    </RouterLink>

    <h1 class="mt-3 mb-6 text-xl font-semibold text-slate-800">
      Sınav{{ course ? ` — ${course.title}` : '' }}
    </h1>

    <div v-if="isLoading" class="space-y-6">
      <BaseCard>
        <SkeletonBlock class="h-5 w-1/2" />
        <SkeletonBlock class="mt-4 h-9 w-64" />
      </BaseCard>
    </div>

    <template v-else>
      <AlertMessage v-if="error" variant="error">{{ error }}</AlertMessage>

      <BaseCard v-if="!exam">
        <p class="mb-4 text-sm text-slate-600">Bu kurs için henüz bir sınav tanımlanmadı.</p>
        <RouterLink :to="{ name: 'exam-settings', params: { courseId: id } }">
          <BaseButton>Sınav Oluştur</BaseButton>
        </RouterLink>
      </BaseCard>

      <div v-else class="space-y-6">
        <BaseCard>
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-lg font-semibold text-slate-800">{{ exam.title }}</h2>
                <StatusBadge :variant="exam.isPublished ? 'success' : 'neutral'">
                  {{ exam.isPublished ? 'Yayında' : 'Taslak' }}
                </StatusBadge>
              </div>
              <p class="mt-2 text-sm text-slate-500">
                Geçme notu: %{{ exam.passScorePercentage }}
                <span v-if="exam.timeLimitMinutes"> · Süre: {{ exam.timeLimitMinutes }} dk</span>
                <span v-if="exam.maxAttempts"> · Deneme hakkı: {{ exam.maxAttempts }}</span>
              </p>
            </div>

            <RouterLink :to="{ name: 'exam-settings', params: { courseId: id } }">
              <BaseButton variant="secondary">Ayarları Düzenle</BaseButton>
            </RouterLink>
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <BaseButton v-if="!exam.isPublished" :disabled="isActing" @click="handlePublish">Yayınla</BaseButton>
            <BaseButton v-else variant="secondary" :disabled="isActing" @click="handleUnpublish">
              Yayından Kaldır
            </BaseButton>
            <BaseButton variant="danger" class="ml-auto" :disabled="isActing" @click="handleDeleteExam">
              Sınavı Sil
            </BaseButton>
          </div>
        </BaseCard>

        <BaseCard>
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-slate-700">Sorular</h2>
            <RouterLink
              :to="{ name: 'question-manage-create', params: { courseId: id } }"
              class="text-sm font-medium text-indigo-600 hover:underline"
            >
              + Soru Ekle
            </RouterLink>
          </div>

          <p v-if="exam.questions.length === 0" class="text-sm text-slate-500">
            Bu sınavda henüz soru yok. Yayınlamadan önce en az bir soru eklemelisin.
          </p>

          <ul v-else class="space-y-2">
            <li
              v-for="(question, index) in exam.questions"
              :key="question.id"
              class="flex items-center justify-between rounded-md border border-slate-200 px-4 py-2"
            >
              <div class="flex items-center gap-3">
                <div class="flex flex-col">
                  <button
                    type="button"
                    :disabled="index === 0 || !!reorderingId"
                    class="text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                    title="Yukarı taşı"
                    @click="moveQuestion(index, -1)"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    :disabled="index === exam.questions.length - 1 || !!reorderingId"
                    class="text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                    title="Aşağı taşı"
                    @click="moveQuestion(index, 1)"
                  >
                    ▼
                  </button>
                </div>
                <span class="text-sm text-slate-700">{{ question.order }}. {{ question.text }}</span>
                <span class="text-xs text-slate-400">{{ question.points }} puan</span>
              </div>

              <div class="flex items-center gap-3 text-sm">
                <RouterLink
                  :to="{ name: 'question-manage-edit', params: { courseId: id, questionId: question.id } }"
                  class="text-indigo-600 hover:underline"
                >
                  Düzenle
                </RouterLink>
                <button type="button" class="text-red-600 hover:underline" @click="handleDeleteQuestion(question)">
                  Sil
                </button>
              </div>
            </li>
          </ul>
        </BaseCard>
      </div>
    </template>
  </div>
</template>
