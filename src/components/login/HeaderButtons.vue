<!--
📌 HeaderButtons.vue (ejemplo de nombre)
Contenedor de botones en el encabezado del login.

✔ Funcionalidad actual:
  - El template no tiene botones (se eliminaron a tu solicitud).
  - Solo queda el contenedor `.header-buttons` con estilos que lo posicionan,
    por si más adelante quieres volver a poner botones (ej: iniciar sesión,
    recuperar contraseña, etc.).

💡 Ubicación recomendada:
  - Dado que es un fragmento específico de la pantalla de **login**,
    está bien en `src/components/login/HeaderButtons.vue`.
  - Alternativas:
      • Si es algo muy pequeño/reutilizable → `src/components/ui/`
      • Si es exclusivo del login → `src/components/login/`

👉 Como ahora no tiene botones, su uso es decorativo/estructural.
-->

<template>
  <div class="header-buttons">
    <!-- Los botones han sido eliminados según tu solicitud -->
  </div>
</template>

<script setup lang="ts">
/* No hay lógica reactiva ni props porque no hay botones */
</script>

<style scoped>
/* Contenedor del header */
.header-buttons {
  position: absolute;
  top: 1.8rem;
  right: 2rem;
  display: flex;             /* Mantiene la estructura flex por si vuelven botones */
  gap: 1.2rem;               /* Espaciado entre botones */
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  padding: 0 0.5rem;
  box-sizing: border-box;
  z-index: 10;

  /* Como no hay botones, lo "apagamos" */
  width: 0;
  height: 0;
  overflow: hidden;
}

/* 🔎 Media queries: ajustan la posición si en el futuro vuelves a tener botones */
@media (min-width: 1200px) {
  .header-buttons {
    top: 2rem;
    right: 3rem;
    gap: 1.5rem;
  }
}

@media (max-width: 1024px) {
  .header-buttons {
    top: 1.5rem;
    right: 1.5rem;
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .header-buttons {
    flex-direction: column;
    top: 1rem;
    right: 1rem;
    gap: 0.8rem;
    align-items: flex-end;
  }
}

@media (max-width: 480px) {
  .header-buttons {
    top: 0.8rem;
    right: 0.8rem;
    gap: 0.6rem;
  }
}
</style>
