<!--
📌 HeaderButtons.vue
Contenedor preparado para botones del header (actualmente vacío)

✅ Características:
   - Posicionamiento absoluto responsive
   - Preparado para agregar botones en el futuro
   - Se adapta a móvil, tablet y desktop
   - Actualmente oculto pero con estructura lista

💡 Ubicación: src/components/login/HeaderButtons.vue
-->

<template>
  <div class="header-buttons">
    <!-- Botones eliminados - estructura lista para el futuro -->
  </div>
</template>

<script setup lang="ts">
// Sin lógica porque no hay botones actualmente
</script>

<style scoped>
/* ========= CONTENEDOR (ACTUALMENTE OCULTO) ========= */
.header-buttons {
  position: absolute;
  top: clamp(12px, 2vh, 24px);
  right: clamp(12px, 3vw, 32px);
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: clamp(8px, 1.5vw, 16px);
  padding: 0;
  box-sizing: border-box;
  z-index: 10;

  /* Oculto porque no hay botones */
  width: 0;
  height: 0;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}

/* ========= CUANDO SE AGREGUEN BOTONES, ELIMINAR ESTAS LÍNEAS: ========= */
/*
  width: 0;
  height: 0;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
*/

/* ========= DESKTOP (>1024px) ========= */
@media (min-width: 1025px) {
  .header-buttons {
    top: clamp(20px, 2.5vh, 32px);
    right: clamp(24px, 3.5vw, 48px);
    gap: 18px;
  }
}

/* ========= TABLET (481px - 1024px) ========= */
@media (min-width: 481px) and (max-width: 1024px) {
  .header-buttons {
    top: clamp(16px, 2vh, 24px);
    right: clamp(16px, 3vw, 32px);
    gap: 12px;
  }
}

/* ========= MÓVIL (<480px) ========= */
@media (max-width: 480px) {
  .header-buttons {
    flex-direction: column;
    top: 12px;
    right: 12px;
    gap: 8px;
    align-items: flex-end;
  }
}

/* ========= PANTALLAS BAJAS ========= */
@media (max-height: 640px) {
  .header-buttons {
    top: 8px;
    right: 12px;
    gap: 6px;
  }
}

/* ========= LANDSCAPE MÓVIL ========= */
@media (max-width: 812px) and (max-height: 480px) and (orientation: landscape) {
  .header-buttons {
    top: 6px;
    right: 12px;
    flex-direction: row;
  }
}
</style>
