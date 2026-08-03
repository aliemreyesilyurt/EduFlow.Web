<script setup>
const props = defineProps({
  modelValue: { type: Number, default: 0 },
  readonly: { type: Boolean, default: false },
  size: { type: String, default: 'text-lg' },
})
const emit = defineEmits(['update:modelValue'])

function setValue(value) {
  if (!props.readonly) {
    emit('update:modelValue', value)
  }
}
</script>

<template>
  <span class="inline-flex" :class="size">
    <component
      :is="readonly ? 'span' : 'button'"
      v-for="star in 5"
      :key="star"
      type="button"
      class="leading-none"
      :class="[
        star <= Math.round(modelValue) ? 'text-amber-400' : 'text-slate-300',
        !readonly && 'cursor-pointer hover:text-amber-400',
      ]"
      @click="setValue(star)"
    >
      ★
    </component>
  </span>
</template>
