<template>
  <v-container class="mt-6">
    <v-card elevation="8" class="pa-8 rounded-xl border-spacing-2">
      <v-card-title class="text-h4 mb-6 text-center text-primary font-weight-bold">
        Crear Turno RTM <span class="text-secondary">- Turno #{{ turnoNumero || '...' }}</span>
      </v-card-title>

      <v-form ref="formRef" @submit.prevent="openConfirmDialog">
        <v-row dense>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.fecha"
              label="Fecha"
              variant="outlined"
              readonly
              density="comfortable"
              prepend-inner-icon="mdi-calendar"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.horaIngreso"
              label="Hora de Ingreso"
              variant="outlined"
              readonly
              density="comfortable"
              prepend-inner-icon="mdi-clock-time-four-outline"
            />
          </v-col>

          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.placa"
              label="Placa del Vehículo"
              variant="outlined"
              required
              density="comfortable"
              prepend-inner-icon="mdi-car-info"
              :rules="[v => !!v || 'La placa es requerida']"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-select
              v-model="form.tipoVehiculo"
              :items="['vehiculo', 'moto']"
              label="Tipo de Vehículo"
              variant="outlined"
              required
              density="comfortable"
              prepend-inner-icon="mdi-car-multiple"
              :rules="[v => !!v || 'El tipo de vehículo es requerido']"
            />
          </v-col>

          <v-col cols="12" sm="6">
            <v-select
              v-model="form.medioEntero"
              :items="[ // MODIFICACIÓN CLAVE 1: Añadir 'convenio'
                { title: 'Fachada', value: 'fachada' },
                { title: 'Redes Sociales', value: 'redes' },
                { title: 'Telemercadeo', value: 'telemercadeo' },
                { title: 'Otros', value: 'otros' },
                { title: 'Convenio', value: 'convenio' },
              ]"
              label="¿Cómo se enteró de nosotros?"
              variant="outlined"
              required
              density="comfortable"
              prepend-inner-icon="mdi-account-question"
              :rules="[v => !!v || 'Este campo es requerido']"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-radio-group
              v-model="form.tieneCita"
              label="¿Tiene cita previa?"
              row
              density="comfortable"
              :rules="[v => v !== null || 'Seleccione una opción']"
            >
              <v-radio label="Sí" :value="true" color="primary"></v-radio>
              <v-radio label="No" :value="false" color="error"></v-radio>
            </v-radio-group>
          </v-col>

          <v-col cols="12" sm="4" v-if="form.medioEntero === 'convenio'">
            <v-text-field
              v-model="form.convenio"
              label="Convenio (opcional)"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-handshake"
            />
          </v-col>
          <v-col cols="12" sm="4" v-if="form.medioEntero === 'convenio'">
            <v-text-field
              v-model="form.referidoInterno"
              label="Referido Interno (opcional)"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-account-tie"
            />
          </v-col>
          <v-col cols="12" sm="4" v-if="form.medioEntero === 'convenio'">
            <v-text-field
              v-model="form.referidoExterno"
              label="Referido Externo (opcional)"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-account-group"
            />
          </v-col>

          <v-col cols="12">
            <v-textarea
              v-model="form.observaciones"
              label="Observaciones (opcional)"
              rows="3"
              auto-grow
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-comment-text-multiple"
            />
          </v-col>

          <v-col cols="12" class="text-right mt-4">
            <v-btn
              color="primary"
              @click="openConfirmDialog"
              class="font-weight-bold py-3 px-6"
              size="large"
              :loading="isSubmitting"
              :disabled="isSubmitting"
            >
              <v-icon left>mdi-plus-circle</v-icon>
              Crear Nuevo Turno
            </v-btn>
          </v-col>
        </v-row>
      </v-form>
    </v-card>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="top right"
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn color="white" variant="text" @click="snackbar.show = false">
          Cerrar
        </v-btn>
      </template>
    </v-snackbar>

    <v-dialog v-model="showConfirmDialog" max-width="500px">
      <v-card class="rounded-xl">
        <v-card-title class="headline text-center text-primary font-weight-bold pa-4">
          {{ confirmDialogTitle }}
        </v-card-title>
        <v-card-text class="text-center text-body-1 pa-4">
          {{ confirmDialogMessage }}
        </v-card-text>
        <v-card-actions class="justify-center pa-4">
          <v-btn color="grey-darken-1" variant="outlined" @click="handleCancelAction">Cancelar</v-btn>
          <v-btn :color="confirmDialogConfirmColor" variant="elevated" @click="handleConfirmAction">{{ confirmDialogConfirmText }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const turnoNumero = ref<number | null>(null)
const formRef = ref<any>(null) // Referencia al formulario para validación
const isSubmitting = ref(false) // Nuevo estado para el loading del botón

const form = ref({
  fecha: '',
  horaIngreso: '',
  placa: '',
  tipoVehiculo: '',
  medioEntero: '',
  observaciones: '',

  // Campos adicionales
  tieneCita: false, // Ahora es booleano para el radio group
  convenio: null,
  referidoInterno: '',
  referidoExterno: '',
  funcionarioId: 1, // Se sobrescribe abajo si hay usuario
})

// Estado para el Snackbar
const snackbar = ref({
  show: false,
  message: '',
  color: '',
  timeout: 4000, // Aumentado el timeout para que el usuario lea mejor
})

const showSnackbar = (message: string, color: string = 'info', timeout: number = 4000) => {
  snackbar.value.message = message
  snackbar.value.color = color
  snackbar.value.timeout = timeout
  snackbar.value.show = true
}

// Estado para el Modal de Confirmación
const showConfirmDialog = ref(false)
const confirmDialogTitle = ref('')
const confirmDialogMessage = ref('')
const confirmDialogConfirmText = ref('')
const confirmDialogConfirmColor = ref('')

type ActionType = 'create_turno'
const currentAction = ref<ActionType | ''>('')

onMounted(() => {
  // Inicializa el formulario al montar el componente
  resetFormFields()
  // Carga el siguiente número de turno al montar
  fetchNextTurnNumber()
})

// Función para obtener el siguiente número de turno del backend
const fetchNextTurnNumber = async () => {
  try {
    const response = await fetch('http://localhost:3333/api/turnos-rtm/siguiente-turno', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Si la ruta de siguiente-turno está protegida, necesitarías el token aquí:
        // 'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
      },
    })

    if (!response.ok) {
      throw new Error('Error al obtener el siguiente número de turno del servidor.')
    }
    const data = await response.json()
    if (data?.siguiente) {
      turnoNumero.value = data.siguiente
    }
  } catch (error: unknown) {
    void error;
    console.error('Error al cargar el siguiente número de turno:', error)
    showSnackbar('Error al cargar el número de turno. Intente recargar la página.', 'error')
  }
}

// Función para reiniciar los campos del formulario
const resetFormFields = () => {
  const now = new Date()
  form.value = {
    fecha: now.toISOString().slice(0, 10),
    horaIngreso: now.toTimeString().slice(0, 8),
    placa: '',
    tipoVehiculo: '',
    medioEntero: '', // IMPORTANTE: Resetea este campo
    observaciones: '',
    tieneCita: false, // Reinicia a 'No' por defecto
    convenio: null, // Asegúrate de resetear estos campos también
    referidoInterno: '',
    referidoExterno: '',
    funcionarioId: form.value.funcionarioId, // Mantiene el ID del funcionario
  };
  turnoNumero.value = null; // Resetea el número de turno mostrado temporalmente

  // Resetea la validación del formulario si la referencia existe
  if (formRef.value) {
    formRef.value.resetValidation()
  }
  // Después de resetear los campos, volvemos a cargar el siguiente número de turno
  fetchNextTurnNumber()
}


const openConfirmDialog = async () => {
  const { valid } = await formRef.value.validate()

  if (!valid) {
    showSnackbar('Por favor, completa correctamente todos los campos requeridos.', 'warning')
    return
  }

  confirmDialogTitle.value = 'Confirmar Creación de Turno'
  confirmDialogMessage.value = '¿Estás seguro de que quieres crear este turno?'
  confirmDialogConfirmText.value = 'Crear Turno'
  confirmDialogConfirmColor.value = 'primary'
  currentAction.value = 'create_turno'
  showConfirmDialog.value = true
}


const handleConfirmAction = async () => {
  showConfirmDialog.value = false
  isSubmitting.value = true // Activa el estado de loading

  if (currentAction.value === 'create_turno') {
    await submitForm()
  }
  currentAction.value = ''
  isSubmitting.value = false // Desactiva el estado de loading al finalizar
}


const handleCancelAction = () => {
  showConfirmDialog.value = false
  currentAction.value = ''
  showSnackbar('Creación de turno cancelada.', 'info')
}


const submitForm = async () => {
  try {
    const token = sessionStorage.getItem('token')
    if (!token) {
      showSnackbar('Error: No hay token de autenticación. Por favor, inicie sesión.', 'error')
      router.push('/login')
      return
    }

    const response = await fetch('http://localhost:3333/api/turnos-rtm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form.value),
    })

    if (!response.ok) {
      const errorData = await response.json()
      if (response.status === 401) {
        showSnackbar('Sesión expirada o no autorizada. Por favor, inicie sesión de nuevo.', 'error')
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('user')
        router.push('/login')
        return
      }
      throw new Error(errorData.message || 'Error al crear el turno')
    }

    const data = await response.json()

    showSnackbar(`✅ Turno #${data.turnoNumero} creado exitosamente`, 'success')

    resetFormFields()

  } catch (_error: unknown) {
    void _error;
    let message = 'Error desconocido al crear el turno.'
    if (_error instanceof Error) {
      message = _error.message
    }
    console.error('Error:', _error)
    showSnackbar(`❌ ${message}`, 'error')
  }
}
</script>

<style scoped>
.v-card-title {
  font-weight: bold;
  letter-spacing: 0.05em; /* Un poco de espaciado para mejor lectura */
}

/* Estilos para el título del turno */
.v-card-title .text-secondary {
  color: #4CAF50; /* Un color verde para el número de turno */
}

/* Mejoras visuales para el card */
.v-card {
  box-shadow: 0 10px 20px rgba(0,0,0,0.15), 0 6px 6px rgba(0,0,0,0.1);
  border-radius: 16px; /* Bordes más redondeados */
  background: linear-gradient(145deg, #f0f2f5, #e0e2e5); /* Degradado suave */
}

/* Estilos para los campos de texto/select */
.v-text-field .v-input__control,
.v-select .v-input__control {
  border-radius: 8px;
}

/* Iconos en los campos */
.v-input__prepend-inner .v-icon {
  color: #1976D2; /* Color primario para los iconos */
}

/* Botón de Crear Turno */
.v-btn {
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.v-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.2);
}

/* Estilo para los radio buttons */
.v-radio-group .v-radio {
  margin-right: 16px; /* Espacio entre radios */
}
</style>
