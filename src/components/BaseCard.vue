<script setup>
defineProps({
  padding: { type: String, default: 'p-6' },
})
</script>

<template>
  <div class="rounded-lg border border-slate-200 bg-white shadow-card" :class="padding">
    <slot />
  </div>
</template>
