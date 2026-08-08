import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Roles } from '@/constants/roles'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/register/tenant',
      name: 'register-tenant',
      component: () => import('@/views/auth/RegisterTenantView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/register/student',
      name: 'register-student',
      component: () => import('@/views/auth/RegisterStudentView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/auth/ForgotPasswordView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('@/views/auth/ResetPasswordView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/confirm-email',
      name: 'confirm-email',
      component: () => import('@/views/auth/ConfirmEmailView.vue'),
    },
    {
      path: '/accept-invitation',
      name: 'accept-invitation',
      component: () => import('@/views/auth/AcceptInvitationView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/AppShell.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'home',
          redirect: () => {
            const auth = useAuthStore()
            return auth.hasRole(Roles.Student) ? { name: 'course-catalog' } : { name: 'dashboard' }
          },
        },
        {
          path: 'courses',
          name: 'course-catalog',
          component: () => import('@/views/student/CourseCatalogView.vue'),
          meta: { roles: [Roles.Student] },
        },
        {
          path: 'courses/:id',
          name: 'course-detail',
          component: () => import('@/views/student/CourseDetailView.vue'),
          meta: { roles: [Roles.Student] },
          props: true,
        },
        {
          path: 'my-courses',
          name: 'my-courses',
          component: () => import('@/views/student/MyCoursesView.vue'),
          meta: { roles: [Roles.Student] },
        },
        {
          path: 'courses/:courseId/steps/:stepId',
          name: 'step-viewer',
          component: () => import('@/views/student/StepViewerView.vue'),
          meta: { roles: [Roles.Student] },
          props: true,
        },
        {
          path: 'courses/:courseId/exam',
          name: 'exam-take',
          component: () => import('@/views/student/ExamTakeView.vue'),
          meta: { roles: [Roles.Student] },
          props: true,
        },
        {
          path: 'courses/:courseId/exam/attempts/:attemptId',
          name: 'exam-result',
          component: () => import('@/views/student/ExamResultView.vue'),
          meta: { roles: [Roles.Student] },
          props: true,
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/instructor/InstructorCoursesView.vue'),
          meta: { roles: [Roles.Instructor, Roles.TenantAdmin, Roles.SysAdmin] },
        },
        {
          path: 'manage/courses/new',
          name: 'course-manage-create',
          component: () => import('@/views/instructor/CourseFormView.vue'),
          meta: { roles: [Roles.Instructor, Roles.TenantAdmin, Roles.SysAdmin] },
        },
        {
          path: 'manage/courses/:id/edit',
          name: 'course-manage-edit',
          component: () => import('@/views/instructor/CourseFormView.vue'),
          meta: { roles: [Roles.Instructor, Roles.TenantAdmin, Roles.SysAdmin] },
          props: true,
        },
        {
          path: 'manage/courses/:id',
          name: 'course-manage-detail',
          component: () => import('@/views/instructor/CourseManageView.vue'),
          meta: { roles: [Roles.Instructor, Roles.TenantAdmin, Roles.SysAdmin] },
          props: true,
        },
        {
          path: 'manage/courses/:id/students',
          name: 'course-manage-students',
          component: () => import('@/views/instructor/CourseStudentsView.vue'),
          meta: { roles: [Roles.Instructor, Roles.TenantAdmin, Roles.SysAdmin] },
          props: true,
        },
        {
          path: 'manage/courses/:id/comments',
          name: 'course-manage-comments',
          component: () => import('@/views/instructor/CourseCommentsView.vue'),
          meta: { roles: [Roles.Instructor, Roles.TenantAdmin, Roles.SysAdmin] },
          props: true,
        },
        {
          path: 'manage/courses/:courseId/steps/new',
          name: 'step-manage-create',
          component: () => import('@/views/instructor/StepFormView.vue'),
          meta: { roles: [Roles.Instructor, Roles.TenantAdmin, Roles.SysAdmin] },
          props: true,
        },
        {
          path: 'manage/courses/:courseId/steps/:stepId/edit',
          name: 'step-manage-edit',
          component: () => import('@/views/instructor/StepFormView.vue'),
          meta: { roles: [Roles.Instructor, Roles.TenantAdmin, Roles.SysAdmin] },
          props: true,
        },
        {
          path: 'manage/courses/:id/exam',
          name: 'exam-manage',
          component: () => import('@/views/instructor/ExamManageView.vue'),
          meta: { roles: [Roles.Instructor, Roles.TenantAdmin, Roles.SysAdmin] },
          props: true,
        },
        {
          path: 'manage/courses/:courseId/exam/settings',
          name: 'exam-settings',
          component: () => import('@/views/instructor/ExamFormView.vue'),
          meta: { roles: [Roles.Instructor, Roles.TenantAdmin, Roles.SysAdmin] },
          props: true,
        },
        {
          path: 'manage/courses/:courseId/exam/questions/new',
          name: 'question-manage-create',
          component: () => import('@/views/instructor/QuestionFormView.vue'),
          meta: { roles: [Roles.Instructor, Roles.TenantAdmin, Roles.SysAdmin] },
          props: true,
        },
        {
          path: 'manage/courses/:courseId/exam/questions/:questionId/edit',
          name: 'question-manage-edit',
          component: () => import('@/views/instructor/QuestionFormView.vue'),
          meta: { roles: [Roles.Instructor, Roles.TenantAdmin, Roles.SysAdmin] },
          props: true,
        },
        {
          path: 'manage/instructors/invite',
          name: 'instructor-invite',
          component: () => import('@/views/instructor/InviteInstructorView.vue'),
          meta: { roles: [Roles.TenantAdmin, Roles.SysAdmin] },
        },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'home' }
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.roles && !auth.hasRole(...to.meta.roles)) {
    return { name: 'home' }
  }

  return true
})

export default router
