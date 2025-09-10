// src/services/AuthService.ts
import { get, post } from './http'
import { authSetStore } from '@/stores/AuthStore'

// Tipos de respuesta (ajústalos según tu backend AdonisJS)
export interface LoginResponse {
  token: string
  user: {
    id: number
    nombre: string
    correo: string
  }
}

export interface UserResponse {
  id: number
  nombre: string
  correo: string
  // agrega los campos reales de tu modelo Usuario
}

export default class AuthService {
  /**
   * Iniciar sesión de un usuario.
   * POST /api/login
   */
  async login(correo: string, password: string): Promise<LoginResponse> {
    try {
      return await post<LoginResponse, { correo: string; password: string }>(
        '/api/login',
        { correo, password },
        { credentials: 'omit' } // el login no necesita enviar cookies
      )
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error en AuthService.login:', error.message)
        return { token: '', user: { id: 0, nombre: '', correo: '' } } as LoginResponse
      }
      throw error
    }
  }

  /**
   * Obtener la sesión del usuario autenticado.
   * GET /api/me
   */
  async me(): Promise<UserResponse> {
    const authStore = authSetStore()
    const token = authStore.token

    if (!token) {
      console.warn(
        'AuthService.me(): No hay token de autenticación disponible. No se puede verificar la sesión.'
      )
      throw new Error('No hay token de autenticación disponible para verificar la sesión.')
    }

    try {
      return await get<UserResponse>('/api/me', {
        headers: {
          Authorization: `Bearer ${token}`, // 🔑 enviamos el token
        },
      })
    } catch (error) {
      console.error('Error en AuthService.me():', error)
      throw error
    }
  }
}
