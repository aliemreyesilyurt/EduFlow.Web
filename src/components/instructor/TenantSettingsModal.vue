<script setup>
import { ref, computed, onMounted } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import BaseButton from '@/components/BaseButton.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import * as tenantsApi from '@/api/tenants'
import { extractErrorMessage } from '@/api/errors'
import { successToast, errorToast } from '@/utils/notify'

const emit = defineEmits(['close'])

const settings = ref(null)
const isLoading = ref(true)
const isSaving = ref(false)
const apiError = ref('')
const copied = ref(false)

const registrationLink = computed(() =>
  settings.value ? `${window.location.origin}/register/student?tenant=${settings.value.slug}` : '',
)

async function load() {
  isLoading.value = true
  apiError.value = ''

  try {
    settings.value = await tenantsApi.getSettings()
  } catch (err) {
    apiError.value = extractErrorMessage(err, 'Kayıt ayarları yüklenemedi.')
  } finally {
    isLoading.value = false
  }
}

onMounted(load)

async function handleToggle() {
  const nextValue = !settings.value.allowSelfRegistration
  isSaving.value = true
  apiError.value = ''

  try {
    settings.value = await tenantsApi.updateSettings(nextValue)
    successToast(nextValue ? 'Öz-kayıt açıldı.' : 'Öz-kayıt kapatıldı.')
  } catch (err) {
    errorToast(extractErrorMessage(err, 'Ayar güncellenemedi.'))
  } finally {
    isSaving.value = false
  }
}

async function copyLink() {
  await navigator.clipboard.writeText(registrationLink.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}
</script>

<template>
  <BaseModal title="Kayıt Ayarları" @close="emit('close')">
    <div v-if="isLoading" class="space-y-4">
      <SkeletonBlock class="h-9 w-full" />
      <SkeletonBlock class="h-9 w-full" />
    </div>

    <div v-else-if="settings" class="space-y-5">
      <AlertMessage v-if="apiError" variant="error">{{ apiError }}</AlertMessage>

      <div class="flex items-center justify-between rounded-md border border-slate-200 p-4">
        <div>
          <p class="text-sm font-medium text-slate-700">Öz-kayıt (self-registration)</p>
          <p class="mt-1 text-xs text-slate-500">
            Açıkken, aşağıdaki linki bilen herkes doğrudan öğrenci olarak kuruma kaydolabilir.
            Kapalıyken kayıt yalnızca davetle mümkün olur.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          :aria-checked="settings.allowSelfRegistration"
          :disabled="isSaving"
          class="relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50"
          :class="settings.allowSelfRegistration ? 'bg-indigo-600' : 'bg-slate-300'"
          @click="handleToggle"
        >
          <span
            class="absolute top-0.5 h-5 w-5 rounded-full bg-white transition"
            :class="settings.allowSelfRegistration ? 'left-5' : 'left-0.5'"
          />
        </button>
      </div>

      <div v-if="settings.allowSelfRegistration">
        <span class="mb-1 block text-sm font-medium text-slate-700">Öğrenci Kayıt Linki</span>
        <div class="flex gap-2">
          <input
            :value="registrationLink"
            readonly
            class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600"
          />
          <BaseButton variant="secondary" @click="copyLink">{{ copied ? 'Kopyalandı' : 'Kopyala' }}</BaseButton>
        </div>
      </div>
    </div>

    <template #footer>
      <BaseButton variant="secondary" @click="emit('close')">Kapat</BaseButton>
    </template>
  </BaseModal>
</template>
