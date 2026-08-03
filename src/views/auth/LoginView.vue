<script setup>
import { ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import AuthCard from '@/components/AuthCard.vue'
import FormField from '@/components/FormField.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import { useAuthStore } from '@/stores/auth'
import { extractErrorMessage } from '@/api/errors'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const error = ref('')
const isSubmitting = ref(false)

async function handleSubmit() {
  error.value = ''
  isSubmitting.value = true

  try {
    await auth.login(email.value, password.value)
    router.push(route.query.redirect ?? { name: 'home' })
  } catch (err) {
    error.value = extractErrorMessage(err, 'E-posta veya şifre hatalı.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AuthCard title="Giriş Yap">
    <AlertMessage v-if="error" variant="error">{{ error }}</AlertMessage>

    <form class="space-y-4" @submit.prevent="handleSubmit">
      <FormField v-model="email" label="E-posta" type="email" autocomplete="email" />
      <FormField v-model="password" label="Şifre" type="password" autocomplete="current-password" />

      <button
        type="submit"
        :disabled="isSubmitting"
        class="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {{ isSubmitting ? 'Giriş yapılıyor...' : 'Giriş Yap' }}
      </button>
    </form>

    <div class="mt-6 flex flex-col items-center gap-2 text-sm text-slate-500">
      <RouterLink :to="{ name: 'forgot-password' }" class="text-indigo-600 hover:underline">
        Şifremi unuttum
      </RouterLink>
      <div class="flex gap-1">
        <span>Hesabın yok mu?</span>
        <RouterLink :to="{ name: 'register-student' }" class="text-indigo-600 hover:underline">
          Öğrenci olarak kaydol
        </RouterLink>
      </div>
      <RouterLink :to="{ name: 'register-tenant' }" class="text-indigo-600 hover:underline">
        Kurumunu kaydet
      </RouterLink>
    </div>
  </AuthCard>
</template>
