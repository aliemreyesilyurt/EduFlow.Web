<script setup>
import { ref } from 'vue'
import { useForm, useField } from 'vee-validate'
import * as yup from 'yup'
import BaseModal from '@/components/BaseModal.vue'
import BaseButton from '@/components/BaseButton.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import * as tenantsApi from '@/api/tenants'
import { extractErrorMessage } from '@/api/errors'

const emit = defineEmits(['close'])

const schema = yup.object({
  tenantName: yup.string().trim().required('Kurum adı zorunlu'),
  adminFirstName: yup.string().trim().required('Ad zorunlu'),
  adminLastName: yup.string().trim().required('Soyad zorunlu'),
  adminEmail: yup.string().trim().required('E-posta zorunlu').email('Geçerli bir e-posta gir'),
})

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: schema,
  initialValues: { tenantName: '', adminFirstName: '', adminLastName: '', adminEmail: '' },
})

const { value: tenantName, errorMessage: tenantNameError } = useField('tenantName')
const { value: adminFirstName, errorMessage: adminFirstNameError } = useField('adminFirstName')
const { value: adminLastName, errorMessage: adminLastNameError } = useField('adminLastName')
const { value: adminEmail, errorMessage: adminEmailError } = useField('adminEmail')

const apiErrorMsg = ref('')
const created = ref(null)
const copied = ref(false)

const onSubmit = handleSubmit(async (values) => {
  apiErrorMsg.value = ''

  try {
    created.value = await tenantsApi.createTenant(values)
  } catch (err) {
    apiErrorMsg.value = extractErrorMessage(err, 'Kurum oluşturulamadı.')
  }
})

async function copyCredentials() {
  await navigator.clipboard.writeText(
    `E-posta: ${created.value.adminEmail}\nGeçici şifre: ${created.value.temporaryPassword}`,
  )
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}
</script>

<template>
  <BaseModal title="Kurum Oluştur" @close="emit('close')">
    <template v-if="created">
      <AlertMessage variant="success">
        Kurum ve yönetici hesabı oluşturuldu. Aşağıdaki bilgileri yöneticiyle paylaş; ilk girişte
        kendisinden yeni bir şifre belirlemesi istenecek.
      </AlertMessage>

      <div class="space-y-3 rounded-md border border-slate-200 p-4 text-sm">
        <div>
          <span class="block text-xs font-medium text-slate-500">E-posta</span>
          <span class="text-slate-800">{{ created.adminEmail }}</span>
        </div>
        <div>
          <span class="block text-xs font-medium text-slate-500">Geçici Şifre</span>
          <span class="font-mono text-slate-800">{{ created.temporaryPassword }}</span>
        </div>
      </div>

      <BaseButton variant="secondary" class="mt-4" @click="copyCredentials">
        {{ copied ? 'Kopyalandı' : 'Bilgileri Kopyala' }}
      </BaseButton>
    </template>

    <form v-else id="create-tenant-form" class="space-y-4" @submit="onSubmit">
      <AlertMessage v-if="apiErrorMsg" variant="error">{{ apiErrorMsg }}</AlertMessage>

      <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-700">Kurum Adı</span>
        <input
          v-model="tenantName"
          type="text"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <span v-if="tenantNameError" class="mt-1 block text-xs text-danger">{{ tenantNameError }}</span>
      </label>

      <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-700">Yönetici Adı</span>
        <input
          v-model="adminFirstName"
          type="text"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <span v-if="adminFirstNameError" class="mt-1 block text-xs text-danger">{{ adminFirstNameError }}</span>
      </label>

      <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-700">Yönetici Soyadı</span>
        <input
          v-model="adminLastName"
          type="text"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <span v-if="adminLastNameError" class="mt-1 block text-xs text-danger">{{ adminLastNameError }}</span>
      </label>

      <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-700">Yönetici E-posta</span>
        <input
          v-model="adminEmail"
          type="email"
          autocomplete="email"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <span v-if="adminEmailError" class="mt-1 block text-xs text-danger">{{ adminEmailError }}</span>
      </label>
    </form>

    <template #footer>
      <template v-if="created">
        <BaseButton @click="emit('close')">Kapat</BaseButton>
      </template>
      <template v-else>
        <BaseButton variant="secondary" :disabled="isSubmitting" @click="emit('close')">Vazgeç</BaseButton>
        <BaseButton type="submit" form="create-tenant-form" :disabled="isSubmitting">
          {{ isSubmitting ? 'Oluşturuluyor...' : 'Kurumu Oluştur' }}
        </BaseButton>
      </template>
    </template>
  </BaseModal>
</template>
