<template>
  <v-container class="mt-6">
    <v-card elevation="8" class="pa-8 rounded-xl text-center">
      <v-card-title class="text-h4 mb-6 text-primary font-weight-bold d-flex justify-center title-full-bordered-container">
        <span class="title-text-with-border">
          🚧 ¡Estamos Mejorando! 🚧
        </span>
      </v-card-title>

      <v-card-text class="text-body-1 mb-6">
        <p class="mb-4">
          En <strong>ACTIVAUTOS</strong>, nos esforzamos por ofrecerte la mejor experiencia posible.
          Estamos trabajando arduamente en nuevas funcionalidades y mejoras para este módulo.
        </p>
        <p class="mb-6">
          Pronto podrás disfrutar de una herramienta aún más completa y eficiente.
          ¡Gracias por tu paciencia y comprensión!
        </p>

        <v-progress-linear
          color="primary"
          indeterminate
          rounded
          height="8"
          class="my-8"
        ></v-progress-linear>

        <p class="text-body-2 text-medium-emphasis">
          Para cualquier consulta urgente, por favor, contacta a nuestro equipo de soporte.
        </p>
      </v-card-text>

      <v-card-actions class="justify-center">
        <v-btn
          color="primary"
          variant="elevated"
          size="large"
          class="font-weight-bold py-3 px-6 bordered-button"
          prepend-icon="mdi-arrow-left"
          @click="goBack"
        >
          Volver
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.go(-1) // Navigates back one step in the history
}
</script>

<style scoped>
/* Contenedor del título que ahora centra su contenido */
.title-full-bordered-container {
  padding: 0 !important;
}

/* Estilo para el span que contiene el texto y el borde */
.title-text-with-border {
  border: 2px solid black; /* Borde negro de 2px */
  padding: 10px 20px; /* Más padding para que el borde se vea bien */
  border-radius: 12px; /* Bordes ligeramente más redondeados */
  background-color: rgba(255, 255, 255, 0.9); /* Fondo semi-transparente para que el borde resalte */
  margin-bottom: 24px;
  display: inline-block;
  font-weight: bold;
  letter-spacing: 0.05em;
  color: var(--v-theme-primary); /* Usar la variable de color primary de Vuetify */
}

.v-card {
  box-shadow: 0 10px 20px rgba(0,0,0,0.15), 0 6px 6px rgba(0,0,0,0.1);
  border-radius: 16px;
  background: linear-gradient(145deg, #f0f2f5, #e0e2e5);
}

.v-btn {
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.bordered-button {
  box-shadow: 0 4px 6px rgba(0,0,0,0.1), 0 0 0 2px black !important;
}

.v-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.2), 0 0 0 3px black !important;
}

.text-medium-emphasis {
  color: #616161; /* Un gris más oscuro para el texto secundario */
}
</style>
