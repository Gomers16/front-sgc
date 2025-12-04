// composables/useAuth.ts o services/api.ts

import axios from 'axios'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification' // o tu librería de toasts

const api = axios.create({
  baseURL: 'http://localhost:3333/api',
})

// Interceptor de respuestas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const router = useRouter()
    const toast = useToast()

    // Detectar token corrupto o inválido
    if (error.response?.data?.code === 'INVALID_TOKEN' ||
        error.response?.data?.code === 'UNAUTHENTICATED') {

      // Limpiar sesión local
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      // Mostrar mensaje
      toast.error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.')

      // Redirigir al login
      router.push('/login')
    }

    return Promise.reject(error)
  }
)

export default api
