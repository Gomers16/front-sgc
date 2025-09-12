<template>
  <v-app>
    <AppSidebar />

    <v-layout style="background: #B0BEC5;"> <AppNavbar />
    </v-layout>

    <v-main class="pa-15" style="background: #B0BEC5;"> <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppNavbar from '@/components/layout/AppNavbar.vue'
</script>

<style scoped>
/* No hay cambios en el estilo scoped, solo en el template */
</style>
