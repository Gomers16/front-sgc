<!-- src/components/layout/AppSidebar.vue -->
<template>
  <v-navigation-drawer
    expand-on-hover
    rail
    app
    permanent
    color="#0B3B82"
    style="margin-top: 64px"
    :width="280"
    :rail-width="64"
  >
    <v-list>
      <v-list-item :subtitle="auth.user?.correo" :title="auth.user?.nombres" class="user-info" />
    </v-list>

    <v-divider class="my-2" />

    <v-list density="compact" nav>
      <!-- Dashboard - Oculto para comerciales y contabilidad -->
      <v-list-item
        v-if="can.verDashboard()"
        prepend-icon="mdi-view-dashboard"
        title="Dashboard"
        :to="{ path: '/dashboard' }"
        link
        class="nav-item"
      />

      <!-- 🆕 Mi Ficha Comercial - Solo para comerciales -->
      <v-list-item
        v-if="can.verMiFichaComercial() && auth.currentAgenteId"
        prepend-icon="mdi-account-star"
        title="Mi Ficha Comercial"
        :to="{
          name: 'FichaComercialAsesor',
          params: { id: auth.currentAgenteId }
        }"
        link
        class="nav-item"
      />

      <!-- Turnos - Solo operativos, gerencia y admin -->
      <v-list-group
        v-if="can.verTurnos()"
        value="rtm"
        prepend-icon="mdi-clipboard-list-outline"
        class="nav-item"
        color="#FACC15"
      >
        <template #activator="{ props }">
          <v-list-item v-bind="props" title="Turnos" />
        </template>

        <v-list-item
          v-if="can.crearTurno()"
          title="Crear turno"
          :to="{ path: '/rtm/crear-turno' }"
          link
        />
        <v-list-item title="Turnos del día" :to="{ path: '/rtm/turnos-dia' }" link />
        <v-list-item title="Estado turno" :to="{ path: '/rtm/estado-turnos' }" link />

        <v-list-item
          v-if="can.verHistoricoFacturacion()"
          title="Histórico facturación"
          :to="{ path: '/facturacion/historico' }"
          link
        />
      </v-list-group>

      <!-- Comercial - Gerencia, Admin y Contabilidad -->
      <v-list-group
        v-if="can.verComercial()"
        value="comercial"
        prepend-icon="mdi-briefcase-variant-outline"
        class="nav-item"
        color="#FACC15"
      >
        <template #activator="{ props }">
          <v-list-item v-bind="props" title="Comercial" />
        </template>

        <!-- Asesores - Solo listado para CONTABILIDAD -->
        <v-list-group
          v-if="can.verListadoAgentes()"
          value="comercial-asesores"
          prepend-icon="mdi-account-tie"
          class="nav-item"
          color="#FACC15"
        >
          <template #activator="{ props }">
            <v-list-item v-bind="props" title="Asesores" />
          </template>

          <v-list-item title="Listado / Convenios" :to="{ path: '/comercial/asesores' }" link />
        </v-list-group>

        <!-- Dateos -->
        <v-list-group
          v-if="can.verDateos()"
          value="comercial-dateos"
          prepend-icon="mdi-note-text-outline"
          class="nav-item"
          color="#FACC15"
        >
          <template #activator="{ props }">
            <v-list-item v-bind="props" title="Dateos" />
          </template>

          <v-list-item title="Listado" :to="{ path: '/comercial/dateos' }" link />
          <!-- ❌ Nuevo dateo - Solo SUPER_ADMIN, GERENCIA y COMERCIAL -->
          <v-list-item
            v-if="can.crearDateo()"
            title="Nuevo dateo"
            :to="{ path: '/comercial/dateos/nuevo' }"
            link
          />
        </v-list-group>

        <!-- Convenios -->
        <v-list-group
          v-if="can.verConvenios()"
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
  v-if="can.verProspectos()"
  value="comercial-prospectos"
  prepend-icon="mdi-account-search-outline"
  class="nav-item"
  color="#FACC15"
>
  <template #activator="{ props }">
    <v-list-item v-bind="props" title="Prospectos" />
  </template>

  <v-list-item title="Listado" :to="{ path: '/comercial/prospectos' }" link />

  <!-- ❌ Nuevo prospecto - Solo SUPER_ADMIN, GERENCIA y COMERCIAL -->
  <v-list-item
    v-if="can.crearProspecto()"
    title="Nuevo prospecto"
    :to="{ path: '/comercial/prospectos/nuevo' }"
    link
  />
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
          v-if="can.verComisiones()"
          value="comercial-comisiones"
          prepend-icon="mdi-cash-multiple"
          class="nav-item"
          color="#FACC15"
        >
          <template #activator="{ props }">
            <v-list-item v-bind="props" title="Comisiones" />
          </template>

          <v-list-item title="Resumen / Listado" :to="{ path: '/comercial/comisiones' }" link />

          <!-- ❌ Config de comisiones - Solo SUPER_ADMIN y GERENCIA -->
          <v-list-item
            v-if="can.configurarComisiones()"
            title="Parámetros / Configuración"
            :to="{ name: 'ComercialComisionesConfig' }"
            link
          />
        </v-list-group>
      </v-list-group>

      <!-- Gestión Documental - Solo RRHH, Gerencia, Admin -->
      <v-list-group
        v-if="can.verGestionDocumental()"
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
import { useAuthStore } from '@/stores/AuthStore'
import { usePermissions } from '@/composables/usePermissions'

const auth = useAuthStore()
const { can } = usePermissions()
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
  background-color: rgba(250, 204, 21, 0.18) !important;
  color: #facc15 !important;
}

:deep(.v-list-item--active .v-list-item-title),
:deep(.v-list-item--active .v-list-item-subtitle),
:deep(.v-list-item--active .v-icon) {
  color: #facc15 !important;
}
</style>
