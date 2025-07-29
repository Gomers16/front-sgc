import router from '@/router'
import AuthService from '@/services/AuthService'
import { defineStore } from 'pinia'

// ✅ Interfaz User actualizada para coincidir con la respuesta REAL del backend
interface User {
  id: number;
  razonSocialId: number;
  rolId: number;
  epsId: number;
  arlId: number;
  afpId: number;
  afcId: number;
  ccfId: number;
  nombres: string; // Coincide con la respuesta del backend
  apellidos: string;
  correo: string;
  fotoPerfil: string;
  sede: string;
  direccion: string;
  celularPersonal: string;
  celularCorporativo: string;
  area: string;
  centroCosto: string;
  estado: string;
  recomendaciones: number;
  createdAt: string;
  updatedAt: string;
  rol: {
    id: number;
    nombre: string;
    createdAt: string;
    updatedAt: string;
  };
}

// ✅ Nueva interfaz para manejar errores de red con una estructura de respuesta
interface NetworkError extends Error {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export const authSetStore = defineStore('auth', {
  state: () => {
    let user: User | null = null;
    try {
      // ✅ Lee de 'user' (la clave real que el backend envía para el usuario)
      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        user = JSON.parse(storedUser);
      }
    } catch (error: unknown) {
      console.error('Error al parsear el usuario desde sessionStorage:', error);
    }

    return {
      user,
      // ✅ Lee el token desde 'token'
      token: sessionStorage.getItem('token') || null,
    };
  },

  actions: {
    async login(userData: { email: string; password: string }): Promise<boolean> {
      const auth = new AuthService();
      let loginResponse; // Usamos una variable para capturar la respuesta

      try {
        loginResponse = await auth.login(userData.email, userData.password);
      } catch (error: unknown) {
        let errorMessage = 'Error desconocido en el servicio de autenticación.';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        // Sustituido alert por console.error para evitar bloqueos en el navegador
        console.error('Error en AuthStore.login (capturado del servicio):', errorMessage);
        return false;
      }

      // Manejo de errores si el servicio de login devuelve una propiedad 'errors'
      if (loginResponse.errors?.[0]) {
        // Sustituido alert por console.error
        console.error('Error de login desde el backend:', loginResponse.errors[0].message);
        return false;
      }

      // ✅ ¡CORRECCIÓN CRÍTICA AQUÍ! ✅
      // Accede al token real desde 'loginResponse.token.token'
      const tokenValue = loginResponse.token?.token;
      // Accede a los datos del usuario desde 'loginResponse.user'
      const userFromBackend = loginResponse.user;

      // Verifica que tanto el token como los datos del usuario sean válidos
      if (!tokenValue || !userFromBackend) {
        // Sustituido alert por console.error
        console.error('Respuesta inválida del servidor al iniciar sesión: Token o datos de usuario incompletos.', loginResponse); // Log para depuración
        return false;
      }

      // Actualiza el estado del store con los valores correctos
      this.token = tokenValue;
      this.user = userFromBackend as User;

      // ✅ Guarda en sessionStorage con las claves correctas ('token' y 'user')
      sessionStorage.setItem('token', tokenValue);
      sessionStorage.setItem('user', JSON.stringify(userFromBackend));

      router.push('/dashboard');
      return true;
    },

    async logout() {
      this.user = null;
      this.token = null;

      // ✅ Elimina las claves correctas de sessionStorage ('user' y 'token')
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');

      console.log('AuthStore: Sesión cerrada.');

      router.push('/login');
    },

    async checkAuth() {
      if (this.token && !this.user) {
        try {
          const authService = new AuthService();
          const response = await authService.me();

          // ✅ Asumiendo que /api/me devuelve { user: { ... } }
          if (response.user) {
            this.user = response.user as User;
            // ✅ Guarda en sessionStorage bajo la clave 'user'
            sessionStorage.setItem('user', JSON.stringify(response.user));
            console.log('checkAuth: Usuario cargado desde API:', this.user);

            if (
              router.currentRoute.value.path === '/login' ||
              router.currentRoute.value.path === '/register'
            ) {
              router.push('/dashboard');
            }
          } else {
            console.error('checkAuth: No se pudo obtener la información del usuario o token inválido.');
            this.logout();
          }
        } catch (error: unknown) { // Usamos unknown aquí
          if (error instanceof Error) {
            // ✅ Acceso seguro a las propiedades del error de red
            const networkError = error as NetworkError;
            console.error(
              'checkAuth: Error al verificar autenticación:',
              networkError.response?.data?.message || networkError.message
            );
          } else {
            console.error('checkAuth: Error desconocido:', error);
          }
          this.logout();
        }
      } else if (this.token && this.user) {
        console.log('checkAuth: Usuario ya cargado en el store y token presente.');

        if (
          router.currentRoute.value.path === '/login' ||
          router.currentRoute.value.path === '/register'
        ) {
          router.push('/dashboard');
        }
      } else {
        console.log('checkAuth: No hay token en sessionStorage, no se verifica autenticación.');
      }
    },
  },
  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    // ✅ Nuevo getter: Proporciona el ID numérico del usuario de forma segura
    currentUserId: (state) => state.user?.id || null,
  },
});
