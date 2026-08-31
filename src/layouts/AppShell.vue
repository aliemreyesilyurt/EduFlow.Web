<script setup>
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { Roles } from '@/constants/roles'
import InviteUserModal from '@/components/instructor/InviteUserModal.vue'
import TenantSettingsModal from '@/components/instructor/TenantSettingsModal.vue'
import CreateTenantModal from '@/components/admin/CreateTenantModal.vue'

const auth = useAuthStore()
const router = useRouter()

const userInitial = computed(() => auth.user?.email?.[0]?.toUpperCase() ?? '?')

const studentNavItems = [
  { name: 'course-catalog', label: 'Kurs Kataloğu' },
  { name: 'my-courses', label: 'Kurslarım' },
]

const instructorNavItems = [{ name: 'dashboard', label: 'Kurslarım' }]

const isTenantAdmin = computed(() => auth.hasRole(Roles.TenantAdmin, Roles.SysAdmin))
const isSysAdmin = computed(() => auth.hasRole(Roles.SysAdmin))

const navItems = computed(() => {
  if (auth.hasRole(Roles.Student)) {
    return studentNavItems
  }

  return instructorNavItems
})

const inviteModalRole = ref(null) // null | 'Instructor' | 'Student'
const showTenantSettingsModal = ref(false)
const showCreateTenantModal = ref(false)

async function handleLogout() {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <header class="bg-slate-800">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div class="flex items-center gap-8">
          <RouterLink
            :to="{ name: 'home' }"
            class="flex items-center gap-2 font-heading text-lg font-semibold text-white"
          >
            <span class="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-500 text-sm font-bold">
              EF
            </span>
            EduFlow
          </RouterLink>
          <nav class="flex gap-4">
            <RouterLink
              v-for="item in navItems"
              :key="item.name"
              :to="{ name: item.name }"
              class="text-sm font-medium text-slate-300 hover:text-white"
              active-class="text-white"
            >
              {{ item.label }}
            </RouterLink>
          </nav>
        </div>

        <div class="flex items-center gap-3">
          <template v-if="isTenantAdmin">
            <button
              type="button"
              class="hidden rounded-md border border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-700 md:inline-block"
              @click="inviteModalRole = 'Instructor'"
            >
              Eğitmen Davet Et
            </button>
            <button
              type="button"
              class="hidden rounded-md border border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-700 md:inline-block"
              @click="inviteModalRole = 'Student'"
            >
              Öğrenci Davet Et
            </button>
            <button
              type="button"
              class="hidden rounded-md border border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-700 md:inline-block"
              @click="showTenantSettingsModal = true"
            >
              Kayıt Ayarları
            </button>
          </template>

          <button
            v-if="isSysAdmin"
            type="button"
            class="hidden rounded-md border border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-700 md:inline-block"
            @click="showCreateTenantModal = true"
          >
            Kurum Oluştur
          </button>

          <span class="hidden text-sm text-slate-300 sm:inline">{{ auth.user?.email }}</span>
          <span
            class="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-sm font-semibold text-white"
          >
            {{ userInitial }}
          </span>
          <button
            type="button"
            class="rounded-md border border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-700"
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

    <InviteUserModal v-if="inviteModalRole" :role="inviteModalRole" @close="inviteModalRole = null" />
    <TenantSettingsModal v-if="showTenantSettingsModal" @close="showTenantSettingsModal = false" />
    <CreateTenantModal v-if="showCreateTenantModal" @close="showCreateTenantModal = false" />
  </div>
</template>
