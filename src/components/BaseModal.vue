<script setup>
import { onMounted, onUnmounted } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  size: { type: String, default: 'md' }, // sm | md | lg
})

const emit = defineEmits(['close'])

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

function handleKeydown(event) {
  if (event.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/50" @click="emit('close')" />

      <div
        class="relative w-full rounded-lg bg-white shadow-xl"
        :class="sizeClasses[props.size]"
        role="dialog"
        aria-modal="true"
      >
        <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 class="font-heading text-lg font-semibold text-slate-800">{{ props.title }}</h2>
          <button
            type="button"
            class="text-slate-400 hover:text-slate-600"
            aria-label="Kapat"
            @click="emit('close')"
          >
            ✕
          </button>
        </div>

        <div class="max-h-[70vh] overflow-y-auto px-6 py-5">
          <slot />
        </div>

        <div v-if="$slots.footer" class="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
