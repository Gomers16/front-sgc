<template>
  <div class="logo-header">
    <div class="logo-group">
      <img src="/src/assets/cda-centro-logo-amarillo.png" alt="Logo CDA" class="logo cda-logo" />
      <img src="/src/assets/activautos-logo.png" alt="Logo Activautos" class="logo activautos-logo" />
    </div>

    <h1 class="page-name">ACTIVAUTOS CDA DEL CENTRO IBAGUÉ</h1>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.logo-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
  width: 100%;
  position: relative;
}

.logo-group {
  position: absolute;
  left: 2rem;
  top: 0;
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.logo {
  height: 200px;
  object-fit: contain;
}

.page-name {
  text-align: center;
  font-size: 2.2rem;
  font-weight: bold;
  color: white;
  text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.4);
  margin-top: 5rem; /* ⬅️ Aquí bajamos el texto */
}
</style>
