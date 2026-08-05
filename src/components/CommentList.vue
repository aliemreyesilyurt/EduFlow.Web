<script setup>
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  comments: { type: Array, required: true },
  moderatable: { type: Boolean, default: false },
  pendingId: { type: String, default: null },
})
defineEmits(['hide', 'unhide'])

const auth = useAuthStore()

function formatDate(value) {
  return new Date(value).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <ul class="space-y-3">
    <li v-if="comments.length === 0" class="text-sm text-slate-500">Henüz yorum yok.</li>

    <li
      v-for="comment in comments"
      :key="comment.id"
      class="rounded-md border p-3"
      :class="comment.isHidden ? 'border-red-200 bg-red-50' : 'border-slate-200'"
    >
      <div class="flex items-center justify-between text-sm">
        <span class="font-medium text-slate-700">
          {{ comment.authorId === auth.user?.id ? 'Sen' : comment.authorName }}
          <span v-if="comment.contextLabel" class="font-normal text-slate-400"> · {{ comment.contextLabel }}</span>
        </span>
        <span class="text-xs text-slate-400">{{ formatDate(comment.createdOn) }}</span>
      </div>
      <p class="mt-1 text-sm text-slate-600">{{ comment.content }}</p>

      <div v-if="moderatable" class="mt-2 flex items-center gap-3">
        <span v-if="comment.isHidden" class="text-xs font-medium text-red-600">Gizlendi</span>
        <button
          v-if="!comment.isHidden"
          type="button"
          :disabled="props.pendingId === comment.id"
          class="text-xs text-red-600 hover:underline disabled:opacity-50"
          @click="$emit('hide', comment.id)"
        >
          Gizle
        </button>
        <button
          v-else
          type="button"
          :disabled="props.pendingId === comment.id"
          class="text-xs text-indigo-600 hover:underline disabled:opacity-50"
          @click="$emit('unhide', comment.id)"
        >
          Gizlemeyi Kaldır
        </button>
      </div>
    </li>
  </ul>
</template>
