/**
 * 📌 useAvisos
 * - Composable para manejar avisos tipo snackbar (notificaciones flotantes).
 * - Contiene un estado reactivo "snackbar" con:
 *    • show    → controla si se muestra o no.
 *    • message → texto del aviso.
 *    • color   → tipo de aviso (info, success, warning, error).
 *    • timeout → duración en milisegundos antes de cerrarse solo.
 * - Expone la función mostrarAviso() para activar un nuevo aviso fácilmente.
 * - Se usa junto al componente NotificacionSnack.vue en las vistas.
 */

import { ref } from 'vue'

export function useAvisos() {
  // Estado reactivo del snackbar (por defecto oculto)
  const snackbar = ref({
    show: false,
    message: '',
    color: 'info',
    timeout: 4000,
  })

  /**
   * 📌 mostrarAviso
   * - Muestra un snackbar con el mensaje indicado.
   * - Parámetros:
   *    message → texto que se mostrará.
   *    color   → tipo de aviso (por defecto 'info').
   *    timeout → duración en ms antes de cerrarse (por defecto 4000).
   */
  function mostrarAviso(
    message: string,
    color: 'info' | 'success' | 'warning' | 'error' = 'info',
    timeout = 4000
  ) {
    snackbar.value = { show: true, message, color, timeout }
  }

  // Retornamos el estado y la función para usar en las vistas
  return { snackbar, mostrarAviso }
}
