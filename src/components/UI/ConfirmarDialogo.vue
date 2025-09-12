<!--
📌 ConfirmDialog.vue
Componente modal de confirmación genérico.

✔ Sirve para mostrar un diálogo simple donde el usuario debe confirmar o cancelar una acción.
✔ Se controla desde el padre con v-model (Boolean).
✔ Tiene props personalizables: título, mensaje, texto y color del botón de confirmar.
✔ Emite eventos:
   - update:modelValue → sincroniza el estado abierto/cerrado con el padre.
   - confirm           → cuando el usuario confirma la acción.
   - cancel            → cuando el usuario cancela o cierra el modal.

💡 Ejemplo de uso:
<ConfirmDialog
  v-model="showConfirm"
  title="Eliminar Usuario"
  message="¿Estás seguro de que deseas eliminar este usuario?"
  confirm-text="Eliminar"
  confirm-color="error"
  @confirm="handleDelete"
/>
-->

<template>
  <v-dialog v-model="dialog" max-width="500">
    <v-card>
      <!-- Título del diálogo -->
      <v-card-title class="headline">{{ title }}</v-card-title>

      <!-- Mensaje del cuerpo -->
      <v-card-text>
        {{ message }}
      </v-card-text>

      <!-- Botones de acción -->
      <v-card-actions>
        <v-spacer></v-spacer>
        <!-- Botón de cancelar -->
        <v-btn color="grey" text @click="cancel">Cancelar</v-btn>
        <!-- Botón de confirmar -->
        <v-btn :color="confirmColor" text @click="confirm">{{ confirmText }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

// 📌 Props: parámetros que recibe el componente
const props = defineProps({
  modelValue: { // v-model para controlar visibilidad desde el padre
    type: Boolean,
    required: true,
  },
  title: { // Texto del encabezado
    type: String,
    default: 'Confirmar Acción',
  },
  message: { // Texto del mensaje
    type: String,
    default: '¿Estás seguro de que quieres realizar esta acción?',
  },
  confirmText: { // Texto del botón de confirmar
    type: String,
    default: 'Confirmar',
  },
  confirmColor: { // Color del botón de confirmar
    type: String,
    default: 'primary',
  },
})

// 📌 Eventos emitidos hacia el padre
const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

// Estado interno del diálogo (sincronizado con modelValue)
const dialog = ref(props.modelValue)

// Sincroniza cambios desde el padre hacia el diálogo
watch(() => props.modelValue, (newVal) => {
  dialog.value = newVal
})

// Cuando el diálogo interno cambia (por ej. al cerrar clic fuera),
// informamos al padre y lanzamos cancel.
watch(dialog, (newVal) => {
  if (!newVal) {
    emit('update:modelValue', false)
    emit('cancel')
  }
})

// 📌 Funciones de acción
function confirm() {
  emit('confirm') // Avisamos al padre que se confirmó
  emit('update:modelValue', false) // Cerramos el modal
}

function cancel() {
  emit('cancel') // Avisamos al padre que se canceló
  emit('update:modelValue', false) // Cerramos el modal
}
</script>
