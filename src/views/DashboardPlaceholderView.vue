<script setup>
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div class="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
    <h1 class="text-xl font-semibold text-slate-800">Hoş geldin, {{ auth.user?.email }}</h1>
    <p class="mt-2 text-slate-500">
      {{ auth.roles.join(', ') }} paneli henüz hazır değil — eğitmen/kurum yönetici ekranları
      Faz 7'de geliyor.
    </p>
  </div>
</template>
