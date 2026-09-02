<script setup>
import { ref, onMounted } from 'vue'
import AlertMessage from '@/components/AlertMessage.vue'
import BaseCard from '@/components/BaseCard.vue'
import StatTile from '@/components/StatTile.vue'
import EmptyState from '@/components/EmptyState.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import * as pointsApi from '@/api/points'
import { extractErrorMessage } from '@/api/errors'

const balance = ref(0)
const entries = ref([])
const rules = ref([])
const isLoading = ref(true)
const error = ref('')

const dateFormatter = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })

onMounted(async () => {
  try {
    const [wallet, ledgerEntries, activeRules] = await Promise.all([
      pointsApi.getMyWallet(),
      pointsApi.getMyLedger(),
      pointsApi.getPointsRules(),
    ])

    balance.value = wallet.balance
    entries.value = ledgerEntries
    rules.value = activeRules
  } catch (err) {
    error.value = extractErrorMessage(err, 'Puan bilgileri yüklenemedi.')
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div>
    <h1 class="mb-6 text-xl font-semibold text-slate-800">Puanlarım</h1>

    <AlertMessage v-if="error" variant="error">{{ error }}</AlertMessage>

    <div v-else-if="isLoading" class="space-y-6">
      <SkeletonBlock class="h-[68px] w-full max-w-xs" />
      <SkeletonBlock class="h-32 w-full" />
      <SkeletonBlock class="h-32 w-full" />
    </div>

    <div v-else class="space-y-8">
      <div class="max-w-xs">
        <StatTile label="Puan Bakiyem" :value="balance" variant="primary" />
      </div>

      <section>
        <h2 class="mb-3 text-sm font-semibold text-slate-700">Hareket Geçmişi</h2>

        <EmptyState v-if="entries.length === 0" title="Henüz bir puan hareketi yok." description="Bir sınavı geçtiğinde burada görünecek." />

        <BaseCard v-else padding="p-0">
          <ul class="divide-y divide-slate-200">
            <li v-for="entry in entries" :key="entry.id" class="flex items-center justify-between gap-4 p-4">
              <div>
                <p class="text-sm text-slate-800">{{ entry.description ?? 'Puan hareketi' }}</p>
                <p class="mt-1 text-xs text-slate-400">{{ dateFormatter.format(new Date(entry.createdOn)) }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-semibold" :class="entry.amount >= 0 ? 'text-success' : 'text-danger'">
                  {{ entry.amount >= 0 ? '+' : '' }}{{ entry.amount }}
                </p>
                <p class="text-xs text-slate-400">Bakiye: {{ entry.balanceAfter }}</p>
              </div>
            </li>
          </ul>
        </BaseCard>
      </section>

      <section>
        <h2 class="mb-3 text-sm font-semibold text-slate-700">Puanla Neler Yapılabilir?</h2>

        <EmptyState v-if="rules.length === 0" title="Şu anda tanımlı bir puan kuralı yok." />

        <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <BaseCard v-for="rule in rules" :key="rule.id">
            <div class="flex items-start justify-between gap-3">
              <h3 class="font-medium text-slate-800">{{ rule.title }}</h3>
              <span class="whitespace-nowrap rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                {{ rule.pointsCost }} puan
              </span>
            </div>
            <p v-if="rule.description" class="mt-2 text-sm text-slate-500">{{ rule.description }}</p>
          </BaseCard>
        </div>
      </section>
    </div>
  </div>
</template>
