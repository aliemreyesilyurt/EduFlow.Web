<script setup>
defineProps({
  title: { type: String, required: true },
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
    <div class="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-card">
      <div class="mb-4 flex justify-center">
        <span class="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          <svg viewBox="0 0 24 24" fill="none" class="h-6 w-6" aria-hidden="true">
            <path
              d="M12 3 1 8l11 5 9-4.1V17h2V8L12 3Z"
              fill="currentColor"
            />
            <path
              d="M5 10.6V15c0 1.7 3.1 4 7 4s7-2.3 7-4v-4.4l-7 3.2-7-3.2Z"
              fill="currentColor"
              opacity=".55"
            />
          </svg>
        </span>
      </div>
      <h1 class="mb-6 text-center font-heading text-xl font-semibold text-slate-800">{{ title }}</h1>
      <slot />
    </div>
  </div>
</template>
