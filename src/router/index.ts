import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/dashboard/DashboardView.vue'
import RTMView from '@/views/RtmView.vue'
import CrearTurnoView from '@/views/rtm/CrearTurno.vue'
import TurnosDelDia from '@/views/rtm/TurnosDelDia.vue'
import TurnoRtmEdit from '@/views/rtm/EditarTurno.vue'
import EstadoDeTurnos from '@/views/rtm/EstadoDeTurnos.vue'
import ContadorConvenios from '@/views/rtm/ContadorConvenios.vue'
import Vistadesarrollo from '@/views/Vistadesarrollo.vue' // ✅ NUEVA IMPORTACIÓN DE LA VISTA DE DESARROLLO
import { authSetStore } from '@/stores/AuthStore'

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
    path: '/rtm/turnos-dia',
    name: 'TurnosDelDia',
    component: TurnosDelDia,
    meta: { layout: 'MainLayout', requiresAuth: true },
  },
  {
    path: '/rtm/editar-turno/:id',
    name: 'TurnoRtmEdit',
    component: TurnoRtmEdit,
    props: true,
    meta: { layout: 'MainLayout', requiresAuth: true },
  },
  {
    path: '/rtm/estado-turnos',
    name: 'EstadoDeTurnos',
    component: EstadoDeTurnos,
    meta: { layout: 'MainLayout', requiresAuth: true },
  },
  {
    path: '/rtm/contador-captacion',
    name: 'ContadorCaptacion',
    component: ContadorConvenios,
    meta: { layout: 'MainLayout', requiresAuth: true },
  },
  {
    path: '/rtm/proximamente', // ✅ RUTA DEDICADA PARA LA VISTA DE DESARROLLO
    name: 'Proximamente',
    component: Vistadesarrollo, // El componente a renderizar para esta ruta
    meta: { layout: 'MainLayout', requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navegación protegida
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
