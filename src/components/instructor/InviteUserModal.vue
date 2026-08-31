<script setup>
import { ref, computed } from 'vue'
import { useForm, useField } from 'vee-validate'
import * as yup from 'yup'
import BaseModal from '@/components/BaseModal.vue'
import BaseButton from '@/components/BaseButton.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import * as authApi from '@/api/auth'
import { extractErrorMessage } from '@/api/errors'
import { successToast } from '@/utils/notify'

const props = defineProps({
  role: { type: String, required: true }, // 'Instructor' | 'Student'
})

const emit = defineEmits(['close'])

const isInstructor = computed(() => props.role === 'Instructor')
const title = computed(() => (isInstructor.value ? 'Eğitmen Davet Et' : 'Öğrenci Davet Et'))
const description = computed(() =>
  isInstructor.value
    ? 'Davet edilen kişiye e-posta ile bir davet bağlantısı gönderilir; bağlantıya tıklayıp kendi şifresini belirledikten sonra eğitmen olarak kuruma katılır.'
    : 'Davet edilen kişiye e-posta ile bir davet bağlantısı gönderilir; bağlantıya tıklayıp kendi şifresini belirledikten sonra öğrenci olarak kuruma katılır.',
)

const schema = yup.object({
  firstName: yup.string().trim().required('Ad zorunlu'),
  lastName: yup.string().trim().required('Soyad zorunlu'),
  email: yup.string().trim().required('E-posta zorunlu').email('Geçerli bir e-posta gir'),
})

const { handleSubmit, resetForm, isSubmitting } = useForm({
  validationSchema: schema,
  initialValues: { firstName: '', lastName: '', email: '' },
})

const { value: firstName, errorMessage: firstNameError } = useField('firstName')
const { value: lastName, errorMessage: lastNameError } = useField('lastName')
const { value: email, errorMessage: emailError } = useField('email')

const apiErrorMsg = ref('')

const onSubmit = handleSubmit(async (values) => {
  apiErrorMsg.value = ''

  try {
    const invite = isInstructor.value ? authApi.inviteInstructor : authApi.inviteStudent
    await invite(values.email, values.firstName, values.lastName)
    successToast(`${values.email} adresine davet gönderildi.`)
    resetForm()
    emit('close')
  } catch (err) {
    apiErrorMsg.value = extractErrorMessage(err, 'Davet gönderilemedi.')
  }
})
</script>

<template>
  <BaseModal :title="title" @close="emit('close')">
    <form id="invite-user-form" class="space-y-4" @submit="onSubmit">
      <AlertMessage v-if="apiErrorMsg" variant="error">{{ apiErrorMsg }}</AlertMessage>

      <p class="text-sm text-slate-500">{{ description }}</p>

      <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-700">Ad</span>
        <input
          v-model="firstName"
          type="text"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <span v-if="firstNameError" class="mt-1 block text-xs text-danger">{{ firstNameError }}</span>
      </label>

      <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-700">Soyad</span>
        <input
          v-model="lastName"
          type="text"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <span v-if="lastNameError" class="mt-1 block text-xs text-danger">{{ lastNameError }}</span>
      </label>

      <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-700">E-posta</span>
        <input
          v-model="email"
          type="email"
          autocomplete="email"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <span v-if="emailError" class="mt-1 block text-xs text-danger">{{ emailError }}</span>
      </label>
    </form>

    <template #footer>
      <BaseButton variant="secondary" :disabled="isSubmitting" @click="emit('close')">Vazgeç</BaseButton>
      <BaseButton type="submit" form="invite-user-form" :disabled="isSubmitting">
        {{ isSubmitting ? 'Gönderiliyor...' : 'Davet Gönder' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
