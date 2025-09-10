<!-- src/components/LogoHeader.vue -->
<template>
  <div class="logo-header">
    <div class="logo-group">
      <img :src="cdaLogoSrc" alt="CDA del Centro" class="logo cda-logo" />
      <img :src="activautosLogoSrc" alt="Activautos" class="logo activautos-logo" />
    </div>
    <h1 class="page-name">{{ pageName }}</h1>
  </div>
</template>

<script setup lang="ts">
/* Importa los archivos reales desde src/assets */
import cdaDefault from '@/assets/cda-centro-logo-amarillo.png'
import activautosDefault from '@/assets/activautos-logo.png'

interface Props {
  /** Si pasas rutas personalizadas, usarán esas; si no, usan los imports */
  cdaLogoSrc?: string
  activautosLogoSrc?: string
  pageName?: string
}

const props = withDefaults(defineProps<Props>(), {
  cdaLogoSrc: cdaDefault,
  activautosLogoSrc: activautosDefault,
  pageName: 'ACTIVAUTOS CDA DEL CENTRO IBAGUÉ',
})

/* Exponer a la plantilla */
const { cdaLogoSrc, activautosLogoSrc, pageName } = props
</script>

<style scoped>
.logo-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  padding-top: clamp(0.8rem, 3.2vh, 2.2rem);
  padding-bottom: clamp(0.8rem, 2.6vh, 2rem);
}

.logo-group {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: clamp(0.75rem, 3.2vw, 2.2rem);
  margin-bottom: clamp(0.8rem, 2.5vh, 1.8rem);
}

.logo {
  display: block;
  height: clamp(84px, 12vw, 160px); /* ↑ un poco más grande para que NUNCA se vean diminutos */
  width: auto;
  object-fit: contain;
  image-rendering: -webkit-optimize-contrast;
}

.page-name {
  text-align: center;
  color: #fff;
  font-weight: 800;
  line-height: 1.15;
  margin: 0;
  padding: 0 1rem;
  box-sizing: border-box;
  font-size: clamp(1.25rem, 3.2vw, 2.2rem);
  text-shadow: 2px 2px 5px rgba(0,0,0,.35);
  max-width: 95%;
  word-wrap: break-word;
}

@supports (text-wrap: balance) {
  .page-name { text-wrap: balance; }
}
</style>
