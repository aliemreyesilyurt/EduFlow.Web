<script setup>
defineProps({
  variant: { type: String, default: 'error' }, // 'error' | 'success'
})
</script>

<template>
  <div
    class="mb-4 rounded-md px-3 py-2 text-sm"
    :class="variant === 'error' ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'"
  >
    <slot />
  </div>
</template>
