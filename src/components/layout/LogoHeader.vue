<!--
📌 LogoHeader.vue
Componente responsive para mostrar el nombre de la página

✅ Responsive optimizado:
   - Desktop (>1024px): Texto grande
   - Tablet (480-1024px): Texto mediano
   - Móvil (<480px): Texto compacto
   - Pantallas bajas (<640px): Sin scroll, espaciado compacto

💡 Ubicación: src/components/layout/LogoHeader.vue
-->

<template>
  <div class="logo-header">
    <!-- Título de la página -->
    <h1 class="page-name">{{ pageName }}</h1>
  </div>
</template>

<script setup lang="ts">
interface Props {
  pageName?: string
}

const props = withDefaults(defineProps<Props>(), {
  pageName: 'ACTIVA MARKETING',
})

const { pageName } = props
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
  padding: clamp(60px, 12vh, 120px) clamp(12px, 3vw, 24px) clamp(20px, 4vh, 40px);
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
  font-size: clamp(1.8rem, 4vw + .8rem, 3rem);
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
  .logo-header {
    padding: clamp(50px, 10vh, 100px) clamp(12px, 3vw, 24px) clamp(18px, 3.5vh, 35px);
  }

  .page-name {
    font-size: clamp(2rem, 3.5vw, 2.5rem);
  }
}

/* ========= DESKTOP (>1024px) ========= */
@media (min-width: 1025px) {
  .logo-header {
    padding: clamp(70px, 13vh, 130px) 24px clamp(25px, 5vh, 45px);
  }

  .page-name {
    font-size: clamp(2.2rem, 3.2vw, 3rem);
    letter-spacing: .5px;
  }
}

/* ========= MÓVIL PEQUEÑO (<480px) ========= */
@media (max-width: 480px) {
  .logo-header {
    padding: clamp(45px, 9vh, 90px) 8px clamp(15px, 3vh, 30px);
  }

  .page-name {
    font-size: clamp(1.5rem, 5vw, 1.8rem);
    padding: 0 8px;
    line-height: 1.25;
    letter-spacing: .2px;
  }
}

/* ========= PANTALLAS MUY BAJAS (Evita scroll) ========= */
@media (max-height: 640px) {
  .logo-header {
    padding: clamp(25px, 5vh, 50px) 8px clamp(12px, 2.5vh, 20px);
  }

  .page-name {
    font-size: clamp(1.2rem, 4vw, 1.4rem);
    line-height: 1.15;
  }
}

/* ========= PANTALLAS EXTREMADAMENTE BAJAS ========= */
@media (max-height: 560px) {
  .logo-header {
    padding: clamp(18px, 4vh, 35px) 8px clamp(8px, 1.5vh, 15px);
  }

  .page-name {
    font-size: clamp(1rem, 3.5vw, 1.2rem);
  }
}

/* ========= LANDSCAPE MÓVIL ========= */
@media (max-width: 812px) and (max-height: 480px) and (orientation: landscape) {
  .logo-header {
    padding: clamp(20px, 5vh, 40px) 12px clamp(8px, 2vh, 15px);
  }

  .page-name {
    font-size: clamp(1.1rem, 3.5vh, 1.3rem);
  }
}
</style>
