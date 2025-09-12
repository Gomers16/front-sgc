<!--
📌 AppSidebar.vue (ejemplo de nombre)
Barra lateral de navegación (drawer) para el layout principal.

✔ Funcionalidad:
  - Muestra la información básica del usuario logueado (nombre + correo).
  - Agrupa las secciones de navegación de la aplicación:
      • Dashboard
      • RTM (con submenú: Crear turno, Turnos del día, Estado turno)
      • Gestión Documental
          - Razón Social (submenú con varias empresas)
          - Usuarios
          - Contratos
  - Usa `v-navigation-drawer` de Vuetify, expandible al pasar el mouse.

💡 Este componente debería ir en: src/components/layout/AppSidebar.vue
y usarse dentro de MainLayout.vue junto con AppNavbar.vue.
-->

<template>
  <v-navigation-drawer
    expand-on-hover
    rail
    app
    permanent
    color="#FFEB3B"
    style="margin-top: 64px;"
    :width="280"
    :rail-width="64"
  >
    <!-- 🧑 Info del usuario -->
    <v-list>
      <v-list-item
        :subtitle="auth.user?.correo"
        :title="auth.user?.nombres"
        class="user-info"
      />
    </v-list>

    <v-divider class="my-2" />

    <!-- 📌 Menú principal -->
    <v-list density="compact" nav>
      <!-- Item: Dashboard -->
      <v-list-item
        prepend-icon="mdi-view-dashboard"
        title="Dashboard"
        :to="{ path: '/dashboard' }"
        link
        class="nav-item"
      />

      <!-- Grupo: RTM -->
      <v-list-group
        value="rtm"
        prepend-icon="mdi-clipboard-list-outline"
        class="nav-item"
        color="black"
      >
        <template #activator="{ props }">
          <v-list-item v-bind="props" title="RTM" />
        </template>

        <v-list-item title="Crear turno" :to="{ path: '/rtm/crear-turno' }" link />
        <v-list-item title="Turnos del día" :to="{ path: '/rtm/turnos-dia' }" link />
        <v-list-item title="Estado turno" :to="{ path: '/rtm/estado-turnos' }" link />
      </v-list-group>

      <!-- Grupo: Gestión Documental -->
      <v-list-group
        value="gestion-documental"
        prepend-icon="mdi-folder-file"
        class="nav-item"
        color="black"
      >
        <template #activator="{ props }">
          <v-list-item v-bind="props" title="Gestión Documental" />
        </template>

        <!-- Subgrupo: Razón Social -->
        <v-list-group
          value="razon-social"
          prepend-icon="mdi-domain"
          class="nav-item"
          color="black"
        >
          <template #activator="{ props }">
            <v-list-item v-bind="props" title="Razón Social" />
          </template>

          <!-- Links a cada empresa -->
          <v-list-item
            title="CDA del Centro"
            :to="{ name: 'RazonSocialDetalle', params: { id: 1, nombre: 'CDA del Centro' } }"
            link
          />
          <v-list-item
            title="CDA Activa"
            :to="{ name: 'RazonSocialDetalle', params: { id: 2, nombre: 'Activautos' } }"
            link
          />
          <v-list-item
            title="JEF & CO"
            :to="{ name: 'RazonSocialDetalle', params: { id: 3, nombre: 'JEF & CO' } }"
            link
          />
          <v-list-item
            title="Activa Marketing"
            :to="{ name: 'RazonSocialDetalle', params: { id: 4, nombre: 'Activa Marketing' } }"
            link
          />
        </v-list-group>

        <!-- Otros accesos dentro de Gestión Documental -->
        <v-list-item
          title="Usuarios"
          prepend-icon="mdi-account-group"
          :to="{ name: 'Usuarios' }"
          link
        />

        <v-list-item
          title="Crear contrato"
          prepend-icon="mdi-file-document-edit"
          :to="{ name: 'Contratos' }"
          link
        />
      </v-list-group>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
/**
 * 📌 Store de autenticación
 * - Se usa aquí para mostrar info básica del usuario logueado (nombre + correo).
 */
import { authSetStore } from '@/stores/AuthStore'
const auth = authSetStore()
</script>

<style scoped>
/* 🎨 Estilo del drawer */
.v-navigation-drawer {
  background-color: #c0b125 !important;
  color: black;
  z-index: 1000;
}

/* Asegura el ancho cuando está expandido */
.v-navigation-drawer.v-navigation-drawer--expand-on-hover:not(.v-navigation-drawer--rail) {
  width: 280px !important;
  min-width: 280px !important;
}

/* 🎨 Estilo de títulos/subtítulos */
.v-list-item-title,
.v-list-item-subtitle {
  color: black !important;
  font-weight: bold;
}

/* Alineación de contenido de los items */
.v-list-item__content {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 16px !important;
}

/* Items del menú */
.nav-item {
  font-weight: bold;
  color: black !important;
}

/* Info del usuario arriba del drawer */
.user-info {
  font-weight: bold;
  color: black !important;
  padding-top: 12px;
  padding-bottom: 12px;
}
</style>
