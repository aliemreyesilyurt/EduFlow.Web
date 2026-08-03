<script setup>
defineProps({
  title: { type: String, required: true },
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
    <div class="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 class="mb-6 text-center text-xl font-semibold text-slate-800">{{ title }}</h1>
      <slot />
    </div>
  </div>
</template>
