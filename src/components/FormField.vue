<script setup>
defineProps({
  label: { type: String, required: true },
  modelValue: { type: [String, Number], default: '' },
  type: { type: String, default: 'text' },
  required: { type: Boolean, default: true },
  autocomplete: { type: String, default: 'off' },
  minlength: { type: [String, Number], default: undefined },
})
defineEmits(['update:modelValue'])
</script>

<template>
  <label class="block">
    <span class="mb-1 block text-sm font-medium text-slate-700">{{ label }}</span>
    <input :type="type" :value="modelValue" :required="required" :autocomplete="autocomplete" :minlength="minlength"
      class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      @input="$emit('update:modelValue', $event.target.value)" />
  </label>
</template>
