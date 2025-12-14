// src/stores/AuthStore.ts

import router from '@/router'
import AuthService from '@/services/AuthService'
import { defineStore } from 'pinia'

/** Usuario COMPLETO del sistema (viene de /me) */
export interface User {
  id: number
  agenteId?: number | null
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

/** Usuario REDUCIDO que devuelve el LOGIN */
interface UserAuth {
  id: number
  agenteId?: number | null
  nombres: string
  apellidos: string
  correo: string
  rol: {
    id: number
    nombre: string
  }
  profilePictureUrl?: string
}

/** Respuesta del login */
interface LoginResponse {
  token?: string
  user?: UserAuth
  errors?: {
    message: string
  }[]
}

/** Para logs de errores de red sin romper tipos */
interface NetworkError extends Error {
  response?: { data?: { message?: string } }
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
    currentUserId: (s) => s.user?.id || null,
    currentAgenteId: (s) => s.user?.agenteId ?? null,

    userRole: (s) => s.user?.rol?.nombre || null,

    hasRole: (s) => (role: string) =>
      s.user?.rol?.nombre === role,

    hasAnyRole: (s) => (roles: string[]) =>
      s.user?.rol?.nombre ? roles.includes(s.user.rol.nombre) : false,

    isSuperAdmin: (s) => s.user?.rol?.nombre === 'SUPER_ADMIN',
    isGerencia: (s) => s.user?.rol?.nombre === 'GERENCIA',
    isComercial: (s) => s.user?.rol?.nombre === 'COMERCIAL',
    isContabilidad: (s) => s.user?.rol?.nombre === 'CONTABILIDAD',
    isTalentoHumano: (s) => s.user?.rol?.nombre === 'TALENTO_HUMANO',
    isOperativoTurnos: (s) => s.user?.rol?.nombre === 'OPERATIVO_TURNOS',
  },

  actions: {
    /** LOGIN: solo autentica, NO hidrata usuario completo */
    async login(userData: { email: string; password: string }): Promise<boolean> {
      const auth = new AuthService()
      let loginResponse: LoginResponse

      try {
        loginResponse = await auth.login(userData.email, userData.password)
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Error desconocido en autenticación'
        console.error('AuthStore.login:', message)
        return false
      }

      if (loginResponse?.errors?.[0]) {
        console.error('AuthStore.login:', loginResponse.errors[0].message)
        return false
      }

      if (!loginResponse.token) {
        console.error('AuthStore.login: token faltante')
        return false
      }

      this.token = loginResponse.token
      sessionStorage.setItem('token', loginResponse.token)

      // 🚀 Dejar que /me cargue el usuario completo
      await this.checkAuth()

      return true
    },

    /** LOGOUT */
    async logout() {
      this.user = null
      this.token = null
      sessionStorage.removeItem('user')
      sessionStorage.removeItem('token')
      router.push('/login')
    },

    /** Carga REAL del usuario desde /me */
    async checkAuth() {
      if (!this.token) return

      try {
        const authService = new AuthService()
        const response = await authService.me()

        if (!response?.user) {
          this.logout()
          return
        }

        this.user = response.user as User
        sessionStorage.setItem('user', JSON.stringify(this.user))

        const currentPath = router.currentRoute.value.path
        const rol = this.user.rol.nombre

        if (currentPath === '/login' || currentPath === '/register') {
          switch (rol) {
            case 'COMERCIAL': {
              const asesorId = this.user.agenteId || this.user.id
              router.push({
                name: 'FichaComercialAsesor',
                params: { id: asesorId },
              })
              break
            }

            case 'TALENTO_HUMANO':
              router.push({ name: 'Contratos' })
              break

            case 'CONTABILIDAD':
              router.push({ name: 'FacturacionHistorico' })
              break

            default:
              router.push('/dashboard')
          }
        }
      } catch (error: unknown) {
        const net = error as NetworkError
        console.error(
          'checkAuth:',
          net.response?.data?.message || net.message
        )
        this.logout()
      }
    },
  },
})

/** Compatibilidad hacia atrás */
export { useAuthStore as authSetStore }
