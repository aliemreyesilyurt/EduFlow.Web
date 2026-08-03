<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import AuthCard from '@/components/AuthCard.vue'
import FormField from '@/components/FormField.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import * as authApi from '@/api/auth'
import { extractErrorMessage } from '@/api/errors'

const tenantName = ref('')
const adminEmail = ref('')
const adminPassword = ref('')
const adminFirstName = ref('')
const adminLastName = ref('')
const error = ref('')
const isSubmitting = ref(false)
const isDone = ref(false)

async function handleSubmit() {
  error.value = ''
  isSubmitting.value = true

  try {
    await authApi.registerTenant({
      tenantName: tenantName.value,
      adminEmail: adminEmail.value,
      adminPassword: adminPassword.value,
      adminFirstName: adminFirstName.value,
      adminLastName: adminLastName.value,
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
  <AuthCard title="Kurumunu Kaydet">
    <AlertMessage v-if="isDone" variant="success">
      Kurumun oluşturuldu. E-postana gönderdiğimiz doğrulama bağlantısına tıkladıktan sonra giriş
      yapabilirsin.
    </AlertMessage>

    <template v-else>
      <AlertMessage v-if="error" variant="error">{{ error }}</AlertMessage>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <FormField v-model="tenantName" label="Kurum Adı" />
        <FormField v-model="adminFirstName" label="Yetkili Adı" />
        <FormField v-model="adminLastName" label="Yetkili Soyadı" />
        <FormField v-model="adminEmail" label="Yetkili E-posta" type="email" autocomplete="email" />
        <FormField
          v-model="adminPassword"
          label="Şifre"
          type="password"
          autocomplete="new-password"
          minlength="8"
        />

        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {{ isSubmitting ? 'Kaydediliyor...' : 'Kurumu Kaydet' }}
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
