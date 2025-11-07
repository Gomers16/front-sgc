<!-- src/components/layout/AppNavbar.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { authSetStore } from '@/stores/AuthStore'
import { useRouter } from 'vue-router'
import ActivautosLogo from '@/assets/activautos-logo.png'
import CdaLogo from '@/assets/cda-centro-logo-amarillo.png'

const authStore = authSetStore()
const router = useRouter()

const showLogoutConfirm = ref(false)
const logoutLoading = ref(false)

onMounted(async () => {
  await authStore.checkAuth()
})

const handleLogout = () => {
  showLogoutConfirm.value = true
}

const confirmLogout = async () => {
  logoutLoading.value = true
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Error al cerrar sesión:', error)
  } finally {
    logoutLoading.value = false
    showLogoutConfirm.value = false
  }
}
</script>

<template>
  <v-toolbar class="app-navbar" flat>
    <!-- Logos izquierda (grandes, como antes) -->
    <div class="logo-contenedor">
      <v-img
        :src="CdaLogo"
        alt="Logo CDA"
        width="140"
        max-height="160"
        contain
        class="logo-img mr-2"
      />
      <v-img
        :src="ActivautosLogo"
        alt="Logo Activautos"
        width="160"
        max-height="150"
        contain
        class="logo-img"
      />
    </div>

    <!-- Título centrado -->
    <v-toolbar-title class="titulo-centrado">
      <span class="titulo-saludo">PANEL DE OPERACIÓN DIARIA</span>
      <span class="titulo-usuario">
        Bienvenido, <strong>{{ authStore.user?.nombres || 'Usuario' }}</strong>
      </span>
    </v-toolbar-title>

    <v-spacer />

    <!-- Botón logout -->
    <v-btn
      icon="mdi-export"
      class="logout-btn"
      variant="text"
      @click="handleLogout"
    />

    <!-- Diálogo logout -->
    <v-dialog v-model="showLogoutConfirm" max-width="400">
      <v-card class="rounded-lg">
        <v-card-title class="text-h6 font-weight-bold text-primary">
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
.app-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;

  /* Azul corporativo */
  background-color: #0052cc;
  color: #ffffff;

  /* Altura similar a la que tenías antes */
  min-height: 65px;
  height: 65px;

  /* Detalle amarillo inferior */
  border-bottom: 4px solid #ffca28;

  padding-inline: 20px;
  z-index: 1000;
}

/* Logos alineados a la izquierda */
.logo-contenedor {
  display: flex;
  align-items: center;
  gap: 1 px;
}

.logo-img {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

/* Título centrado */
.titulo-centrado {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 2px;
  pointer-events: none;
}

.titulo-saludo {
  font-size: 0.8rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  opacity: 0.9;
}

.titulo-usuario {
  font-size: 0.9rem;
}

/* Botón de logout */
.logout-btn {
  color: #ffffff !important;
}
.logout-btn:hover {
  background-color: rgba(255, 255, 255, 0.16);
}

/* Ajustes en pantallas pequeñas */
@media (max-width: 960px) {
  .app-navbar {
    height: 60px;
    min-height: 60px;
  }

  .logo-contenedor {
    gap: 8px;
  }

  .titulo-saludo {
    font-size: 0.7rem;
  }

  .titulo-usuario {
    font-size: 0.8rem;
  }
}
</style>
