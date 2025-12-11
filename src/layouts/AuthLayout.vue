<!--
📌 AuthLayout.vue
Layout principal para pantallas de autenticación (Login, Reset Password, etc.)

✅ Características responsive:
   - Desktop (>1024px): Espaciado amplio, card centrado
   - Tablet (480-1024px): Espaciado medio, adaptado
   - Móvil (<480px): Compacto, sin scroll horizontal
   - Pantallas bajas: Ajuste automático para evitar scroll vertical

💡 Estructura:
   - Header con logos
   - Main centrado (router-view)
   - Footer sticky al fondo

💡 Ubicación: src/layouts/AuthLayout.vue
-->

<template>
  <div class="auth-layout">
    <!-- Header con logos -->
    <HeaderButtons />
    <LogoHeader
      :cdaLogoSrc="cdaLogoSrc"
      :activautosLogoSrc="activautosLogoSrc"
      :pageName="pageName"
    />

    <!-- Contenido principal (Login, Reset, etc.) -->
    <main class="auth-main">
      <router-view />
    </main>

    <!-- Footer pegado al fondo -->
    <footer class="auth-footer">
      <p>© 2025 {{ footerText }}</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import HeaderButtons from '@/components/login/HeaderButtons.vue'
import LogoHeader from '@/components/layout/LogoHeader.vue'

interface Props {
  cdaLogoSrc?: string
  activautosLogoSrc?: string
  pageName?: string
  footerText?: string
}

withDefaults(defineProps<Props>(), {
  pageName: 'ACTIVAUTOS CDA DEL CENTRO IBAGUÉ',
  footerText: 'ACTIVAUTOS CDA DEL CENTRO IBAGUÉ. Todos los derechos reservados.'
})
</script>

<style scoped>
/* ========= LAYOUT PRINCIPAL ========= */
.auth-layout {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
  background: linear-gradient(135deg, #1a3a7d 0%, #21478d 50%, #2855a8 100%);
  padding: 0 clamp(12px, 3vw, 32px);
}

/* Soporte para navegadores sin dvh */
@supports not (height: 1dvh) {
  .auth-layout {
    min-height: 100vh;
  }
}

/* Usa svh si está disponible (mejor para móvil) */
@supports (height: 1svh) {
  .auth-layout {
    min-height: 100svh;
  }
}

/* ========= MAIN CENTRADO ========= */
.auth-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: clamp(16px, 4vh, 48px) 0;
  box-sizing: border-box;
}

/* ========= FOOTER ========= */
.auth-footer {
  margin-top: auto;
  text-align: center;
  color: rgba(255, 255, 255, 0.92);
  font-size: clamp(11px, 1.8vw, 13px);
  font-weight: 500;
  padding: clamp(8px, 1.5vh, 14px) 12px;
  padding-bottom: max(10px, env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
  text-shadow: 0 1px 3px rgba(0,0,0,.3);
}

.auth-footer p {
  margin: 0;
  line-height: 1.4;
}

/* ========= CONTROL DEL AUTH-CARD (LoginForm) ========= */
:deep(.auth-card) {
  width: min(100%, 520px);
  margin: 0 auto;
}

/* ========= DESKTOP (>1024px) ========= */
@media (min-width: 1025px) {
  .auth-layout {
    padding: 0 clamp(32px, 4vw, 64px);
  }

  .auth-main {
    padding: clamp(32px, 5vh, 64px) 0;
  }

  .auth-footer {
    font-size: 13px;
    padding: 14px 16px;
  }

  :deep(.auth-card) {
    width: min(100%, 540px);
  }
}

/* ========= TABLET (481px - 1024px) ========= */
@media (min-width: 481px) and (max-width: 1024px) {
  .auth-layout {
    padding: 0 clamp(20px, 3.5vw, 40px);
  }

  .auth-main {
    padding: clamp(24px, 4.5vh, 56px) 0;
  }

  .auth-footer {
    font-size: 12px;
  }

  :deep(.auth-card) {
    width: min(100%, 480px);
  }
}

/* ========= MÓVIL (<480px) ========= */
@media (max-width: 480px) {
  .auth-layout {
    padding: 0 12px;
  }

  .auth-main {
    padding: 16px 0;
  }

  .auth-footer {
    font-size: 11px;
    padding: 8px 8px;
    padding-bottom: max(8px, env(safe-area-inset-bottom, 0px));
  }

  :deep(.auth-card) {
    width: 100%;
  }
}

/* ========= PANTALLAS BAJAS - Evita Scroll ========= */
@media (max-height: 720px) {
  .auth-main {
    padding: clamp(12px, 2.5vh, 24px) 0;
  }

  .auth-footer {
    font-size: 11px;
    padding: 6px 8px;
  }
}

@media (max-height: 640px) {
  .auth-main {
    padding: clamp(8px, 1.8vh, 16px) 0;
  }

  .auth-footer {
    font-size: 10px;
    padding: 4px 8px;
  }
}

@media (max-height: 560px) {
  .auth-main {
    padding: 6px 0;
  }

  .auth-footer {
    display: none; /* Oculta footer en pantallas muy bajas */
  }
}

/* ========= LANDSCAPE MÓVIL ========= */
@media (max-width: 812px) and (max-height: 480px) and (orientation: landscape) {
  .auth-layout {
    padding: 0 16px;
  }

  .auth-main {
    padding: 8px 0;
  }

  .auth-footer {
    font-size: 10px;
    padding: 4px 8px;
  }
}

/* ========= MODO OSCURO (OPCIONAL) ========= */
@media (prefers-color-scheme: dark) {
  .auth-layout {
    background: linear-gradient(135deg, #0f1f4a 0%, #1a3a7d 50%, #21478d 100%);
  }
}

/* ========= REDUCCIÓN DE MOVIMIENTO ========= */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
