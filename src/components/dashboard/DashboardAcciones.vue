<!-- src/components/dashboard/DashboardAcciones.vue (o AccionesRapidas.vue) -->
<template>
  <v-row justify="center" class="acciones-row">
    <!-- Botón: Crear nuevo turno (principal) -->
    <v-col cols="12" sm="6" md="4">
      <v-btn
        variant="elevated"
        size="large"
        block
        prepend-icon="mdi-plus-circle"
        class="action-btn action-btn--primary"
        @click="$emit('crear-turno')"
      >
        CREAR NUEVO TURNO
      </v-btn>
    </v-col>

    <!-- Botón: Ver turnos en proceso (secundario, azul más claro) -->
    <v-col cols="12" sm="6" md="4">
      <v-btn
        variant="elevated"
        size="large"
        block
        prepend-icon="mdi-progress-check"
        class="action-btn action-btn--secondary"
        @click="$emit('ver-turnos-proceso')"
      >
        VER TURNOS EN PROCESO
      </v-btn>
    </v-col>

    <!-- Botón: Ver histórico de turnos (terciario, amarillo sólido) -->
    <v-col cols="12" sm="6" md="4">
      <v-btn
        variant="elevated"
        size="large"
        block
        prepend-icon="mdi-history"
        class="action-btn action-btn--tertiary"
        @click="$emit('ver-historico')"
      >
        VER HISTÓRICO DE TURNOS
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
}

/* Base de todos los botones */
.action-btn {
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border-radius: 999px;
  transition:
    transform .16s ease-in-out,
    box-shadow .16s ease-in-out,
    background-color .16s ease-in-out,
    color .16s ease-in-out;
}

/* Principal: azul corporativo + borde amarillo */
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

/* Secundario: azul más claro, sólido */
.action-btn--secondary {
  background-color: #2563eb !important;
  color: #ffffff !important;
  border-radius: 999px;
  border: 1px solid #1d4ed8;
  box-shadow: 0 6px 14px rgba(37, 99, 235, 0.35);
}
.action-btn--secondary:hover {
  background-color: #1d4ed8 !important;
  transform: translateY(-2px);
}

/* Terciario: amarillo sólido, texto oscuro para buen contraste */
.action-btn--tertiary {
  background-color: #1d4ed8 !important; /* amarillo/naranja corporativo */
  color: #ffffff !important;
  border-radius: 999px;
  border: 1px solid #d97706;
  box-shadow: 0 6px 14px rgba(245, 158, 11, 0.35);
}


/* Ajuste en pantallas pequeñas */
@media (max-width: 960px) {
  .action-btn {
    font-size: 0.76rem;
  }
}
</style>
