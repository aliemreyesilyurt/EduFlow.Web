<script setup>
defineProps({
  variant: { type: String, default: 'primary' }, // primary | secondary | danger | ghost
  type: { type: String, default: 'button' },
  block: { type: Boolean, default: false },
})

const variantClasses = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
  secondary: 'border border-slate-300 text-slate-700 hover:bg-slate-100',
  danger: 'border border-danger/30 text-danger hover:bg-danger/10',
  ghost: 'border border-slate-300 text-indigo-600 hover:bg-slate-50',
}
</script>

<template>
  <button
    :type="type"
    class="rounded-md px-4 py-2 text-sm font-medium transition disabled:opacity-50"
    :class="[variantClasses[variant], block && 'w-full']"
  >
    <slot />
  </button>
</template>
