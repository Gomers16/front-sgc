<template>
  <v-navigation-drawer
    expand-on-hover
    rail
    app
    permanent
    color="#FFEB3B"
    style="margin-top: 64px;"
  >
    <!-- Usuario -->
    <v-list>
      <v-list-item
        :subtitle="auth.user?.correo"
        :title="auth.user?.nombres"
        class="user-info"
      />
    </v-list>

    <v-divider class="my-2"></v-divider>

    <!-- Menú -->
    <v-list density="compact" nav>
      <v-list-item
        prepend-icon="mdi-view-dashboard"
        title="Dashboard"
        :to="{ path: '/dashboard' }"
        link
        class="nav-item"
      />

      <!-- Menú RTM con subitems -->
      <v-list-group
        value="rtm"
        prepend-icon="mdi-clipboard-list-outline"
        class="nav-item"
        color="black"
      >
        <template #activator="{ props }">
          <v-list-item v-bind="props" title="RTM" />
        </template>

        <!-- ORDEN CAMBIADO AQUÍ -->
        <v-list-item
          title="Crear turno"
          :to="{ path: '/rtm/crear-turno' }"
          link
        />
        <v-list-item
          title="Turnos del día"
          :to="{ path: '/rtm/turnos-dia' }"
          link
        />
        <v-list-item
          title="Estado turno"
          :to="{ path: '/rtm/estado-turnos' }"
          link
        />
      </v-list-group>

      <!-- NUEVO: Menú para Usuarios -->
      <v-list-item
        prepend-icon="mdi-account-group"
        title="Usuarios"
        :to="{ path: '/usuarios' }"
        link
        class="nav-item"
      />

    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { authSetStore } from '@/stores/AuthStore'
const auth = authSetStore()
</script>

<style scoped>
.v-navigation-drawer {
  background-color: #c0b125 !important;
  color: black;
  z-index: 1000;
}

/* Texto en negrita */
.v-list-item-title,
.v-list-item-subtitle {
  color: black !important;
  font-weight: bold;
}

/* Ítems del menú */
.nav-item {
  font-weight: bold;
  color: black !important;
}

/* Info de usuario */
.user-info {
  font-weight: bold;
  color: black !important;
  padding-top: 12px;
  padding-bottom: 12px;
}
</style>
