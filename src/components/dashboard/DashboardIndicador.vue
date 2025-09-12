<!--
📌 KPITarjeta.vue
- Muestra una tarjeta con un KPI (dato numérico con icono y título).
- Props configurables:
    • icon       → nombre del ícono de Vuetify (ej: mdi-car-multiple).
    • titulo     → texto descriptivo del KPI (ej: "Turnos en Proceso").
    • valor      → número o texto que se mostrará como dato principal.
    • loading    → si está cargando, muestra "..." en lugar del valor.
    • colorCard  → color de fondo de la tarjeta.
    • colorIcon  → color del ícono y de los textos.
- Se usa varias veces en DashboardView.vue para mostrar distintos KPIs.
-->

<template>
  <v-card class="kpi-card pa-4 text-center elevation-4" :color="colorCard">
    <!-- Icono del KPI -->
    <v-icon size="48" :color="colorIcon">{{ icon }}</v-icon>

    <!-- Valor del KPI (o "..." si está cargando) -->
    <v-card-title class="text-h4 font-weight-bold" :class="['text-'+colorIcon]">
      {{ loading ? '...' : valor }}
    </v-card-title>

    <!-- Título descriptivo del KPI -->
    <v-card-subtitle class="text-body-1" :class="['text-'+colorIcon]">
      {{ titulo }}
    </v-card-subtitle>
  </v-card>
</template>

<script setup lang="ts">
/**
 * defineProps:
 * - Define las propiedades que recibe el componente desde el padre.
 * - Tipadas en TypeScript para mayor seguridad.
 */
defineProps<{
  icon: string
  titulo: string
  valor: number | string
  loading?: boolean
  colorCard: string
  colorIcon: string
}>()
</script>

<style scoped>
/* Estilos de la tarjeta KPI */
.kpi-card {
  border-radius: 12px;
  transition: transform .2s ease-in-out, box-shadow .2s ease-in-out;
}
/* Efecto hover para dar interactividad */
.kpi-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 25px rgba(0,0,0,0.2);
}
</style>
