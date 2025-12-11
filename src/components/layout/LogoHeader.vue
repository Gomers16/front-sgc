<!--
📌 LogoHeader.vue
Componente responsive para mostrar logos (CDA del Centro y Activautos) + nombre de página

✅ Responsive optimizado:
   - Desktop (>1024px): Logos grandes, texto grande
   - Tablet (480-1024px): Logos medianos, texto mediano
   - Móvil (<480px): Logos pequeños pero legibles, texto compacto
   - Pantallas bajas (<640px): Sin scroll, espaciado compacto

💡 Ubicación: src/components/layout/LogoHeader.vue
-->

<template>
  <div class="logo-header">
    <!-- Grupo de logos horizontales -->
    <div class="logo-group">
      <img :src="cdaLogoSrc" alt="CDA del Centro" class="logo cda-logo" />
      <img :src="activautosLogoSrc" alt="Activautos" class="logo activautos-logo" />
    </div>

    <!-- Título de la página -->
    <h1 class="page-name">{{ pageName }}</h1>
  </div>
</template>

<script setup lang="ts">
import cdaDefault from '@/assets/cda-centro-logo-amarillo.png'
import activautosDefault from '@/assets/activautos-logo.png'

interface Props {
  cdaLogoSrc?: string
  activautosLogoSrc?: string
  pageName?: string
}

const props = withDefaults(defineProps<Props>(), {
  cdaLogoSrc: cdaDefault,
  activautosLogoSrc: activautosDefault,
  pageName: 'ACTIVAUTOS CDA DEL CENTRO IBAGUÉ',
})

const { cdaLogoSrc, activautosLogoSrc, pageName } = props
</script>

<style scoped>
/* ========= CONTENEDOR PRINCIPAL ========= */
.logo-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;
  padding: clamp(12px, 3vh, 28px) clamp(12px, 3vw, 24px);
}

/* ========= GRUPO DE LOGOS ========= */
.logo-group {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: clamp(12px, 3vw, 32px);
  margin-bottom: clamp(10px, 2.5vh, 24px);
}

/* ========= LOGOS RESPONSIVE ========= */
.logo {
  display: block;
  height: clamp(70px, 11vw, 140px);
  width: auto;
  max-width: 45vw;
  object-fit: contain;
  image-rendering: -webkit-optimize-contrast;
  filter: drop-shadow(0 3px 8px rgba(0,0,0,.3));
  transition: transform .2s ease;
}

.logo:hover {
  transform: scale(1.03);
}

/* ========= TÍTULO RESPONSIVE ========= */
.page-name {
  text-align: center;
  color: #fff;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: .3px;
  margin: 0;
  padding: 0 clamp(12px, 4vw, 24px);
  box-sizing: border-box;
  font-size: clamp(1.15rem, 3vw + .5rem, 2rem);
  text-shadow: 0 3px 10px rgba(0,0,0,.4), 0 1px 3px rgba(0,0,0,.3);
  max-width: 100%;
  word-wrap: break-word;
  hyphens: auto;
}

/* Balance de texto si está disponible */
@supports (text-wrap: balance) {
  .page-name {
    text-wrap: balance;
  }
}

/* ========= TABLET (481px - 1024px) ========= */
@media (min-width: 481px) and (max-width: 1024px) {
  .logo {
    height: clamp(90px, 10vw, 120px);
  }

  .page-name {
    font-size: clamp(1.35rem, 2.8vw, 1.85rem);
  }
}

/* ========= DESKTOP (>1024px) ========= */
@media (min-width: 1025px) {
  .logo-header {
    padding: clamp(20px, 3.5vh, 36px) 24px;
  }

  .logo {
    height: clamp(110px, 9vw, 140px);
  }

  .logo-group {
    gap: clamp(28px, 3.5vw, 48px);
    margin-bottom: clamp(16px, 2.8vh, 28px);
  }

  .page-name {
    font-size: clamp(1.65rem, 2.4vw, 2rem);
    letter-spacing: .5px;
  }
}

/* ========= MÓVIL PEQUEÑO (<480px) ========= */
@media (max-width: 480px) {
  .logo-header {
    padding: 10px 8px;
  }

  .logo {
    height: clamp(60px, 14vw, 80px);
    max-width: 42vw;
  }

  .logo-group {
    gap: 10px;
    margin-bottom: 8px;
  }

  .page-name {
    font-size: clamp(1rem, 4.5vw, 1.25rem);
    padding: 0 8px;
    line-height: 1.25;
    letter-spacing: .2px;
  }
}

/* ========= PANTALLAS MUY BAJAS (Evita scroll) ========= */
@media (max-height: 640px) {
  .logo-header {
    padding: 8px 8px 6px;
  }

  .logo {
    height: clamp(50px, 10vh, 70px);
  }

  .logo-group {
    gap: 8px;
    margin-bottom: 6px;
  }

  .page-name {
    font-size: clamp(.95rem, 3.5vw, 1.15rem);
    line-height: 1.15;
  }
}

/* ========= PANTALLAS EXTREMADAMENTE BAJAS ========= */
@media (max-height: 560px) {
  .logo-header {
    padding: 6px 8px 4px;
  }

  .logo {
    height: clamp(45px, 9vh, 60px);
  }

  .logo-group {
    margin-bottom: 4px;
  }

  .page-name {
    font-size: clamp(.9rem, 3vw, 1rem);
  }
}

/* ========= LANDSCAPE MÓVIL ========= */
@media (max-width: 812px) and (max-height: 480px) and (orientation: landscape) {
  .logo-header {
    padding: 6px 12px;
  }

  .logo-group {
    gap: 12px;
    margin-bottom: 4px;
  }

  .logo {
    height: clamp(40px, 11vh, 60px);
  }

  .page-name {
    font-size: clamp(.9rem, 3vh, 1.1rem);
  }
}
</style>
