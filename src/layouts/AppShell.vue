<script setup>
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { Roles } from '@/constants/roles'

const auth = useAuthStore()
const router = useRouter()

const studentNavItems = [
  { name: 'course-catalog', label: 'Kurs Kataloğu' },
  { name: 'my-courses', label: 'Kurslarım' },
]

const navItems = computed(() => (auth.hasRole(Roles.Student) ? studentNavItems : []))

async function handleLogout() {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div class="flex items-center gap-8">
          <RouterLink :to="{ name: 'home' }" class="text-lg font-semibold text-indigo-600">
            EduFlow
          </RouterLink>
          <nav class="flex gap-4">
            <RouterLink
              v-for="item in navItems"
              :key="item.name"
              :to="{ name: item.name }"
              class="text-sm font-medium text-slate-600 hover:text-indigo-600"
              active-class="text-indigo-600"
            >
              {{ item.label }}
            </RouterLink>
          </nav>
        </div>

        <div class="flex items-center gap-4">
          <span class="text-sm text-slate-500">{{ auth.user?.email }}</span>
          <button
            type="button"
            class="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            @click="handleLogout"
          >
            Çıkış Yap
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-8">
      <RouterView />
    </main>
  </div>
</template>
