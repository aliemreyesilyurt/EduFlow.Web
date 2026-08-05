<script setup>
import { ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import AuthCard from '@/components/AuthCard.vue'
import FormField from '@/components/FormField.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import BaseButton from '@/components/BaseButton.vue'
import * as authApi from '@/api/auth'
import { extractErrorMessage } from '@/api/errors'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const userId = route.query.userId
const token = route.query.token

const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const isSubmitting = ref(false)

async function handleSubmit() {
  error.value = ''

  if (password.value !== confirmPassword.value) {
    error.value = 'Şifreler eşleşmiyor.'
    return
  }

  isSubmitting.value = true

  try {
    const tokens = await authApi.acceptInvitation(userId, token, password.value)
    auth.setSession(tokens)
    router.push({ name: 'home' })
  } catch (err) {
    error.value = extractErrorMessage(err, 'Davet geçersiz veya süresi dolmuş.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AuthCard title="Daveti Kabul Et">
    <AlertMessage v-if="!userId || !token" variant="error">
      Bağlantı eksik veya geçersiz. Lütfen e-postandaki bağlantıyı tekrar kullan.
    </AlertMessage>

    <template v-else>
      <AlertMessage v-if="error" variant="error">{{ error }}</AlertMessage>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <FormField v-model="password" label="Şifre Belirle" type="password" autocomplete="new-password" minlength="8" />
        <FormField
          v-model="confirmPassword"
          label="Şifre (Tekrar)"
          type="password"
          autocomplete="new-password"
          minlength="8"
        />

        <BaseButton type="submit" block :disabled="isSubmitting">
          {{ isSubmitting ? 'Kaydediliyor...' : 'Daveti Kabul Et ve Giriş Yap' }}
        </BaseButton>
      </form>
    </template>

    <div class="mt-6 text-center text-sm text-slate-500">
      <RouterLink :to="{ name: 'login' }" class="text-indigo-600 hover:underline">
        Giriş ekranına dön
      </RouterLink>
    </div>
  </AuthCard>
</template>
