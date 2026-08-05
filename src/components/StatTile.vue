<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  variant: { type: String, default: 'neutral' }, // neutral | primary | success | warning | danger | info
})

const dotClasses = {
  neutral: 'bg-slate-400',
  primary: 'bg-indigo-500',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
}
</script>

<template>
  <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-card">
    <div class="flex items-center gap-2">
      <span class="h-2 w-2 rounded-full" :class="dotClasses[variant]" />
      <span class="text-xs font-medium text-slate-500">{{ label }}</span>
    </div>
    <p class="mt-2 font-heading text-2xl font-semibold text-slate-800">{{ value }}</p>
  </div>
</template>
