<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import AuthCard from '@/components/AuthCard.vue'
import FormField from '@/components/FormField.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import * as authApi from '@/api/auth'
import { extractErrorMessage } from '@/api/errors'

const route = useRoute()
const userId = route.query.userId
const token = route.query.token

const status = ref(userId && token ? 'pending' : 'missing') // pending | success | failed | missing
const error = ref('')

const resendEmail = ref('')
const isResending = ref(false)
const resendDone = ref(false)

onMounted(async () => {
  if (status.value !== 'pending') {
    return
  }

  try {
    await authApi.confirmEmail(userId, token)
    status.value = 'success'
  } catch (err) {
    status.value = 'failed'
    error.value = extractErrorMessage(err, 'Bağlantı geçersiz veya süresi dolmuş.')
  }
})

async function handleResend() {
  isResending.value = true

  try {
    await authApi.resendConfirmationEmail(resendEmail.value)
    resendDone.value = true
  } finally {
    isResending.value = false
  }
}
</script>

<template>
  <AuthCard title="E-posta Doğrulama">
    <AlertMessage v-if="status === 'pending'" variant="success">Doğrulanıyor...</AlertMessage>
    <AlertMessage v-else-if="status === 'success'" variant="success">
      E-posta adresin doğrulandı, artık giriş yapabilirsin.
    </AlertMessage>

    <template v-else>
      <AlertMessage variant="error">
        {{ status === 'missing' ? 'Bağlantı eksik veya geçersiz.' : error }}
      </AlertMessage>

      <div v-if="resendDone" class="mt-4">
        <AlertMessage variant="success">
          E-posta adresin sistemde kayıtlıysa, yeni bir doğrulama bağlantısı gönderdik.
        </AlertMessage>
      </div>
      <form v-else class="mt-4 space-y-4" @submit.prevent="handleResend">
        <FormField v-model="resendEmail" label="E-posta" type="email" autocomplete="email" />
        <button
          type="submit"
          :disabled="isResending"
          class="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {{ isResending ? 'Gönderiliyor...' : 'Doğrulama Bağlantısını Tekrar Gönder' }}
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
