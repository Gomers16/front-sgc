<template>
  <div class="auth-layout">
    <div class="background"></div>

    <!-- HeaderButtons y LogoHeader se mantendrán en la parte superior -->
    <HeaderButtons />
    <LogoHeader logoSrc="/activaautos-logo.png" pageName="ACTIVAUTOS CDA DEL CENTRO IBAGUÉ" />

    <!-- El contenido de autenticación (Login.vue) se centrará aquí -->
    <div class="auth-content">
      <router-view />
    </div>

    <!-- El footer se mantendrá en la parte inferior -->
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
  flex-direction: column; /* Organiza los elementos en una columna */
  justify-content: space-between; /* Espacia los elementos (Header, Content, Footer) */
  align-items: center; /* Centra los elementos horizontalmente */
  width: 100vw; /* Ocupa el 100% del ancho del viewport */
  min-height: 100vh; /* Ocupa al menos el 100% de la altura del viewport */
  position: relative;
  overflow-x: hidden; /* Evita el scroll horizontal */
  padding-bottom: 40px; /* Espacio para el footer si no es absoluto */
  box-sizing: border-box; /* Incluye padding en el ancho/alto total */
}

.auth-content {
  flex: 1; /* Permite que este div ocupe el espacio restante */
  display: flex;
  justify-content: center; /* Centra el contenido (Login.vue) horizontalmente */
  align-items: center; /* Centra el contenido (Login.vue) verticalmente */
  width: 100%;
  padding: 2rem; /* Aumenta el padding para dar más espacio alrededor del formulario */
  box-sizing: border-box; /* Incluye padding en el ancho total */
}

.footer {
  position: absolute;
  bottom: 20px;
  text-align: center;
  color: white;
  font-size: 0.85rem; /* Usamos rem para el tamaño de fuente */
  width: 100%; /* Asegura que el footer ocupe todo el ancho */
  padding: 0 1rem; /* Pequeño padding horizontal */
  box-sizing: border-box;
}

/* Media query para ajustar el tamaño de fuente del footer en pantallas pequeñas */
@media (max-width: 480px) {
  .footer {
    font-size: 0.75rem;
    bottom: 10px; /* Ajustar un poco la posición en pantallas muy pequeñas */
  }
}
</style>
