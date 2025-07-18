<script setup lang="ts">
import { onMounted } from 'vue'
import { authSetStore } from '@/stores/AuthStore'
import { useRouter } from 'vue-router'
import ActivautosLogo from '@/assets/activautos-logo.png'
import CdaLogo from '@/assets/cda-centro-logo-amarillo.png'

const authStore = authSetStore()
const router = useRouter()

async function irADetalle(noti: any) {
  await authStore.markNotificationAsRead(noti.id)
  router.push({ name: 'detalle-ticket', params: { id: String(noti.ticketId) } })
}

onMounted(async () => {
  await authStore.checkAuth()
})

const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Error al cerrar sesión:', error)
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
      Bienvenido, {{ authStore.user?.nombre || 'Usuario' }}
    </v-toolbar-title>

    <v-spacer></v-spacer>

    <v-menu location="bottom end" offset-y>
      <template #activator="{ props }">
        <v-badge
          :content="authStore.cantidadNoLeidas"
          color="red"
          v-bind="props"
          overlap
        >
          <v-icon>mdi-bell</v-icon>
        </v-badge>
      </template>

      <v-list>
        <v-list-item
          v-for="noti in authStore.notificaciones"
          :key="noti.id"
          @click="irADetalle(noti)"
        >
          <v-list-item-title>{{ noti.titulo }}</v-list-item-title>
          <v-list-item-subtitle>{{ noti.mensaje }}</v-list-item-subtitle>
        </v-list-item>
        <v-divider class="my-1" />
        <v-list-item @click="router.push({ name: 'Notificaciones' })">
          <v-list-item-title class="text-primary">
            Ver todas las notificaciones
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-btn icon="mdi-export" @click="handleLogout"></v-btn>
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
