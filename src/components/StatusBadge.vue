<script setup>
defineProps({
  variant: { type: String, default: 'neutral' }, // neutral | primary | success | warning | danger | info
})

const variantClasses = {
  neutral: 'bg-slate-100 text-slate-600',
  primary: 'bg-indigo-50 text-indigo-600',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-info/10 text-info',
}
</script>

<template>
  <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="variantClasses[variant]">
    <slot />
  </span>
</template>
