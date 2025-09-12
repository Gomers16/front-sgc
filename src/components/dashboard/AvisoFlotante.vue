<!--
📌 NotificacionSnack.vue
- Encapsula el componente <v-snackbar> de Vuetify.
- Recibe por v-model un objeto con { show, message, color, timeout }.
- Se usa para mostrar mensajes flotantes (avisos/errores).
- El botón "Cerrar" cambia show a false para ocultarlo.
-->

<template>
  <!-- Snackbar flotante, se muestra en la esquina superior derecha -->
  <v-snackbar
    v-model="model.show"
    :color="model.color"
    :timeout="model.timeout"
    location="top right"
  >
    <!-- Mensaje principal del aviso -->
    {{ model.message }}

    <!-- Botón de acción para cerrar manualmente -->
    <template #actions>
      <v-btn color="white" variant="text" @click="model.show = false">Cerrar</v-btn>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
/**
 * defineModel:
 * - Permite usar v-model desde el componente padre.
 * - Aquí se define el tipo del objeto que maneja el snackbar.
 */
const model = defineModel<{
  show: boolean     // si el snackbar está visible
  message: string   // texto que se muestra
  color: string     // color (info, success, warning, error, etc.)
  timeout: number   // tiempo en ms antes de cerrarse solo
}>({ required: true })
</script>
