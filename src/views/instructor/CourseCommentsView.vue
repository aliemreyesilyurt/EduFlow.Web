<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AlertMessage from '@/components/AlertMessage.vue'
import CommentList from '@/components/CommentList.vue'
import BaseCard from '@/components/BaseCard.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import * as coursesApi from '@/api/courses'
import * as stepsApi from '@/api/steps'
import * as commentsApi from '@/api/comments'
import { extractErrorMessage } from '@/api/errors'

const props = defineProps({
  id: { type: String, required: true },
})

const course = ref(null)
const comments = ref([])
const isLoading = ref(true)
const error = ref('')
const pendingId = ref(null)

async function load() {
  isLoading.value = true
  error.value = ''

  try {
    const [courseData, steps, courseComments] = await Promise.all([
      coursesApi.getCourseById(props.id),
      stepsApi.getSteps(props.id),
      commentsApi.getCourseComments(props.id),
    ])
    course.value = courseData

    const stepCommentLists = await Promise.all(steps.map((step) => commentsApi.getStepComments(step.id)))
    const stepTitleById = new Map(steps.map((step) => [step.id, step.title]))

    const withContext = [
      ...courseComments.map((c) => ({ ...c, contextLabel: 'Kurs Geneli' })),
      ...stepCommentLists.flat().map((c) => ({ ...c, contextLabel: stepTitleById.get(c.stepId) })),
    ]

    comments.value = withContext.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn))
  } catch (err) {
    error.value = extractErrorMessage(err, 'Yorumlar yüklenemedi.')
  } finally {
    isLoading.value = false
  }
}

onMounted(load)

function patchComment(updated) {
  const index = comments.value.findIndex((c) => c.id === updated.id)
  if (index !== -1) {
    comments.value[index] = { ...comments.value[index], isHidden: updated.isHidden }
  }
}

async function handleHide(commentId) {
  pendingId.value = commentId
  error.value = ''

  try {
    patchComment(await commentsApi.hideComment(commentId))
  } catch (err) {
    error.value = extractErrorMessage(err, 'Yorum gizlenemedi.')
  } finally {
    pendingId.value = null
  }
}

async function handleUnhide(commentId) {
  pendingId.value = commentId
  error.value = ''

  try {
    patchComment(await commentsApi.unhideComment(commentId))
  } catch (err) {
    error.value = extractErrorMessage(err, 'Yorumun gizliliği kaldırılamadı.')
  } finally {
    pendingId.value = null
  }
}
</script>

<template>
  <div>
    <RouterLink :to="{ name: 'course-manage-detail', params: { id } }" class="text-sm text-indigo-600 hover:underline">
      ← Kursa dön
    </RouterLink>

    <h1 class="mt-3 mb-6 text-xl font-semibold text-slate-800">
      Yorum Moderasyonu{{ course ? ` — ${course.title}` : '' }}
    </h1>

    <AlertMessage v-if="error" variant="error">{{ error }}</AlertMessage>

    <BaseCard v-else-if="isLoading">
      <SkeletonBlock v-for="n in 3" :key="n" class="mb-3 h-10 w-full last:mb-0" />
    </BaseCard>

    <BaseCard v-else>
      <CommentList
        :comments="comments"
        moderatable
        :pending-id="pendingId"
        @hide="handleHide"
        @unhide="handleUnhide"
      />
    </BaseCard>
  </div>
</template>
