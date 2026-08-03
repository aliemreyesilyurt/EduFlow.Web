<script setup>
import { useAuthStore } from '@/stores/auth'

defineProps({
  comments: { type: Array, required: true },
})

const auth = useAuthStore()

function formatDate(value) {
  return new Date(value).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <ul class="space-y-3">
    <li v-if="comments.length === 0" class="text-sm text-slate-500">Henüz yorum yok.</li>

    <li v-for="comment in comments" :key="comment.id" class="rounded-md border border-slate-200 p-3">
      <div class="flex items-center justify-between text-sm">
        <span class="font-medium text-slate-700">
          {{ comment.authorId === auth.user?.id ? 'Sen' : comment.authorName }}
        </span>
        <span class="text-xs text-slate-400">{{ formatDate(comment.createdOn) }}</span>
      </div>
      <p class="mt-1 text-sm text-slate-600">{{ comment.content }}</p>
    </li>
  </ul>
</template>
