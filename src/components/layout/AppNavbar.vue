<!--
📌 AppNavbar.vue (ejemplo de nombre)
Barra de navegación superior (toolbar) para el layout principal.

✔ Incluye:
  - Logos de CDA y Activautos (lado izquierdo).
  - Texto centrado con saludo al usuario autenticado.
  - Botón de logout (lado derecho).
  - Modal de confirmación para el cierre de sesión.

💡 Este componente debería ir en: src/components/layout/AppNavbar.vue
y ser usado dentro de MainLayout.vue.
-->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { authSetStore } from '@/stores/AuthStore'
import { useRouter } from 'vue-router'
import ActivautosLogo from '@/assets/activautos-logo.png'
import CdaLogo from '@/assets/cda-centro-logo-amarillo.png'

// ✅ Store de autenticación (para acceder al usuario actual y cerrar sesión)
const authStore = authSetStore()

// ✅ Router para redirigir después de cerrar sesión
const router = useRouter()

// Estado para controlar el modal de confirmación de logout
const showLogoutConfirm = ref(false)

// Estado de loading mientras se procesa el cierre de sesión
const logoutLoading = ref(false)

// Verifica autenticación al montar (ej. refrescar user)
onMounted(async () => {
  await authStore.checkAuth()
})

// 📌 Abre el modal de confirmación al hacer clic en el botón de logout
const handleLogout = () => {
  showLogoutConfirm.value = true
}

// 📌 Ejecuta el cierre de sesión si el usuario confirma
const confirmLogout = async () => {
  logoutLoading.value = true
  try {
    await authStore.logout()
    router.push('/login') // Redirige al login después de cerrar sesión
  } catch (error) {
    console.error('Error al cerrar sesión:', error)
    // Aquí podrías mostrar un snackbar si quieres feedback al usuario
  } finally {
    logoutLoading.value = false
    showLogoutConfirm.value = false // Cierra el modal
  }
}
</script>

<template>
  <v-toolbar color="#2962FF" dark app elevation="2">
    <!-- ✅ Logos agrupados a la izquierda -->
    <div class="logo-contenedor">
      <v-img
        :src="CdaLogo"
        alt="Logo CDA"
        width="130"
        max-height="120"
        contain
        class="mr-2"
      />
      <v-img
        :src="ActivautosLogo"
        alt="Logo Activautos"
        width="140"
        max-height="100"
        contain
      />
    </div>

    <!-- ✅ Texto centrado en la barra -->
    <v-toolbar-title class="titulo-centrado">
      Bienvenido, {{ authStore.user?.nombres || 'Usuario' }}
    </v-toolbar-title>

    <v-spacer></v-spacer>

    <!-- ✅ Botón de logout (lado derecho) -->
    <v-btn icon="mdi-export" @click="handleLogout"></v-btn>

    <!-- ✅ Modal de confirmación para cerrar sesión -->
    <v-dialog v-model="showLogoutConfirm" max-width="400">
      <v-card class="rounded-lg">
        <v-card-title class="text-h6 text-primary font-weight-bold">
          Confirmar Cierre de Sesión
        </v-card-title>
        <v-card-text>
          ¿Estás seguro de que quieres cerrar tu sesión?
        </v-card-text>
        <v-card-actions class="justify-end">
          <!-- Botón cancelar -->
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="showLogoutConfirm = false"
          >
            Cancelar
          </v-btn>
          <!-- Botón confirmar (con loading mientras cierra sesión) -->
          <v-btn
            color="error"
            variant="elevated"
            :loading="logoutLoading"
            @click="confirmLogout"
          >
            Sí, cerrar sesión
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-toolbar>
</template>

<style scoped>
/* Barra fija en la parte superior */
.v-toolbar {
  position: fixed;
  width: 100%;
  z-index: 1000; /* Siempre arriba de otros elementos */
}

/* Contenedor de logos alineados a la izquierda */
.logo-contenedor {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 1px;
}

/* Texto centrado absolutamente en la toolbar */
.titulo-centrado {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-weight: bold;
  text-align: center;
}
</style>
