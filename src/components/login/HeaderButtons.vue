<template>
  <div class="header-buttons">
    <!-- Los botones han sido eliminados según tu solicitud -->
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.header-buttons {
  /* Mantenemos el contenedor, pero sin contenido visible */
  position: absolute;
  top: 1.8rem;
  right: 2rem;
  display: flex; /* Mantenemos flex para la estructura si se añadieran otros elementos */
  gap: 1.2rem;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  padding: 0 0.5rem;
  box-sizing: border-box;
  z-index: 10;
  /* Puedes ajustar estas propiedades si necesitas que el contenedor ocupe menos espacio */
  width: 0; /* Reducimos el ancho si no hay botones */
  height: 0; /* Reducimos la altura si no hay botones */
  overflow: hidden; /* Ocultamos cualquier posible contenido residual */
}

/* Los estilos para .btn, .login-button, .forgot-password-button y .active han sido eliminados
   ya que los botones no están presentes en el template. */

/* Media Queries también se han ajustado o eliminado si no son relevantes sin los botones */
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
