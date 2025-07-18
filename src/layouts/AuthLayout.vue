<template>
  <div class="auth-layout">
    <div class="background"></div>

    <HeaderButtons />
    <LogoHeader logoSrc="/activaautos-logo.png" pageName="ACTIVAUTOS CDA DEL CENTRO IBAGUÉ" />

    <div class="auth-content">
      <router-view />
    </div>

    <footer class="footer">
      <p>© 2025 ACTIVAUTOS CDA DEL CENTRO IBAGUÉ. Todos los derechos reservados.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import HeaderButtons from '@/components/HeaderButtons.vue'
import LogoHeader from '@/components/LogoHeader.vue'
</script>

<style scoped>
.background {
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: #21478d; /* Azul rey */
  z-index: -1;
}

.auth-layout {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  width: 100vw;
  height: 100vh;
  position: relative;
}

.auth-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 2rem;
}

.footer {
  position: absolute;
  bottom: 20px;
  text-align: center;
  color: white;
  font-size: 14px;
}
</style>
