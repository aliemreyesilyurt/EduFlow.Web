<script setup>
import { ref, computed, onMounted } from 'vue'
import { useForm, useField } from 'vee-validate'
import * as yup from 'yup'
import BaseModal from '@/components/BaseModal.vue'
import BaseButton from '@/components/BaseButton.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import SkeletonBlock from '@/components/SkeletonBlock.vue'
import * as pointsApi from '@/api/points'
import { extractErrorMessage } from '@/api/errors'
import { successToast } from '@/utils/notify'

const props = defineProps({
  ruleId: { type: String, default: null },
})

const emit = defineEmits(['close', 'saved'])

const isLoading = ref(true)
const apiError = ref('')

const isEditing = computed(() => !!props.ruleId)

const schema = yup.object({
  title: yup.string().trim().required('Başlık zorunlu').min(3, 'Başlık en az 3 karakter olmalı'),
  description: yup.string().trim().nullable(),
  pointsCost: yup.number().typeError('Sayı olmalı').required().min(1, 'En az 1 puan olmalı'),
  isActive: yup.boolean(),
})

const { handleSubmit, setValues, isSubmitting } = useForm({
  validationSchema: schema,
  initialValues: { title: '', description: '', pointsCost: 100, isActive: true },
})

const { value: title, errorMessage: titleError } = useField('title')
const { value: description } = useField('description')
const { value: pointsCost, errorMessage: pointsCostError } = useField('pointsCost')
const { value: isActive } = useField('isActive')

onMounted(async () => {
  if (!props.ruleId) {
    isLoading.value = false
    return
  }

  try {
    const rules = await pointsApi.getTenantPointsRules()
    const rule = rules.find((r) => r.id === props.ruleId)

    if (!rule) {
      apiError.value = 'Kural bulunamadı.'
      return
    }

    setValues({
      title: rule.title,
      description: rule.description ?? '',
      pointsCost: rule.pointsCost,
      isActive: rule.isActive,
    })
  } catch (err) {
    apiError.value = extractErrorMessage(err, 'Kural yüklenemedi.')
  } finally {
    isLoading.value = false
  }
})

const onSubmit = handleSubmit(async (values) => {
  apiError.value = ''

  const payload = {
    title: values.title,
    description: values.description?.trim() ? values.description.trim() : null,
    pointsCost: Number(values.pointsCost),
    isActive: !!values.isActive,
  }

  try {
    if (isEditing.value) {
      await pointsApi.updatePointsRule(props.ruleId, payload)
      successToast('Kural güncellendi.')
    } else {
      await pointsApi.createPointsRule(payload)
      successToast('Kural oluşturuldu.')
    }

    emit('saved')
    emit('close')
  } catch (err) {
    apiError.value = extractErrorMessage(err, 'Kural kaydedilemedi.')
  }
})
</script>

<template>
  <BaseModal :title="isEditing ? 'Kuralı Düzenle' : 'Yeni Puan Kuralı'" @close="emit('close')">
    <div v-if="isLoading" class="space-y-4">
      <SkeletonBlock class="h-9 w-full" />
      <SkeletonBlock class="h-9 w-full" />
    </div>

    <form v-else id="points-rule-form" class="space-y-4" @submit="onSubmit">
      <AlertMessage v-if="apiError" variant="error">{{ apiError }}</AlertMessage>

      <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-700">Başlık</span>
        <input
          v-model="title"
          type="text"
          placeholder="ör. Sertifika kilidini aç"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <span v-if="titleError" class="mt-1 block text-xs text-danger">{{ titleError }}</span>
      </label>

      <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-700">Açıklama (opsiyonel)</span>
        <textarea
          v-model="description"
          rows="2"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </label>

      <label class="block">
        <span class="mb-1 block text-sm font-medium text-slate-700">Gereken Puan</span>
        <input
          v-model="pointsCost"
          type="number"
          min="1"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <span v-if="pointsCostError" class="mt-1 block text-xs text-danger">{{ pointsCostError }}</span>
      </label>

      <label class="flex items-center gap-2 text-sm text-slate-700">
        <input v-model="isActive" type="checkbox" class="h-4 w-4" />
        Aktif (öğrencilere gösterilir)
      </label>
    </form>

    <template #footer>
      <BaseButton variant="secondary" :disabled="isSubmitting" @click="emit('close')">Vazgeç</BaseButton>
      <BaseButton type="submit" form="points-rule-form" :disabled="isSubmitting || isLoading">
        {{ isSubmitting ? 'Kaydediliyor...' : 'Kaydet' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
