// src/composables/contratos/useAlerts.ts
/**
 * useAlerts
 * -------------------------------------------------------
 * Centraliza UI de feedback:
 * - Diálogo simple de alerta (showAlertDialog, título, mensaje, showAlert)
 * - Snackbar (snackbar state y notify)
 *
 * Mantiene exactamente los mismos nombres usados en la vista
 * para no romper el template ni el script.
 */
import { ref } from 'vue'

export function useAlerts() {
  const showAlertDialog = ref(false)
  const alertDialogTitle = ref('')
  const alertDialogMessage = ref('')

  function showAlert(title: string, message: string) {
    alertDialogTitle.value = title
    alertDialogMessage.value = message
    showAlertDialog.value = true
  }

  const snackbar = ref({
    show: false,
    text: '',
    color: 'success' as 'success' | 'error' | 'warning' | 'info',
    timeout: 1800,
  })

  function notify(
    text: string,
    color: 'success' | 'error' | 'warning' | 'info' = 'success'
  ) {
    snackbar.value = { show: true, text, color, timeout: 1800 }
  }

  return {
    showAlertDialog,
    alertDialogTitle,
    alertDialogMessage,
    showAlert,
    snackbar,
    notify,
  }
}
