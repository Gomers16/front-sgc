<template>
  <div class="logo-header">
    <div class="logo-group">
      <!-- Los logos de la empresa -->
      <img src="/src/assets/cda-centro-logo-amarillo.png" alt="Logo CDA" class="logo cda-logo" />
      <img src="/src/assets/activautos-logo.png" alt="Logo Activautos" class="logo activautos-logo" />
    </div>

    <!-- El nombre de la página o título principal -->
    <h1 class="page-name">ACTIVAUTOS CDA DEL CENTRO IBAGUÉ</h1>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.logo-header {
  display: flex;
  flex-direction: column; /* Apila el grupo de logos y el nombre de la página */
  align-items: center; /* Centra horizontalmente los elementos hijos */
  justify-content: flex-start; /* Alinea el contenido al inicio del contenedor */
  width: 100%; /* Ocupa todo el ancho disponible */
  /* Reducimos el padding-top para subir el contenido */
  padding: 1.5rem 1rem 2rem; /* Menos padding-top para subirlo */
  box-sizing: border-box; /* Incluye padding en el ancho/alto total */
  min-height: 200px; /* Altura mínima base ajustada */
}

.logo-group {
  display: flex; /* Muestra los logos en fila */
  gap: 2.5rem; /* Espacio entre los logos */
  align-items: center; /* Alinea los logos verticalmente */
  margin-bottom: 2.5rem; /* Espacio entre el grupo de logos y el título */
  flex-wrap: wrap; /* Permite que los logos salten de línea en pantallas pequeñas */
  justify-content: center; /* Centra los logos horizontalmente dentro del grupo */
  width: 100%; /* Ocupa el 100% del ancho del contenedor padre */
}

.logo {
  /* Hacemos los logos más grandes en todas las resoluciones */
  max-height: 140px; /* Altura máxima base para los logos */
  width: auto; /* Mantiene la proporción de la imagen */
  object-fit: contain; /* Asegura que la imagen se ajuste sin recortarse */
}

/* Ajustes específicos para cada logo si es necesario */
.cda-logo {
  /* max-height: 130px; */
}

.activautos-logo {
  /* max-height: 150px; */
}

.page-name {
  text-align: center;
  /* Usamos clamp para un tamaño de fuente responsivo:
     - 1.8rem: tamaño mínimo (un poco más pequeño)
     - 3.8vw: tamaño que escala con el viewport (ajustado)
     - 2.8rem: tamaño máximo (un poco más pequeño)
  */
  font-size: clamp(1.8rem, 3.8vw, 2.8rem);
  font-weight: bold;
  color: white;
  text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.4);
  margin-top: 0; /* Elimina el margin-top fijo */
  padding: 0 1.5rem; /* Padding horizontal */
  box-sizing: border-box;
  word-wrap: break-word; /* Permite que el texto largo se rompa en varias líneas */
  max-width: 95%; /* Limita el ancho del texto */
}

/* Media Query para pantallas grandes (ej. escritorios de 1200px en adelante) */
@media (min-width: 1200px) {
  .logo-header {
    padding: 2.5rem 1rem 2.5rem; /* Ajustamos el padding-top para PC, subiéndolo */
    min-height: 250px; /* Ajustamos la altura mínima para PC */
  }
  .logo-group {
    gap: 2.5rem; /* Espacio entre logos en PC */
    margin-bottom: 2.5rem;
  }
  .logo {
    max-height: 150px; /* Logos ajustados para PC */
  }
  .page-name {
    font-size: clamp(2.2rem, 3.2vw, 3.2rem); /* Título ajustado para PC */
  }
}


/* Media Query para tabletas (ej. iPad Pro, entre 768px y 1024px) */
@media (max-width: 1024px) {
  .logo-header {
    padding: 2rem 1rem 2rem; /* Ajuste de padding-top para tabletas */
    min-height: 200px; /* Ajusta la altura mínima para tabletas */
  }

  .logo-group {
    gap: 1.8rem; /* Reduce el espacio entre logos en tabletas */
    margin-bottom: 1.8rem; /* Reduce el margen inferior */
  }

  .logo {
    max-height: 110px; /* Aumenta el tamaño de los logos en tabletas */
  }

  .page-name {
    font-size: clamp(1.6rem, 4vw, 2.8rem); /* Ajusta el tamaño de fuente para tabletas */
  }
}

/* Media Query para pantallas pequeñas (ej. móviles, hasta 768px) */
@media (max-width: 768px) {
  .logo-header {
    padding: 1.5rem 0.5rem 1.5rem; /* Reduce el padding general del encabezado */
    min-height: 160px; /* Ajusta la altura mínima para móviles */
  }

  .logo-group {
    gap: 1rem; /* Reduce el espacio entre logos en móviles */
    margin-bottom: 1rem; /* Reduce el margen inferior */
  }

  .logo {
    max-height: 80px; /* Aumenta el tamaño de los logos en móviles */
  }

  .page-name {
    font-size: clamp(1.4rem, 5vw, 2.2rem); /* Ajusta el tamaño de fuente para móviles */
  }
}

/* Media Query para pantallas muy pequeñas (ej. smartphones pequeños, hasta 480px) */
@media (max-width: 480px) {
  .logo {
    max-height: 70px; /* Logos un poco más grandes en pantallas muy pequeñas */
  }

  .page-name {
    font-size: clamp(1.2rem, 7vw, 2rem); /* Ajuste adicional del tamaño de fuente */
  }
}
</style>
