<!-- src/components/layout/AppSidebar.vue -->
<template>
  <v-navigation-drawer
    expand-on-hover
    rail
    app
    permanent
    color="#0B3B82"
    style="margin-top: 64px;"
    :width="280"
    :rail-width="64"
  >
    <v-list>
      <v-list-item
        :subtitle="auth.user?.correo"
        :title="auth.user?.nombres"
        class="user-info"
      />
    </v-list>

    <v-divider class="my-2" />

    <v-list density="compact" nav>
      <v-list-item
        prepend-icon="mdi-view-dashboard"
        title="Dashboard"
        :to="{ path: '/dashboard' }"
        link
        class="nav-item"
      />

      <!-- Turnos -->
      <v-list-group
        value="rtm"
        prepend-icon="mdi-clipboard-list-outline"
        class="nav-item"
        color="#FACC15"
      >
        <template #activator="{ props }">
          <!-- 'RTM' → 'Turnos' -->
          <v-list-item v-bind="props" title="Turnos" />
        </template>

        <v-list-item title="Crear turno" :to="{ path: '/rtm/crear-turno' }" link />
        <v-list-item title="Turnos del día" :to="{ path: '/rtm/turnos-dia' }" link />
        <v-list-item title="Estado turno" :to="{ path: '/rtm/estado-turnos' }" link />

        <!-- 🧾 SOLO dejamos histórico -->
        <v-list-item
          title="Histórico facturación"
          :to="{ path: '/facturacion/historico' }"
          link
        />
      </v-list-group>

      <!-- Comercial -->
      <v-list-group
        value="comercial"
        prepend-icon="mdi-briefcase-variant-outline"
        class="nav-item"
        color="#FACC15"
      >
        <template #activator="{ props }">
          <v-list-item v-bind="props" title="Comercial" />
        </template>

        <v-list-item
          title="Buscar"
          prepend-icon="mdi-magnify"
          :to="{ path: '/comercial/buscar' }"
          link
        />

        <!-- Asesores -->
        <v-list-group
          value="comercial-asesores"
          prepend-icon="mdi-account-tie"
          class="nav-item"
          color="#FACC15"
        >
          <template #activator="{ props }">
            <v-list-item v-bind="props" title="Asesores" />
          </template>

          <v-list-item
            title="Listado / Convenios"
            :to="{ path: '/comercial/asesores' }"
            link
          />
        </v-list-group>

        <!-- Dateos -->
        <v-list-group
          value="comercial-dateos"
          prepend-icon="mdi-note-text-outline"
          class="nav-item"
          color="#FACC15"
        >
          <template #activator="{ props }">
            <v-list-item v-bind="props" title="Dateos" />
          </template>

          <v-list-item title="Listado" :to="{ path: '/comercial/dateos' }" link />
          <v-list-item title="Nuevo dateo" :to="{ path: '/comercial/dateos/nuevo' }" link />
        </v-list-group>

        <!-- Convenios -->
        <v-list-group
          value="comercial-convenios"
          prepend-icon="mdi-handshake-outline"
          class="nav-item"
          color="#FACC15"
        >
          <template #activator="{ props }">
            <v-list-item v-bind="props" title="Convenios" />
          </template>

          <v-list-item title="Listado" :to="{ path: '/comercial/convenios' }" link />
        </v-list-group>

        <!-- Prospectos -->
        <v-list-group
          value="comercial-prospectos"
          prepend-icon="mdi-account-search-outline"
          class="nav-item"
          color="#FACC15"
        >
          <template #activator="{ props }">
            <v-list-item v-bind="props" title="Prospectos" />
          </template>

          <v-list-item title="Listado" :to="{ path: '/comercial/prospectos' }" link />
          <v-list-item title="Nuevo prospecto" :to="{ path: '/comercial/prospectos/nuevo' }" link />
        </v-list-group>

        <!-- Clientes -->
        <v-list-group
          value="comercial-clientes"
          prepend-icon="mdi-account-multiple-outline"
          class="nav-item"
          color="#FACC15"
        >
          <template #activator="{ props }">
          <v-list-item v-bind="props" title="Clientes" />
          </template>

          <v-list-item title="Listado" :to="{ path: '/clientes' }" link />
        </v-list-group>

        <!-- Comisiones -->
        <v-list-group
          value="comercial-comisiones"
          prepend-icon="mdi-cash-multiple"
          class="nav-item"
          color="#FACC15"
        >
          <template #activator="{ props }">
            <v-list-item v-bind="props" title="Comisiones" />
          </template>

          <v-list-item
            title="Resumen / Listado"
            :to="{ path: '/comercial/comisiones' }"
            link
          />
          <!-- 👇 Nuevo ítem: configuración de comisiones -->
          <v-list-item
            title="Parámetros / Configuración"
            :to="{ name: 'ComercialComisionesConfig' }"
            link
          />
        </v-list-group>
      </v-list-group>

      <!-- Gestión Documental -->
      <v-list-group
        value="gestion-documental"
        prepend-icon="mdi-folder-file"
        class="nav-item"
        color="#FACC15"
      >
        <template #activator="{ props }">
          <v-list-item v-bind="props" title="Gestión Documental" />
        </template>

        <v-list-group
          value="razon-social"
          prepend-icon="mdi-domain"
          class="nav-item"
          color="#FACC15"
        >
          <template #activator="{ props }">
            <v-list-item v-bind="props" title="Razón Social" />
          </template>

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
import { authSetStore } from '@/stores/AuthStore'
const auth = authSetStore()
</script>

<style scoped>
/* Fondo corporativo azul con detalle amarillo */
.v-navigation-drawer {
  background: linear-gradient(180deg, #0b3b82, #0057b7);
  color: #e5e7eb;
  z-index: 1000;
  border-right: 1px solid rgba(15, 23, 42, 0.18);
}

/* Al expandir, respetar el ancho definido */
.v-navigation-drawer.v-navigation-drawer--expand-on-hover:not(.v-navigation-drawer--rail) {
  width: 280px !important;
  min-width: 280px !important;
}

/* Bloque de usuario */
.user-info {
  padding-top: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.35);
}

.user-info :deep(.v-list-item-title) {
  font-weight: 600;
  font-size: 0.9rem;
  color: #f9fafb;
}

.user-info :deep(.v-list-item-subtitle) {
  font-size: 0.78rem;
  color: #e5e7eb;
  opacity: 0.8;
}

/* Títulos de grupos e items */
.nav-item :deep(.v-list-item-title) {
  font-weight: 500;
  font-size: 0.86rem;
}

/* Texto e iconos por defecto */
:deep(.v-list-item) {
  color: #e5e7eb !important;
}

:deep(.v-list-item .v-icon) {
  color: #e5e7eb !important;
}

/* Hover más corporativo */
:deep(.v-list-item:hover) {
  background-color: rgba(15, 23, 42, 0.35) !important;
}

/* Estado activo con acento amarillo de marca */
:deep(.v-list-item--active) {
  background-color: rgba(250, 204, 21, 0.18) !important; /* amarillo suave */
  color: #facc15 !important;
}

:deep(.v-list-item--active .v-list-item-title),
:deep(.v-list-item--active .v-list-item-subtitle),
:deep(.v-list-item--active .v-icon) {
  color: #facc15 !important;
}
</style>
