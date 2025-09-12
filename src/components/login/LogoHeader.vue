<!--
📌 LogoHeader.vue
Componente para mostrar los **logos principales** (CDA del Centro y Activautos)
junto con el **nombre de la página o razón social**.

✔ Props configurables:
   - cdaLogoSrc        → ruta personalizada del logo CDA (default: asset local)
   - activautosLogoSrc → ruta personalizada del logo Activautos (default: asset local)
   - pageName          → texto del título/nombre que se muestra debajo de los logos

✔ Comportamiento:
   - Si no se pasan props, se usan los logos por defecto de /assets
   - Centra logos y texto en columna
   - Usa estilos responsivos con `clamp()` para que los logos nunca se vean demasiado pequeños

💡 Ubicación recomendada:
   src/components/layout/LogoHeader.vue
   (porque es algo de estructura visual global, usado en login o pantallas principales)
-->

<template>
  <div class="logo-header">
    <!-- Grupo de logos, mostrados uno al lado del otro -->
    <div class="logo-group">
      <img :src="cdaLogoSrc" alt="CDA del Centro" class="logo cda-logo" />
      <img :src="activautosLogoSrc" alt="Activautos" class="logo activautos-logo" />
    </div>

    <!-- Nombre de la página o empresa -->
    <h1 class="page-name">{{ pageName }}</h1>
  </div>
</template>

<script setup lang="ts">
/* Importa logos por defecto desde assets */
import cdaDefault from '@/assets/cda-centro-logo-amarillo.png'
import activautosDefault from '@/assets/activautos-logo.png'

/**
 * Props del componente
 * - Si se pasan rutas personalizadas, las usa.
 * - Si no, usa los imports por defecto.
 */
interface Props {
  cdaLogoSrc?: string
  activautosLogoSrc?: string
  pageName?: string
}

/* withDefaults → define valores por defecto de las props */
const props = withDefaults(defineProps<Props>(), {
  cdaLogoSrc: cdaDefault,
  activautosLogoSrc: activautosDefault,
  pageName: 'ACTIVAUTOS CDA DEL CENTRO IBAGUÉ',
})

/* Exponer variables a la plantilla */
const { cdaLogoSrc, activautosLogoSrc, pageName } = props
</script>

<style scoped>
/* Contenedor principal (logos + nombre) */
.logo-header {
  display: flex;
  flex-direction: column;    /* Logos y título uno debajo del otro */
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  padding-top: clamp(0.8rem, 3.2vh, 2.2rem);
  padding-bottom: clamp(0.8rem, 2.6vh, 2rem);
}

/* Grupo de logos alineados horizontalmente */
.logo-group {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;           /* Si hay poco espacio, los logos saltan a la siguiente línea */
  gap: clamp(0.75rem, 3.2vw, 2.2rem);
  margin-bottom: clamp(0.8rem, 2.5vh, 1.8rem);
}

/* Estilo común para ambos logos */
.logo {
  display: block;
  height: clamp(84px, 12vw, 160px); /* Responsivo: nunca más chico que 84px ni más grande que 160px */
  width: auto;
  object-fit: contain;
  image-rendering: -webkit-optimize-contrast; /* Mejora la nitidez */
}

/* Texto del nombre de la página/empresa */
.page-name {
  text-align: center;
  color: #fff;
  font-weight: 800;
  line-height: 1.15;
  margin: 0;
  padding: 0 1rem;
  box-sizing: border-box;
  font-size: clamp(1.25rem, 3.2vw, 2.2rem); /* Escala entre 1.25rem y 2.2rem */
  text-shadow: 2px 2px 5px rgba(0,0,0,.35); /* Efecto para resaltar sobre fondos */
  max-width: 95%;
  word-wrap: break-word;
}

/* Si el navegador soporta text-wrap balance, equilibra el texto */
@supports (text-wrap: balance) {
  .page-name { text-wrap: balance; }
}
</style>
