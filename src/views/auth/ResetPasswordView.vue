<script setup>
import { ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import AuthCard from '@/components/AuthCard.vue'
import FormField from '@/components/FormField.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import * as authApi from '@/api/auth'
import { extractErrorMessage } from '@/api/errors'

const route = useRoute()
const userId = route.query.userId
const token = route.query.token

const newPassword = ref('')
const confirmPassword = ref('')
const error = ref('')
const isSubmitting = ref(false)
const isDone = ref(false)

async function handleSubmit() {
  error.value = ''

  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Şifreler eşleşmiyor.'
    return
  }

  isSubmitting.value = true

  try {
    await authApi.resetPassword(userId, token, newPassword.value)
    isDone.value = true
  } catch (err) {
    error.value = extractErrorMessage(err, 'Bağlantı geçersiz veya süresi dolmuş.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AuthCard title="Şifre Sıfırla">
    <AlertMessage v-if="!userId || !token" variant="error">
      Bağlantı eksik veya geçersiz. Lütfen e-postandaki bağlantıyı tekrar kullan.
    </AlertMessage>

    <template v-else-if="isDone">
      <AlertMessage variant="success">Şifren güncellendi, artık giriş yapabilirsin.</AlertMessage>
    </template>

    <template v-else>
      <AlertMessage v-if="error" variant="error">{{ error }}</AlertMessage>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <FormField
          v-model="newPassword"
          label="Yeni Şifre"
          type="password"
          autocomplete="new-password"
          minlength="8"
        />
        <FormField
          v-model="confirmPassword"
          label="Yeni Şifre (Tekrar)"
          type="password"
          autocomplete="new-password"
          minlength="8"
        />

        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {{ isSubmitting ? 'Güncelleniyor...' : 'Şifreyi Güncelle' }}
        </button>
      </form>
    </template>

    <div class="mt-6 text-center text-sm text-slate-500">
      <RouterLink :to="{ name: 'login' }" class="text-indigo-600 hover:underline">
        Giriş ekranına dön
      </RouterLink>
    </div>
  </AuthCard>
</template>
