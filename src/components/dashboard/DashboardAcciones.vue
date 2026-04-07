<!-- src/components/dashboard/DashboardAcciones.vue -->
<template>
  <v-row justify="center" class="acciones-row">
    <v-col cols="12" sm="6" md="4">
      <v-btn
        variant="elevated"
        :size="$vuetify.display.xs ? 'default' : 'large'"
        block
        prepend-icon="mdi-plus-circle"
        class="action-btn action-btn--primary"
        @click="$emit('crear-turno')"
      >
        <span class="btn-texto">Crear nuevo turno</span>
      </v-btn>
    </v-col>

    <v-col cols="12" sm="6" md="4">
      <v-btn
        variant="elevated"
        :size="$vuetify.display.xs ? 'default' : 'large'"
        block
        prepend-icon="mdi-progress-check"
        class="action-btn action-btn--secondary"
        @click="$emit('ver-turnos-proceso')"
      >
        <span class="btn-texto">Ver turnos en proceso</span>
      </v-btn>
    </v-col>

    <v-col cols="12" sm="6" md="4">
      <v-btn
        variant="elevated"
        :size="$vuetify.display.xs ? 'default' : 'large'"
        block
        prepend-icon="mdi-history"
        class="action-btn action-btn--tertiary"
        @click="$emit('ver-historico')"
      >
        <span class="btn-texto">Ver histórico de turnos</span>
      </v-btn>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
defineEmits<{
  (e: 'crear-turno'): void
  (e: 'ver-turnos-proceso'): void
  (e: 'ver-historico'): void
}>()
</script>

<style scoped>
.acciones-row {
  margin-top: 8px;
  gap: 4px;
}

.action-btn {
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: none;
  border-radius: 12px;
  transition:
    transform .16s ease-in-out,
    box-shadow .16s ease-in-out;
}

.btn-texto {
  font-size: 0.82rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (min-width: 600px) {
  .btn-texto {
    font-size: 0.9rem;
  }
  .action-btn {
    border-radius: 999px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
}

.action-btn--primary {
  background: linear-gradient(90deg, #0057b7, #2563eb);
  color: #ffffff !important;
  border: 1px solid #ffca28;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.25);
}
.action-btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.32);
}

.action-btn--secondary {
  background-color: #2563eb !important;
  color: #ffffff !important;
  border: 1px solid #1d4ed8;
  box-shadow: 0 6px 14px rgba(37, 99, 235, 0.35);
}
.action-btn--secondary:hover {
  background-color: #1d4ed8 !important;
  transform: translateY(-2px);
}

.action-btn--tertiary {
  background-color: #1d4ed8 !important;
  color: #ffffff !important;
  border: 1px solid #d97706;
  box-shadow: 0 6px 14px rgba(245, 158, 11, 0.35);
}
.action-btn--tertiary:hover {
  transform: translateY(-2px);
}
</style>
