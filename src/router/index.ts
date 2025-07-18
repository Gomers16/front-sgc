import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/dashboard/DashboardView.vue'
import RTMView from '@/views/RtmView.vue'
import CrearTurnoView from '@/views/rtm/CrearTurno.vue'
import TurnosDelDia from '@/views/rtm/TurnosDelDia.vue'
import TurnoRtmEdit from '@/views/rtm/EditarTurno.vue' // ✅ Importa tu vista de edición (EditarTurno.vue)
import EstadoDeTurnos from '@/views/rtm/EstadoDeTurnos.vue' // ✅ ¡Importa la nueva vista de Estado de Turnos!
import { authSetStore } from '@/stores/AuthStore' // ✅ Importación de authSetStore

const routes = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { layout: 'AuthLayout', requiresAuth: false },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: { layout: 'MainLayout', requiresAuth: true },
  },
  {
    path: '/rtm',
    name: 'RTM',
    component: RTMView,
    meta: { layout: 'MainLayout', requiresAuth: true },
  },
  {
    path: '/rtm/crear-turno',
    name: 'CrearTurno',
    component: CrearTurnoView,
    meta: { layout: 'MainLayout', requiresAuth: true },
  },
  {
    path: '/rtm/turnos-dia', // ✅ Ruta para Turnos del Día
    name: 'TurnosDelDia',
    component: TurnosDelDia,
    meta: { layout: 'MainLayout', requiresAuth: true },
  },
  {
    path: '/rtm/editar-turno/:id', // ✅ Ruta para la edición de un turno
    name: 'TurnoRtmEdit',
    component: TurnoRtmEdit,
    props: true, // Esto pasa el 'id' de la URL como prop al componente TurnoRtmEdit
    meta: { layout: 'MainLayout', requiresAuth: true },
  },
  {
    path: '/rtm/estado-turnos', // ✅ ¡NUEVA RUTA para el Histórico y Estado de Turnos!
    name: 'EstadoDeTurnos',
    component: EstadoDeTurnos,
    meta: { layout: 'MainLayout', requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// ✅ Navegación protegida
router.beforeEach((to, from, next) => {
  const authStore = authSetStore()

  if (to.meta.requiresAuth && !authStore.token) {
    return next('/login')
  }

  if (to.path === '/login' && authStore.token) {
    return next('/dashboard')
  }

  return next()
})

export default router
