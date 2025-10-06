// src/router/index.ts
import {
  createRouter,
  createWebHistory,
  type RouteLocationRaw,
  type RouteLocationNormalizedLoaded,
  type RouteParamsRaw,
  type RouteParamValueRaw,
} from 'vue-router'

/** Vistas base ya existentes */
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/dashboard/DashboardView.vue'
import RTMView from '@/views/RtmView.vue'
import CrearTurnoView from '@/views/rtm/CrearTurno.vue'
import TurnosDelDia from '@/views/rtm/TurnosDelDia.vue'
import TurnoRtmEdit from '@/views/rtm/EditarTurno.vue'
import EstadoDeTurnos from '@/views/rtm/EstadoDeTurnos.vue'
import ContadorConvenios from '@/views/rtm/ContadorConvenios.vue'
import Vistadesarrollo from '@/views/Vistadesarrollo.vue'
import UsuariosView from '@/views/usuarios/UsuariosView.vue'
import ContratosView from '@/views/gestion-documental/ContratosView.vue'
import UserProfileView from '@/views/usuarios/UserProfileView.vue'

/** 👇 Importes RELATIVOS para que TS detecte los .vue recién creados */
import DateosList from '../views/comercial/dateos/DateosList.vue'
import DateoCreate from '../views/comercial/dateos/DateoCreate.vue'
import DateoDetail from '../views/comercial/dateos/DateoDetail.vue'
import ComisionesList from '../views/comercial/comisiones/ComisionesList.vue'
import ComisionDetail from '../views/comercial/comisiones/ComisionesDetail.vue'

/** Pinia (única importación, evita duplicado) */
import { authSetStore } from '@/stores/AuthStore'

const routes = [
  { path: '/', redirect: '/login' },

  // ===== Auth =====
  { path: '/login', name: 'Login', component: LoginView, meta: { layout: 'AuthLayout' } },

  // ===== Dashboard =====
  { path: '/dashboard', name: 'Dashboard', component: DashboardView, meta: { layout: 'MainLayout' } },

  // ===== RTM =====
  { path: '/rtm', name: 'RTM', component: RTMView, meta: { layout: 'MainLayout' } },
  { path: '/rtm/crear-turno', name: 'CrearTurno', component: CrearTurnoView, meta: { layout: 'MainLayout' } },
  { path: '/rtm/turnos-dia', name: 'TurnosDelDia', component: TurnosDelDia, meta: { layout: 'MainLayout' } },
  {
    path: '/rtm/editar-turno/:id',
    name: 'TurnoRtmEdit',
    component: TurnoRtmEdit,
    props: true,
    meta: { layout: 'MainLayout' },
  },
  { path: '/rtm/estado-turnos', name: 'EstadoDeTurnos', component: EstadoDeTurnos, meta: { layout: 'MainLayout' } },
  { path: '/rtm/contador-captacion', name: 'ContadorCaptacion', component: ContadorConvenios, meta: { layout: 'MainLayout' } },
  { path: '/rtm/proximamente', name: 'Proximamente', component: Vistadesarrollo, meta: { layout: 'MainLayout' } },

  // ===== Gestión Documental / Usuarios =====
  { path: '/gestion-documental/usuarios', name: 'Usuarios', component: UsuariosView, meta: { layout: 'MainLayout' } },
  {
    path: '/usuarios/:id',
    name: 'UserProfile',
    component: UserProfileView,
    props: true,
    meta: { layout: 'MainLayout' },
  },
  {
    path: '/gestion-documental/razon-social/:id',
    name: 'RazonSocialDetalle',
    component: () => import('@/views/gestion-documental/RazonSocialView.vue'),
    props: true,
    meta: { layout: 'MainLayout' },
  },
  { path: '/gestion-documental/contratos', name: 'Contratos', component: ContratosView, meta: { layout: 'MainLayout' } },

  // ==================  COMERCIAL  ====================
  {
    path: '/comercial/buscar',
    name: 'ComercialBuscar',
    component: () => import('@/views/comercial/BuscarView.vue'),
    meta: { layout: 'MainLayout' },
  },

  // Asesores + convenios
  {
    path: '/comercial/asesores',
    name: 'ComercialAsesores',
    component: () => import('@/views/comercial/asesores/AsesoresConveniosView.vue'),
    meta: { layout: 'MainLayout' },
  },

  // Dateos
  { path: '/comercial/dateos', name: 'ComercialDateos', component: DateosList, meta: { layout: 'MainLayout' } },
  {
    path: '/comercial/dateos/nuevo',
    name: 'ComercialDateosNuevo',
    component: DateoCreate,
    meta: { layout: 'MainLayout' },
  },
  {
    path: '/comercial/dateos/:id',
    name: 'ComercialDateoDetalle',
    component: DateoDetail,
    props: true,
    meta: { layout: 'MainLayout' },
  },

  // Convenios
  {
    path: '/comercial/convenios',
    name: 'ComercialConvenios',
    component: () => import('@/views/comercial/convenios/ConveniosList.vue'),
    meta: { layout: 'MainLayout' },
  },
  {
    path: '/comercial/convenios/:id',
    name: 'ComercialConvenioDetalle',
    component: () => import('@/views/comercial/convenios/ConvenioDetail.vue'),
    props: true,
    meta: { layout: 'MainLayout' },
  },

  // Prospectos
  {
    path: '/comercial/prospectos',
    name: 'ComercialProspectos',
    component: () => import('@/views/comercial/prospectos/ProspectosList.vue'),
    meta: { layout: 'MainLayout' },
  },
  {
    path: '/comercial/prospectos/nuevo',
    name: 'ComercialProspectoNuevo',
    component: () => import('@/views/comercial/prospectos/ProspectoCreate.vue'),
    meta: { layout: 'MainLayout' },
  },
  {
    path: '/comercial/prospectos/:id',
    name: 'ComercialProspectoDetalle',
    component: () => import('@/views/comercial/prospectos/ProspectoDetail.vue'),
    props: true,
    meta: { layout: 'MainLayout' },
  },

  // Comisiones
  { path: '/comercial/comisiones', name: 'ComercialComisiones', component: ComisionesList, meta: { layout: 'MainLayout' } },
  {
    path: '/comercial/comisiones/:id',
    name: 'ComercialComisionDetalle',
    component: ComisionDetail,
    props: true,
    meta: { layout: 'MainLayout' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

/* ===========================
 * PARCHE GLOBAL: limpia params no declarados también en router.resolve
 * =========================== */

type NamedLocation = { name: string | symbol }
type ParamLocation = { params?: RouteParamsRaw }

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
function hasName(value: unknown): value is NamedLocation {
  return isObject(value) && 'name' in value
}
function hasParams(value: unknown): value is ParamLocation {
  return isObject(value) && 'params' in value
}

// fuerza que los params sean del tipo permitido por Vue Router
function toRouteParam(v: unknown): RouteParamValueRaw | (string | number)[] {
  if (Array.isArray(v)) {
    return v.map((x) => (typeof x === 'string' || typeof x === 'number' ? x : String(x)))
  }
  if (typeof v === 'string' || typeof v === 'number') return v
  // evita null/undefined/objetos: los stringificamos
  return String(v ?? '')
}

function cleanParamsForRoute(to: RouteLocationRaw): RouteLocationRaw {
  if (typeof to === 'string') return to
  if (!isObject(to) || !hasName(to)) return to

  const record = router.getRoutes().find((r) => r.name === to.name)
  if (!record) return to

  const declared = new Set((record.path.match(/:(\w+)/g) || []).map((s) => s.slice(1)))
  const rawParams: RouteParamsRaw = hasParams(to) && to.params ? to.params : {}
  const keys = Object.keys(rawParams)
  if (keys.length === 0) return to

  const cleanParams: RouteParamsRaw = {}
  let changed = false

  for (const k of keys) {
    if (declared.has(k)) {
      cleanParams[k] = toRouteParam(rawParams[k])
    } else {
      changed = true
    }
  }

  if (!changed) return to
  return { ...to, params: cleanParams }
}

// monkey-patch type-safe
const originalResolve = router.resolve.bind(router)
const patchedResolve: typeof router.resolve = (
  rawTo: RouteLocationRaw,
  currentLocation?: RouteLocationNormalizedLoaded
) => {
  const cleaned = cleanParamsForRoute(rawTo)
  return originalResolve(cleaned, currentLocation)
}
;(router as { resolve: typeof router.resolve }).resolve = patchedResolve

/* ========= Guard (suave) ========= */
router.beforeEach((to, _from, next) => {
  const authStore = authSetStore()

  // 🔒 Bloquear cualquier intento heredado/antiguo a /reset-password (con o sin token)
  if (to.path.startsWith('/reset-password')) {
    return next('/comercial/buscar')
  }

  if (to.path === '/login' && authStore.token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
