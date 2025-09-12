<!--
📌 AccionesRapidas.vue
- Renderiza los tres botones principales del dashboard.
- Cada botón emite un evento distinto al hacer clic:
    • crear-turno         → Para ir a la pantalla de creación de turno.
    • ver-turnos-proceso  → Para ir a la pantalla de turnos en proceso.
    • ver-historico       → Para ir a la pantalla del histórico de turnos.
- La vista (DashboardView.vue) escucha estos eventos y decide a dónde navegar con el router.
-->

<template>
  <!-- Contenedor con fila centrada -->
  <v-row justify="center">
    <!-- Botón: Crear nuevo turno -->
    <v-col cols="12" sm="6" md="4">
      <v-btn
        color="success"
        variant="elevated"
        size="large"
        block
        prepend-icon="mdi-plus-circle"
        class="action-btn"
        @click="$emit('crear-turno')"
      >
        Crear Nuevo Turno
      </v-btn>
    </v-col>

    <!-- Botón: Ver turnos en proceso -->
    <v-col cols="12" sm="6" md="4">
      <v-btn
        color="info"
        variant="elevated"
        size="large"
        block
        prepend-icon="mdi-progress-check"
        class="action-btn"
        @click="$emit('ver-turnos-proceso')"
      >
        Ver Turnos en Proceso
      </v-btn>
    </v-col>

    <!-- Botón: Ver histórico de turnos -->
    <v-col cols="12" sm="6" md="4">
      <v-btn
        color="primary"
        variant="elevated"
        size="large"
        block
        prepend-icon="mdi-history"
        class="action-btn"
        @click="$emit('ver-historico')" 
      >
        Ver Histórico de Turnos
      </v-btn>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
/**
 * defineEmits:
 * - Declaramos qué eventos puede emitir este componente.
 * - Esto ayuda a tener tipado en TypeScript y autocompletado en el editor.
 */
defineEmits<{
  (e: 'crear-turno'): void
  (e: 'ver-turnos-proceso'): void
  (e: 'ver-historico'): void
}>()
</script>

<style scoped>
/* Estilos de los botones para darles un look más interactivo */
.action-btn {
  font-weight: bold;
  letter-spacing: 0.05em;
  transition: transform .2s ease-in-out, box-shadow .2s ease-in-out;
}
.action-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 15px rgba(0,0,0,0.2);
}
</style>
