<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseCard from '@/components/BaseCard.vue'
import FormField from '@/components/FormField.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import BaseButton from '@/components/BaseButton.vue'
import * as authApi from '@/api/auth'
import { extractErrorMessage } from '@/api/errors'
import { useAuthStore } from '@/stores/auth'
import { successToast } from '@/utils/notify'

const auth = useAuthStore()
const router = useRouter()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const error = ref('')
const isSubmitting = ref(false)

async function handleSubmit() {
  error.value = ''

  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Yeni şifreler eşleşmiyor.'
    return
  }

  isSubmitting.value = true

  try {
    await authApi.changePassword(currentPassword.value, newPassword.value)
    auth.markPasswordChanged()
    successToast('Şifren güncellendi.')
    router.push({ name: 'home' })
  } catch (err) {
    error.value = extractErrorMessage(err, 'Şifre güncellenemedi.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-md">
    <BaseCard>
      <h1 class="font-heading text-lg font-semibold text-slate-800">Şifreni Değiştir</h1>

      <AlertMessage v-if="auth.requiresPasswordChange" variant="warning" class="mt-4">
        Hesabına geçici bir şifreyle giriş yaptın. Devam edebilmek için önce yeni bir şifre belirlemen
        gerekiyor.
      </AlertMessage>

      <AlertMessage v-if="error" variant="error" class="mt-4">{{ error }}</AlertMessage>

      <form class="mt-6 space-y-4" @submit.prevent="handleSubmit">
        <FormField
          v-model="currentPassword"
          label="Mevcut Şifre"
          type="password"
          autocomplete="current-password"
        />
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

        <BaseButton type="submit" block :disabled="isSubmitting">
          {{ isSubmitting ? 'Güncelleniyor...' : 'Şifreyi Güncelle' }}
        </BaseButton>
      </form>
    </BaseCard>
  </div>
</template>
