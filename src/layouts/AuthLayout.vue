<template>
  <div class="auth-layout">
    <!-- Header (queda arriba y se adapta) -->
    <HeaderButtons />
    <LogoHeader logoSrc="/activaautos-logo.png" pageName="ACTIVAUTOS CDA DEL CENTRO IBAGUÉ" />

    <!-- Contenido centrado (aquí vive Login.vue) -->
    <main class="auth-main">
      <!-- OPCIONAL: si tu Login.vue envuelve el formulario en un div con class="auth-card",
           estas reglas le darán ancho máximo fluido -->
      <router-view />
    </main>

    <!-- Footer pegado abajo cuando hay poco contenido -->
    <footer class="auth-footer">
      <p>© 2025 ACTIVAUTOS CDA DEL CENTRO IBAGUÉ. Todos los derechos reservados.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import HeaderButtons from '@/components/login/HeaderButtons.vue'
import LogoHeader from '@/components/login/LogoHeader.vue'
</script>

<style scoped>
/* Fondo a nivel de layout (sin <div> extra ni z-index negativos) */
.auth-layout {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;          /* mejor que 100vh en móviles */
  width: 100%;                 /* evita 100vw (scroll horizontal) */
  overflow-x: hidden;
  background: #21478d;
  /* Espaciado vertical fluido para respiración general del layout */
  padding-inline: clamp(12px, 4vw, 32px);
}

/* Zona central: centra el contenido vertical/horizontal y da respiro */
.auth-main {
  flex: 1;
  display: grid;
  place-items: center;
  padding-block: clamp(16px, 5vh, 48px);
  padding-inline: 0; /* ya agregamos padding-inline en .auth-layout */
}

/* Footer sticky (sin position:absolute); usa safe-area en iOS */
.auth-footer {
  margin-top: auto;
  text-align: center;
  color: #fff;
  font-size: clamp(12px, 1.6vw, 14px);
  padding-block: 10px;
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 10px);
}

/* --- Helpers para que el formulario no sea gigante en pantallas anchas --- */
/* Aplica si en tu Login.vue envuelves el card/contenedor con class="auth-card" */
:deep(.auth-card) {
  width: min(100%, 440px);      /* límite superior cómodo en desktop */
  margin-inline: auto;
}

/* Títulos fluidos (si LogoHeader no los controla internamente) */
:deep(.auth-title) {
  font-size: clamp(20px, 3.2vw, 34px);
}

/* Ajustes en pantallas muy pequeñas */
@media (max-width: 480px) {
  .auth-layout {
    padding-inline: 12px;
  }
}
/* Asegura altura exacta del viewport (sin barras de navegador) */
.auth-layout{
  min-height: 100dvh;
}
@supports (height: 1svh){
  .auth-layout{ min-height: 100svh; }
}

/* Compacto en pantallas angostas o de poca altura */
@media (max-width: 480px), (max-height: 720px){
  .auth-main{ padding-block: clamp(8px, 2vh, 16px); }
  .auth-footer{ font-size: 11px; padding-block: 6px; }
}

/* Súper compacto (para que NO haya scroll) */
@media (max-height: 640px){
  .auth-main{ padding-block: 6px; }
  .auth-footer{ padding-block: 4px; font-size: 10px; }
}
</style>

