<script setup>
import { ref } from 'vue'
import FormField from '@/components/FormField.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import BaseButton from '@/components/BaseButton.vue'
import * as authApi from '@/api/auth'
import { extractErrorMessage } from '@/api/errors'

const email = ref('')
const firstName = ref('')
const lastName = ref('')
const error = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)

async function handleSubmit() {
  error.value = ''
  successMessage.value = ''
  isSubmitting.value = true

  try {
    await authApi.inviteInstructor(email.value, firstName.value, lastName.value)
    successMessage.value = `${email.value} adresine davet gönderildi.`
    email.value = ''
    firstName.value = ''
    lastName.value = ''
  } catch (err) {
    error.value = extractErrorMessage(err, 'Davet gönderilemedi.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-xl">
    <h1 class="mb-6 text-xl font-semibold text-slate-800">Eğitmen Davet Et</h1>

    <p class="mb-4 text-sm text-slate-500">
      Davet edilen kişiye e-posta ile bir davet bağlantısı gönderilir; bağlantıya tıklayıp
      kendi şifresini belirledikten sonra eğitmen olarak kuruma katılır.
    </p>

    <form class="space-y-4 rounded-lg border border-slate-200 bg-white p-6" @submit.prevent="handleSubmit">
      <AlertMessage v-if="error" variant="error">{{ error }}</AlertMessage>
      <AlertMessage v-if="successMessage" variant="success">{{ successMessage }}</AlertMessage>

      <FormField v-model="firstName" label="Ad" />
      <FormField v-model="lastName" label="Soyad" />
      <FormField v-model="email" label="E-posta" type="email" autocomplete="email" />

      <BaseButton type="submit" block :disabled="isSubmitting">
        {{ isSubmitting ? 'Gönderiliyor...' : 'Davet Gönder' }}
      </BaseButton>
    </form>
  </div>
</template>
