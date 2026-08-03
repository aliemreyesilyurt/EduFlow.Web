<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import AuthCard from '@/components/AuthCard.vue'
import FormField from '@/components/FormField.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import * as authApi from '@/api/auth'
import { extractErrorMessage } from '@/api/errors'

const email = ref('')
const error = ref('')
const isSubmitting = ref(false)
const isDone = ref(false)

async function handleSubmit() {
  error.value = ''
  isSubmitting.value = true

  try {
    await authApi.forgotPassword(email.value)
    isDone.value = true
  } catch (err) {
    error.value = extractErrorMessage(err)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AuthCard title="Şifremi Unuttum">
    <AlertMessage v-if="isDone" variant="success">
      E-posta adresin sistemde kayıtlıysa, şifre sıfırlama bağlantısı gönderdik.
    </AlertMessage>

    <template v-else>
      <AlertMessage v-if="error" variant="error">{{ error }}</AlertMessage>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <FormField v-model="email" label="E-posta" type="email" autocomplete="email" />

        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {{ isSubmitting ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder' }}
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
