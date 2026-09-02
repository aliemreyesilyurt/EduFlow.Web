<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink } from 'vue-router'
import AlertMessage from '@/components/AlertMessage.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseCard from '@/components/BaseCard.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import EmptyState from '@/components/EmptyState.vue'
import * as proctoringApi from '@/api/proctoring'
import { extractErrorMessage } from '@/api/errors'
import { successToast, errorToast } from '@/utils/notify'
import { fetchProtectedContentBlobUrl } from '@/utils/content'
import { ProctoringEventType } from '@/constants/enums'

const props = defineProps({
  id: { type: String, required: true },
  attemptId: { type: String, required: true },
})

const eventLabels = {
  [ProctoringEventType.FullscreenExit]: 'Fullscreen çıkışı',
  [ProctoringEventType.WindowBlur]: 'Pencere odak kaybı',
  [ProctoringEventType.TabHidden]: 'Sekme değişimi',
  [ProctoringEventType.CopyAttempt]: 'Kopyalama girişimi',
  [ProctoringEventType.PasteAttempt]: 'Yapıştırma girişimi',
  [ProctoringEventType.ContextMenu]: 'Sağ tık girişimi',
  [ProctoringEventType.MultipleScreens]: 'Birden fazla ekran',
  [ProctoringEventType.CameraDenied]: 'Kamera izni reddedildi',
  [ProctoringEventType.CameraStopped]: 'Kamera durduruldu',
}

const report = ref(null)
const snapshotUrls = ref({})
const isLoading = ref(true)
const isReviewing = ref(false)
const error = ref('')
const reviewNote = ref('')

async function load() {
  isLoading.value = true
  error.value = ''

  try {
    report.value = await proctoringApi.getProctoringReport(props.attemptId)
    reviewNote.value = report.value.reviewNote ?? ''

    for (const snapshot of report.value.snapshots) {
      fetchProtectedContentBlobUrl(proctoringApi.snapshotContentUrl(props.attemptId, snapshot.id)).then((url) => {
        snapshotUrls.value = { ...snapshotUrls.value, [snapshot.id]: url }
      })
    }
  } catch (err) {
    error.value = extractErrorMessage(err, 'Bütünlük raporu yüklenemedi.')
  } finally {
    isLoading.value = false
  }
}

onMounted(load)

onBeforeUnmount(() => {
  Object.values(snapshotUrls.value).forEach((url) => URL.revokeObjectURL(url))
})

const reviewStatusLabel = computed(() => {
  if (!report.value) return null
  if (report.value.reviewApproved === true) return { variant: 'success', label: 'Onaylandı' }
  if (report.value.reviewApproved === false) return { variant: 'danger', label: 'Reddedildi' }
  return { variant: 'warning', label: 'İnceleme bekliyor' }
})

async function handleReview(approved) {
  isReviewing.value = true

  try {
    const result = await proctoringApi.reviewAttempt(props.attemptId, {
      approved,
      note: reviewNote.value.trim() === '' ? null : reviewNote.value,
    })
    report.value = { ...report.value, reviewApproved: result.approved, reviewedOn: result.reviewedOn, reviewNote: result.note }
    successToast(approved ? 'Deneme onaylandı.' : 'Deneme reddedildi.')
  } catch (err) {
    errorToast(extractErrorMessage(err, 'İnceleme kaydedilemedi.'))
  } finally {
    isReviewing.value = false
  }
}
</script>

<template>
  <div>
    <RouterLink :to="{ name: 'exam-attempts', params: { id } }" class="text-sm text-indigo-600 hover:underline">
      ← Denemelere dön
    </RouterLink>

    <div v-if="isLoading" class="mt-6 space-y-4">
      <SkeletonBlock class="h-8 w-1/3" />
      <SkeletonBlock class="h-32 w-full" />
    </div>

    <template v-else>
      <AlertMessage v-if="error" variant="error" class="mt-6">{{ error }}</AlertMessage>

      <template v-else-if="report">
        <div class="mt-3 mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-xl font-semibold text-slate-800">Bütünlük Raporu — {{ report.studentName }}</h1>
            <p class="mt-1 text-sm text-slate-500">{{ report.violationCount }} ihlal sinyali toplandı.</p>
          </div>
          <StatusBadge :variant="reviewStatusLabel.variant">{{ reviewStatusLabel.label }}</StatusBadge>
        </div>

        <div class="space-y-6">
          <BaseCard>
            <h2 class="mb-3 text-sm font-semibold text-slate-700">İhlal Zaman Çizelgesi</h2>
            <p v-if="report.events.length === 0" class="text-sm text-slate-500">Herhangi bir ihlal sinyali kaydedilmedi.</p>
            <ul v-else class="space-y-2">
              <li v-for="event in report.events" :key="event.id" class="flex items-center justify-between text-sm">
                <span class="text-slate-700">{{ eventLabels[event.type] ?? 'Bilinmeyen sinyal' }}</span>
                <span class="text-xs text-slate-400">{{ new Date(event.occurredOn).toLocaleString('tr-TR') }}</span>
              </li>
            </ul>
          </BaseCard>

          <BaseCard>
            <h2 class="mb-3 text-sm font-semibold text-slate-700">Kamera Görüntüleri</h2>
            <EmptyState v-if="report.snapshots.length === 0" title="Snapshot yok" description="Bu denemede kamera görüntüsü toplanmadı." />
            <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div v-for="snapshot in report.snapshots" :key="snapshot.id" class="overflow-hidden rounded-md border border-slate-200">
                <img
                  v-if="snapshotUrls[snapshot.id]"
                  :src="snapshotUrls[snapshot.id]"
                  class="aspect-video w-full object-cover"
                  :alt="`Snapshot ${new Date(snapshot.capturedOn).toLocaleTimeString('tr-TR')}`"
                />
                <SkeletonBlock v-else class="aspect-video w-full" />
                <p class="px-2 py-1 text-center text-xs text-slate-500">
                  {{ new Date(snapshot.capturedOn).toLocaleTimeString('tr-TR') }}
                </p>
              </div>
            </div>
          </BaseCard>

          <BaseCard>
            <h2 class="mb-3 text-sm font-semibold text-slate-700">Eğitmen Kararı</h2>

            <label class="block">
              <span class="mb-1 block text-sm font-medium text-slate-700">Not (opsiyonel)</span>
              <textarea
                v-model="reviewNote"
                rows="3"
                class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </label>

            <div class="mt-3 flex gap-3">
              <BaseButton :disabled="isReviewing" @click="handleReview(true)">Onayla</BaseButton>
              <BaseButton variant="danger" :disabled="isReviewing" @click="handleReview(false)">Reddet</BaseButton>
            </div>

            <p v-if="report.reviewedOn" class="mt-3 text-xs text-slate-500">
              Son karar: {{ new Date(report.reviewedOn).toLocaleString('tr-TR') }}
            </p>
          </BaseCard>
        </div>
      </template>
    </template>
  </div>
</template>
