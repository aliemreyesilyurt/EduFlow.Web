<script setup>
import { ref, onMounted } from 'vue'
import AlertMessage from '@/components/AlertMessage.vue'
import BaseCard from '@/components/BaseCard.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import EmptyState from '@/components/EmptyState.vue'
import PointsRuleFormModal from '@/components/instructor/PointsRuleFormModal.vue'
import * as pointsApi from '@/api/points'
import { extractErrorMessage } from '@/api/errors'
import { confirmDialog, successToast, errorToast } from '@/utils/notify'

const rules = ref([])
const isLoading = ref(true)
const error = ref('')
const ruleModalState = ref(null) // null | 'new' | ruleId

async function load() {
  isLoading.value = true
  error.value = ''

  try {
    rules.value = await pointsApi.getTenantPointsRules()
  } catch (err) {
    error.value = extractErrorMessage(err, 'Puan kuralları yüklenemedi.')
  } finally {
    isLoading.value = false
  }
}

onMounted(load)

async function handleDelete(rule) {
  const confirmed = await confirmDialog('Kuralı sil', `"${rule.title}" kuralını silmek istediğine emin misin?`)

  if (!confirmed) {
    return
  }

  try {
    await pointsApi.deletePointsRule(rule.id)
    successToast('Kural silindi.')
    await load()
  } catch (err) {
    errorToast(extractErrorMessage(err, 'Kural silinemedi.'))
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 class="text-xl font-semibold text-slate-800">Puan Kuralları</h1>
      <button
        type="button"
        class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        @click="ruleModalState = 'new'"
      >
        Kural Ekle
      </button>
    </div>

    <PointsRuleFormModal
      v-if="ruleModalState"
      :rule-id="ruleModalState === 'new' ? null : ruleModalState"
      @close="ruleModalState = null"
      @saved="load"
    />

    <AlertMessage v-if="error" variant="error">{{ error }}</AlertMessage>

    <div v-else-if="isLoading" class="space-y-3">
      <SkeletonBlock v-for="n in 3" :key="n" class="h-16 w-full" />
    </div>

    <template v-else>
      <EmptyState
        v-if="rules.length === 0"
        title="Henüz bir puan kuralı tanımlanmadı."
        description='Öğrencilerin puanlarını nerede kullanabileceğini tanımlamak için "Kural Ekle" butonuna tıkla.'
      />

      <BaseCard v-else padding="p-0">
        <ul class="divide-y divide-slate-200">
          <li v-for="rule in rules" :key="rule.id" class="flex items-center justify-between gap-4 p-4">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-medium text-slate-800">{{ rule.title }}</h3>
                <StatusBadge :variant="rule.isActive ? 'success' : 'neutral'">
                  {{ rule.isActive ? 'Aktif' : 'Pasif' }}
                </StatusBadge>
              </div>
              <p v-if="rule.description" class="mt-1 text-sm text-slate-500">{{ rule.description }}</p>
              <p class="mt-1 text-xs text-slate-400">{{ rule.pointsCost }} puan</p>
            </div>

            <div class="flex shrink-0 items-center gap-3 text-sm">
              <button type="button" class="text-indigo-600 hover:underline" @click="ruleModalState = rule.id">
                Düzenle
              </button>
              <button type="button" class="text-red-600 hover:underline" @click="handleDelete(rule)">Sil</button>
            </div>
          </li>
        </ul>
      </BaseCard>
    </template>
  </div>
</template>
