// src/stores/AuthStore.ts

import router from '@/router'
import AuthService from '@/services/AuthService'
import { defineStore } from 'pinia'

/** Usuario según tu backend (+ agenteId opcional) */
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

    // Getters de roles
    userRole: (s) => s.user?.rol?.nombre || null,

    hasRole: (s) => (role: string) => {
      return s.user?.rol?.nombre === role
    },

    hasAnyRole: (s) => (roles: string[]) => {
      const userRole = s.user?.rol?.nombre
      return userRole ? roles.includes(userRole) : false
    },

    // Helpers específicos por rol
    isSuperAdmin: (s) => s.user?.rol?.nombre === 'SUPER_ADMIN',
    isGerencia: (s) => s.user?.rol?.nombre === 'GERENCIA',
    isComercial: (s) => s.user?.rol?.nombre === 'COMERCIAL',
    isContabilidad: (s) => s.user?.rol?.nombre === 'CONTABILIDAD',
    isTalentoHumano: (s) => s.user?.rol?.nombre === 'TALENTO_HUMANO',
    isOperativoTurnos: (s) => s.user?.rol?.nombre === 'OPERATIVO_TURNOS',
  },

  actions: {
    /** Inicia sesión y guarda token + user */
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

      const tokenValue: string | undefined = loginResponse?.token
      const userFromBackend: User | undefined = loginResponse?.user

      if (!tokenValue || !userFromBackend) {
        console.error('AuthStore.login: respuesta inválida (token o user faltante):', loginResponse)
        return false
      }

      this.token = tokenValue
      this.user = userFromBackend

      sessionStorage.setItem('token', tokenValue)
      sessionStorage.setItem('user', JSON.stringify(userFromBackend))

      console.log('✅ Login exitoso. Rol:', userFromBackend.rol.nombre)

      // 🔥 REDIRECCIÓN POR ROL
      const rol = userFromBackend.rol.nombre

      switch (rol) {
        case 'COMERCIAL':
          router.push({
            name: 'FichaComercialAsesor',
            params: { id: userFromBackend.id }
          })
          break

        case 'TALENTO_HUMANO':
          router.push({ name: 'Contratos' })
          break

        case 'CONTABILIDAD':
          router.push({ name: 'FacturacionHistorico' })
          break

        default:
          // SUPER_ADMIN, GERENCIA, OPERATIVO_TURNOS van al dashboard
          router.push('/dashboard')
      }

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

    /** Rehidrata sesión si hay token: pide /api/auth/me */
    async checkAuth() {
      if (this.token && !this.user) {
        try {
          const authService = new AuthService()
          const response = await authService.me()

          if (response?.user) {
            this.user = response.user as User
            sessionStorage.setItem('user', JSON.stringify(response.user))
            console.log('✅ checkAuth: Usuario cargado desde API.')

            const currentPath = router.currentRoute.value.path
            const rol = this.user.rol.nombre

            if (currentPath === '/login' || currentPath === '/register') {
              switch (rol) {
                case 'COMERCIAL':
                  router.push({
                    name: 'FichaComercialAsesor',
                    params: { id: this.user.id }
                  })
                  break
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

        const currentPath = router.currentRoute.value.path
        const rol = this.user.rol.nombre

        if (currentPath === '/login' || currentPath === '/register') {
          switch (rol) {
            case 'COMERCIAL':
              router.push({
                name: 'FichaComercialAsesor',
                params: { id: this.user.id }
              })
              break
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
      } else {
        console.log('checkAuth: No hay token en sessionStorage.')
      }
    },
  },
})

/**
 * Compatibilidad hacia atrás
 */
export { useAuthStore as authSetStore }
