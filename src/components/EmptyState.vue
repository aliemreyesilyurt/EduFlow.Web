<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
})
</script>

<template>
  <div
    class="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-6 py-10 text-center"
  >
    <span class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
      <slot name="icon" />
    </span>
    <p class="font-heading text-sm font-medium text-slate-700">{{ title }}</p>
    <p v-if="description" class="max-w-xs text-sm text-slate-500">{{ description }}</p>
    <div v-if="$slots.action" class="mt-2">
      <slot name="action" />
    </div>
  </div>
</template>
