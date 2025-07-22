<script setup lang="ts">
import { ref, onMounted } from 'vue' // Importar ref
import { authSetStore } from '@/stores/AuthStore'
import { useRouter } from 'vue-router'
import ActivautosLogo from '@/assets/activautos-logo.png'
import CdaLogo from '@/assets/cda-centro-logo-amarillo.png'

const authStore = authSetStore()
const router = useRouter()

// Estado para el modal de confirmación de cierre de sesión
const showLogoutConfirm = ref(false)
const logoutLoading = ref(false)

onMounted(async () => {
  await authStore.checkAuth()
})

// Abre el modal de confirmación
const handleLogout = () => {
  showLogoutConfirm.value = true
}

// Ejecuta el cierre de sesión después de la confirmación
const confirmLogout = async () => {
  logoutLoading.value = true
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Error al cerrar sesión:', error)
    // Opcional: mostrar un snackbar o mensaje de error si el logout falla
  } finally {
    logoutLoading.value = false
    showLogoutConfirm.value = false // Cerrar el modal después de la acción
  }
}
</script>

<template>
  <v-toolbar color="#2962FF" dark app elevation="2">
    <!-- ✅ Logos agrupados -->
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

    <!-- ✅ Texto centrado en el navbar -->
    <v-toolbar-title class="titulo-centrado">
      Bienvenido, {{ authStore.user?.nombres || 'Usuario' }}
    </v-toolbar-title>

    <v-spacer></v-spacer>

    <!-- Botón de logout -->
    <v-btn icon="mdi-export" @click="handleLogout"></v-btn>

    <!-- Modal de confirmación de cierre de sesión -->
    <v-dialog v-model="showLogoutConfirm" max-width="400">
      <v-card class="rounded-lg">
        <v-card-title class="text-h6 text-primary font-weight-bold">
          Confirmar Cierre de Sesión
        </v-card-title>
        <v-card-text>
          ¿Estás seguro de que quieres cerrar tu sesión?
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="showLogoutConfirm = false"
          >
            Cancelar
          </v-btn>
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
.v-toolbar {
  position: fixed;
  width: 100%;
  z-index: 1000;
}

.logo-contenedor {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 1px;
}

/* ✅ Centrado absoluto real */
.titulo-centrado {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-weight: bold;
  text-align: center;
}
</style>
