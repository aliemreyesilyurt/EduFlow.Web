<script setup>
import { ref } from 'vue'
import BaseButton from '@/components/BaseButton.vue'

defineProps({
  isSubmitting: { type: Boolean, default: false },
})
const emit = defineEmits(['submit'])

const content = ref('')

function handleSubmit() {
  if (!content.value.trim()) {
    return
  }

  emit('submit', content.value.trim())
  content.value = ''
}
</script>

<template>
  <form class="flex gap-2" @submit.prevent="handleSubmit">
    <input
      v-model="content"
      type="text"
      placeholder="Yorumunu yaz..."
      class="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
    />
    <BaseButton type="submit" :disabled="isSubmitting">Gönder</BaseButton>
  </form>
</template>
