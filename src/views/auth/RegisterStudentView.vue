<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import AuthCard from '@/components/AuthCard.vue'
import FormField from '@/components/FormField.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import * as authApi from '@/api/auth'
import { extractErrorMessage } from '@/api/errors'

const tenantSlug = ref('')
const email = ref('')
const password = ref('')
const firstName = ref('')
const lastName = ref('')
const error = ref('')
const isSubmitting = ref(false)
const isDone = ref(false)

async function handleSubmit() {
  error.value = ''
  isSubmitting.value = true

  try {
    await authApi.registerStudent({
      tenantSlug: tenantSlug.value,
      email: email.value,
      password: password.value,
      firstName: firstName.value,
      lastName: lastName.value,
    })
    isDone.value = true
  } catch (err) {
    error.value = extractErrorMessage(err, 'Kayıt oluşturulamadı.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AuthCard title="Öğrenci Kaydı">
    <AlertMessage v-if="isDone" variant="success">
      Kaydın alındı. E-postana gönderdiğimiz doğrulama bağlantısına tıkladıktan sonra giriş
      yapabilirsin.
    </AlertMessage>

    <template v-else>
      <AlertMessage v-if="error" variant="error">{{ error }}</AlertMessage>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <FormField v-model="tenantSlug" label="Kurum Kodu" />
        <FormField v-model="firstName" label="Ad" />
        <FormField v-model="lastName" label="Soyad" />
        <FormField v-model="email" label="E-posta" type="email" autocomplete="email" />
        <FormField v-model="password" label="Şifre" type="password" autocomplete="new-password" minlength="8" />

        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {{ isSubmitting ? 'Kaydediliyor...' : 'Kaydol' }}
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
