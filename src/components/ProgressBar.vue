<script setup>
defineProps({
  percentage: { type: Number, required: true },
})
</script>

<template>
  <div>
    <div class="h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div
        class="h-full rounded-full bg-indigo-600 transition-all"
        :style="{ width: `${Math.min(100, Math.max(0, percentage))}%` }"
      />
    </div>
    <p class="mt-1 text-xs text-slate-500">%{{ percentage.toFixed(0) }} tamamlandı</p>
  </div>
</template>
