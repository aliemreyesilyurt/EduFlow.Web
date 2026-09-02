<script setup>
import { ref } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import BaseButton from '@/components/BaseButton.vue'

defineProps({
  consentText: { type: String, required: true },
  requireCamera: { type: Boolean, default: false },
})

const emit = defineEmits(['accept', 'cancel'])

const accepted = ref(false)
</script>

<template>
  <BaseModal title="Sınav Bütünlüğü — Açık Rıza" @close="emit('cancel')">
    <div class="space-y-4">
      <p class="whitespace-pre-line text-sm text-slate-700">{{ consentText }}</p>

      <p v-if="requireCamera" class="text-xs text-slate-500">
        Bu sınav kamera erişimi gerektirir. Devam ederseniz tarayıcınız kamera izni isteyecek.
      </p>

      <label class="flex items-start gap-2 text-sm text-slate-700">
        <input v-model="accepted" type="checkbox" class="mt-0.5 h-4 w-4" />
        Bu bilgilendirmeyi okudum, veri toplama sürecine açık rıza veriyorum.
      </label>
    </div>

    <template #footer>
      <BaseButton variant="secondary" @click="emit('cancel')">Vazgeç</BaseButton>
      <BaseButton :disabled="!accepted" @click="emit('accept')">Kabul Et ve Devam Et</BaseButton>
    </template>
  </BaseModal>
</template>
