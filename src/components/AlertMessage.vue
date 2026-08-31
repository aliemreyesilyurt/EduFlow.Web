<script setup>
defineProps({
  variant: { type: String, default: 'error' }, // 'error' | 'success' | 'warning'
})

const variantClasses = {
  error: 'bg-danger/10 text-danger',
  success: 'bg-success/10 text-success',
  warning: 'bg-amber-100 text-amber-800',
}
</script>

<template>
  <div class="mb-4 rounded-md px-3 py-2 text-sm" :class="variantClasses[variant]">
    <slot />
  </div>
</template>
