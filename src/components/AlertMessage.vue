<script setup>
defineProps({
  variant: { type: String, default: 'error' }, // 'error' | 'success'
})
</script>

<template>
  <div
    class="mb-4 rounded-md px-3 py-2 text-sm"
    :class="variant === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'"
  >
    <slot />
  </div>
</template>
