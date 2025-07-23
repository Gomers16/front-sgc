<template>
  <v-container class="mt-6">
    <v-card elevation="8" class="pa-8 rounded-xl">
      <v-card-title class="text-h4 mb-6 text-primary font-weight-bold d-flex justify-center title-full-bordered-container">
        <span class="title-text-with-border">
          ✍️ Crear Turno RTM <span class="text-secondary">- Turno #{{ turnoNumero || '...' }}</span>
        </span>
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
              :model-value="formattedHoraIngreso"
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
              @input="(event: { target: HTMLInputElement }) => form.placa = (event.target as HTMLInputElement).value.toUpperCase()"
              :rules="[v => !!v || 'La placa es requerida']"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-select
              v-model="form.tipoVehiculo"
              :items="['carro', 'moto', 'taxi', 'enseñanza']"
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
              :items="[
                { title: 'Redes Sociales', value: 'redes_sociales' },
                { title: 'Convenio o Referido Externo', value: 'convenio_referido_externo' },
                { title: 'Call Center', value: 'call_center' },
                { title: 'Fachada', value: 'fachada' },
                { title: 'Referido Interno', value: 'referido_interno' },
                { title: 'Asesor Comercial', value: 'asesor_comercial' },
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

          <v-col cols="12" sm="6" v-if="form.medioEntero === 'convenio_referido_externo'">
            <v-text-field
              v-model="form.convenio"
              label="Nombre de Convenio o Referido Externo (opcional)"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-handshake"
            />
          </v-col>

          <v-col cols="12" sm="6" v-if="form.medioEntero === 'referido_interno'">
            <v-text-field
              v-model="form.referidoInterno"
              label="Nombre del Referido Interno (opcional)"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-account-tie"
            />
          </v-col>

          <v-col cols="12" sm="6" v-if="form.medioEntero === 'asesor_comercial'">
            <v-text-field
              v-model="form.asesorComercial"
              label="Nombre del Asesor Comercial (opcional)"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-account-hard-hat"
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
              class="font-weight-bold py-3 px-6 bordered-button"
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
          <v-btn :color="confirmDialogConfirmColor" variant="elevated" @click="handleConfirmAction" class="bordered-dialog-button">{{ confirmDialogConfirmText }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { DateTime } from 'luxon'
import { authSetStore } from '@/stores/AuthStore'
import type { VForm } from 'vuetify/components'

const router = useRouter()
const authStore = authSetStore()

const turnoNumero = ref<number | null>(null)
const formRef = ref<VForm | null>(null)
const isSubmitting = ref(false)

interface TurnoForm {
  fecha: string;
  horaIngreso: string; // Este será HH:mm
  placa: string;
  tipoVehiculo: 'carro' | 'moto' | 'taxi' | 'enseñanza' | '';
  medioEntero: 'redes_sociales' | 'convenio_referido_externo' | 'call_center' | 'fachada' | 'referido_interno' | 'asesor_comercial' | '';
  observaciones: string;
  tieneCita: boolean;
  convenio: string | null;
  referidoInterno: string | null;
  referidoExterno: string | null;
  asesorComercial: string | null;
  funcionarioId: number;
}

const form = ref<TurnoForm>({
  fecha: '',
  horaIngreso: '',
  placa: '',
  tipoVehiculo: '',
  medioEntero: '',
  observaciones: '',
  tieneCita: false,
  convenio: null,
  referidoInterno: null,
  referidoExterno: null,
  asesorComercial: null,
  funcionarioId: 1,
})

const formattedHoraIngreso = computed(() => {
  if (form.value.horaIngreso) {
    const time = DateTime.fromFormat(form.value.horaIngreso, 'HH:mm', { zone: 'America/Bogota' });
    return time.isValid ? time.toFormat('hh:mm a') : form.value.horaIngreso;
  }
  return '';
});

const snackbar = ref({
  show: false,
  message: '',
  color: '',
  timeout: 4000,
})

const showSnackbar = (message: string, color: string = 'info', timeout: number = 4000) => {
  snackbar.value.message = message
  snackbar.value.color = color
  snackbar.value.timeout = timeout
  snackbar.value.show = true
}

const showConfirmDialog = ref(false)
const confirmDialogTitle = ref('')
const confirmDialogMessage = ref('')
const confirmDialogConfirmText = ref('')
const confirmDialogConfirmColor = ref('')

type ActionType = 'create_turno'
const currentAction = ref<ActionType | ''>('')

onMounted(async () => {
  const user = authStore.user;
  if (user && user.id) {
    form.value.funcionarioId = user.id;
  }
  await resetFormFields()
})

watch(() => form.value.medioEntero, () => {
  form.value.convenio = null;
  form.value.referidoInterno = null;
  form.value.asesorComercial = null;
  form.value.referidoExterno = null;
});

const fetchNextTurnNumber = async () => {
  try {
    const token = authStore.token;
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('http://localhost:3333/api/turnos-rtm/siguiente-turno', {
      method: 'GET',
      headers: headers,
    })

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al obtener el siguiente número de turno del servidor.');
    }
    const data = await response.json()
    if (data?.siguiente) {
      turnoNumero.value = data.siguiente
    }
  } catch (error: unknown) {
    console.error('Error al cargar el siguiente número de turno:', error)
    let message = 'Error al cargar el número de turno. Intente recargar la página.';
    if (error instanceof Error) {
      message = error.message;
    }
    showSnackbar(message, 'error');

    if (typeof error === 'object' && error !== null && 'message' in error) {
        if ((error as Error).message.includes('Sesión expirada') || (error as Error).message.includes('no autorizada')) {
            authStore.logout();
            router.push('/login');
        }
    }
  }
}

const resetFormFields = async () => {
  const now = DateTime.now().setZone('America/Bogota');

  form.value = {
    fecha: now.toISODate() || '',
    horaIngreso: now.toFormat('HH:mm'),
    placa: '',
    tipoVehiculo: '',
    medioEntero: '',
    observaciones: '',
    tieneCita: false,
    convenio: null,
    referidoInterno: null,
    referidoExterno: null,
    asesorComercial: null,
    funcionarioId: form.value.funcionarioId,
  };
  turnoNumero.value = null;

  await fetchNextTurnNumber();

  if (formRef.value) {
    formRef.value.resetValidation();
  }
}

const openConfirmDialog = async () => {
  if (!formRef.value) {
    showSnackbar('Error interno: El formulario no está inicializado.', 'error');
    return;
  }
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
  isSubmitting.value = true

  if (currentAction.value === 'create_turno') {
    await submitForm()
  }
  currentAction.value = ''
  isSubmitting.value = false
}

const handleCancelAction = () => {
  showConfirmDialog.value = false
  currentAction.value = ''
  showSnackbar('Creación de turno cancelada.', 'info')
}

const submitForm = async () => {
  try {
    const token = authStore.token;
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
        authStore.logout()
        router.push('/login')
        return
      }
      throw new Error(errorData.message || 'Error al crear el turno')
    }

    const data = await response.json()

    showSnackbar(`✅ Turno #${data.turnoNumero} creado exitosamente`, 'success')

    await resetFormFields()

  } catch (error: unknown) {
    let message = 'Error desconocido al crear el turno.'
    if (error instanceof Error) {
      message = error.message
    }
    console.error('Error:', error)
    showSnackbar(`❌ ${message}`, 'error')
  }
}
</script>

<style scoped>
/* Contenedor del título que ahora centra su contenido */
.title-full-bordered-container {
  /* Vuetify d-flex y justify-center ya manejan el display flex y el centrado */
  /* text-align: center; /* Ya no es necesario si usamos flexbox para el centrado */
  padding: 0 !important; /* Asegura que el v-card-title no tenga padding extra */
}

/* Estilo para el span que contiene el texto y el borde */
.title-text-with-border {
  border: 2px solid black; /* Borde negro de 2px */
  padding: 10px 20px; /* Más padding para que el borde se vea bien */
  border-radius: 12px; /* Bordes ligeramente más redondeados */
  background-color: rgba(255, 255, 255, 0.9); /* Fondo semi-transparente para que el borde resalte */
  /* Quitamos margin: auto aquí, ya que el padre flex lo centrará */
  /* margin-bottom para separarlo del formulario */
  margin-bottom: 24px; /* Un margen inferior para separarlo del formulario */
  display: inline-block; /* Importante para que el padding y border se apliquen correctamente */
  /* text-align: center; /* Centrar el texto dentro de este span si se rompiera en varias líneas */
}

/* Estilo para el texto principal del título (fuera del span del número) */
.title-text-with-border {
  font-weight: bold;
  letter-spacing: 0.05em;
  color: var(--v-theme-primary); /* Usar la variable de color primary de Vuetify */
}

/* Asegurar que el span del número de turno esté en la misma línea y tenga espacio */
.title-text-with-border .text-secondary {
  display: inline; /* Asegura que el número de turno esté en la misma línea */
  margin-left: 8px; /* Espacio entre el texto principal y el número de turno */
  color: #4CAF50; /* Color verde para el número de turno */
}

.v-card {
  box-shadow: 0 10px 20px rgba(0,0,0,0.15), 0 6px 6px rgba(0,0,0,0.1);
  border-radius: 16px;
  background: linear-gradient(145deg, #f0f2f5, #e0e2e5);
}

.v-text-field .v-input__control,
.v-select .v-input__control {
  border-radius: 8px;
}

.v-input__prepend-inner .v-icon {
  color: #1976D2;
}

.v-btn {
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

/* Estilo para el botón principal "Crear Nuevo Turno" */
.bordered-button {
  box-shadow: 0 4px 6px rgba(0,0,0,0.1), 0 0 0 2px black !important;
}

.v-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.2), 0 0 0 3px black !important;
}

/* Estilo para el botón de confirmación en el diálogo */
.bordered-dialog-button {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1), 0 0 0 1px black !important;
}

.bordered-dialog-button:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.2), 0 0 0 2px black !important;
}

.v-radio-group .v-radio {
  margin-right: 16px;
}
</style>
