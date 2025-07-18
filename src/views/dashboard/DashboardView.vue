<template>
  <div class="fullscreen-center">
    <v-card class="welcome-card" elevation="10">
      <v-card-title
        class="text-h4 text-center font-bold"
        style="color: black;"
      >
        ¡Bienvenido a ACTIVAUTOS CDA DEL CENTRO IBAGUÉ!
      </v-card-title>
      <v-card-text class="text-center mt-4">
        Estamos felices de tenerte de vuelta.
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { authSetStore } from '@/stores/AuthStore'
import { onMounted } from 'vue'

const authStore = authSetStore()

onMounted(() => {
  authStore.checkAuth()
})
</script>

<style scoped>
.fullscreen-center {
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f9fbff;
  padding: 0;
  margin: 0;
}

.welcome-card {
  max-width: 600px;
  width: 100%;
  padding: 40px;
  border-radius: 16px;
  text-align: center;
}

.font-bold {
  font-weight: 700;
}
</style>
