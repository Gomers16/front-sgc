// src/stores/auth.ts
import router from '@/router'
import AuthService from '@/services/AuthService'
import { defineStore } from 'pinia'

/** Usuario según tu backend (+ agenteId opcional) */
export interface User {
  id: number
  agenteId?: number | null // ← AgenteCaptacion.id (opcional, para asignar prospectos)
  razonSocialId: number
  rolId: number
  epsId: number
  arlId: number
  afpId: number
  afcId: number
  ccfId: number
  nombres: string
  apellidos: string
  correo: string
  fotoPerfil: string
  sede: string
  direccion: string
  celularPersonal: string
  celularCorporativo: string
  area: string
  centroCosto: string
  estado: string
  recomendaciones: number
  createdAt: string
  updatedAt: string
  rol: {
    id: number
    nombre: string
    createdAt: string
    updatedAt: string
  }
}

/** Para logs de errores de red sin romper tipos */
interface NetworkError extends Error {
  response?: { data?: { message?: string } }
}

/** URL builder para evitar /api duplicado y terminar con una sola /api */
const RAW_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
function buildApi(path: string) {
  const p = path.startsWith('/') ? path : `/${path}`
  const baseHasApi = /\/api\/?$/.test(RAW_BASE)
  const pathHasApi = /^\/api(\/|$)/.test(p)
  let finalPath = p
  if (baseHasApi && pathHasApi) finalPath = p.replace(/^\/api/, '')
  if (!baseHasApi && !pathHasApi) finalPath = `/api${p}`
  return `${RAW_BASE}${finalPath}`
}

export const useAuthStore = defineStore('auth', {
  state: () => {
    let user: User | null = null
    try {
      const storedUser = sessionStorage.getItem('user')
      if (storedUser) user = JSON.parse(storedUser)
    } catch (error: unknown) {
      console.error('Error al parsear el usuario desde sessionStorage:', error)
    }

    return {
      user,
      token: sessionStorage.getItem('token') || null,
    }
  },

  getters: {
    isAuthenticated: (s) => !!s.token && !!s.user,
    currentUserId:   (s) => s.user?.id || null,
    currentAgenteId: (s) => s.user?.agenteId ?? null,
  },

  actions: {
    /** Inicia sesión y guarda token + user; hidrata agenteId si hace falta */
    async login(userData: { email: string; password: string }): Promise<boolean> {
      const auth = new AuthService()
      let loginResponse: any

      try {
        loginResponse = await auth.login(userData.email, userData.password)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error desconocido en autenticación'
        console.error('AuthStore.login: error en AuthService.login:', message)
        return false
      }

      if (loginResponse?.errors?.[0]) {
        console.error('AuthStore.login: backend error:', loginResponse.errors[0].message)
        return false
      }

      // tu backend: { token: { token: '...' }, user: {...} }
      const tokenValue: string | undefined = loginResponse?.token?.token
      const userFromBackend: User | undefined = loginResponse?.user

      if (!tokenValue || !userFromBackend) {
        console.error('AuthStore.login: respuesta inválida (token o user faltante):', loginResponse)
        return false
      }

      this.token = tokenValue
      this.user  = userFromBackend

      sessionStorage.setItem('token', tokenValue)
      sessionStorage.setItem('user', JSON.stringify(userFromBackend))

      // Intentar obtener agenteId si no vino en login/me
      await this.hydrateAgenteIdSafe()

      router.push('/dashboard')
      return true
    },

    /** Cierra sesión limpiando estado y sessionStorage */
    async logout() {
      this.user = null
      this.token = null
      sessionStorage.removeItem('user')
      sessionStorage.removeItem('token')
      console.log('AuthStore: Sesión cerrada.')
      router.push('/login')
    },

    /** Rehidrata sesión si hay token: pide /api/me; luego hidrata agenteId */
    async checkAuth() {
      if (this.token && !this.user) {
        try {
          const authService = new AuthService()
          const response = await authService.me() // se espera { user: {...} }

          if (response?.user) {
            this.user = response.user as User
            sessionStorage.setItem('user', JSON.stringify(response.user))
            console.log('checkAuth: Usuario cargado desde API:', this.user)

            await this.hydrateAgenteIdSafe()

            if (
              router.currentRoute.value.path === '/login' ||
              router.currentRoute.value.path === '/register'
            ) {
              router.push('/dashboard')
            }
          } else {
            console.error('checkAuth: /me sin usuario o token inválido.')
            this.logout()
          }
        } catch (error: unknown) {
          if (error instanceof Error) {
            const net = error as NetworkError
            console.error(
              'checkAuth: Error al verificar autenticación:',
              net.response?.data?.message || net.message
            )
          } else {
            console.error('checkAuth: Error desconocido:', error)
          }
          this.logout()
        }
      } else if (this.token && this.user) {
        console.log('checkAuth: Usuario ya cargado y token presente.')
        if (
          router.currentRoute.value.path === '/login' ||
          router.currentRoute.value.path === '/register'
        ) {
          router.push('/dashboard')
        }
      } else {
        console.log('checkAuth: No hay token en sessionStorage.')
      }
    },

    /**
     * Intenta hidratar this.user.agenteId si no vino en /login o /me.
     * GET /agentes-captacion/me (ver nota de ruta abajo)
     */
    async hydrateAgenteIdSafe() {
      try {
        if (!this.user) return
        if (typeof this.user.agenteId === 'number') return // ya está
        if (!this.token) return

        const res = await fetch(buildApi('/agentes-captacion/me'), {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!res.ok) return
        const data = await res.json()
        if (data?.id) {
          this.user = { ...(this.user as User), agenteId: Number(data.id) }
          sessionStorage.setItem('user', JSON.stringify(this.user))
        }
      } catch {
        // silencioso
      }
    },
  },
})

/**
 * ⚠️ Compatibilidad hacia atrás:
 * Muchos archivos pueden seguir importando { authSetStore }.
 * Este alias evita romperlos mientras migras gradualmente a useAuthStore.
 */
export { useAuthStore as authSetStore }
