<template>
  <v-container class="mt-6">
    <v-card elevation="8" class="pa-8 rounded-xl">
      <v-card-title class="text-h4 mb-6 text-center text-primary font-weight-bold">
        ✍️ Editar Turno RTM #{{ turno.turnoNumero }}
      </v-card-title>

      <v-form @submit.prevent="openConfirmSaveDialog">
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="turno.placa"
              label="Placa"
              variant="outlined"
              required
              :rules="[(v) => !!v || 'La placa es obligatoria']"
              @input="(event: { target: HTMLInputElement; }) => turno.placa = (event.target as HTMLInputElement).value.toUpperCase()"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="turno.tipoVehiculo"
              :items="['carro', 'moto', 'taxi', 'enseñanza']"
              label="Tipo de Vehículo"
              variant="outlined"
              required
              :rules="[(v) => !!v || 'El tipo de vehículo es obligatorio']"
            ></v-select>
          </v-col>
          <v-col cols="12" md="6">
            <v-checkbox
              v-model="turno.tieneCita"
              label="Tiene Cita"
              color="primary"
            ></v-checkbox>
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="turno.medioEntero"
              :items="medioEnteroOptions"
              label="¿Cómo se enteró de nosotros?"
              variant="outlined"
              required
              :rules="[(v) => !!v || 'El medio por el que se enteró es obligatorio']"
            ></v-select>
          </v-col>

          <!-- Campos condicionales (Convenio, Referido Interno, Asesor Comercial) -->
          <!-- CAMBIO: v-if ahora usa el valor directo de turno.medioEntero -->
          <v-col cols="12" md="6" v-if="turno.medioEntero === 'Convenio o Referido Externo'">
            <v-text-field
              v-model="turno.convenio"
              label="Nombre de Convenio o Referido Externo (Opcional)"
              variant="outlined"
              clearable
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6" v-if="turno.medioEntero === 'Referido Interno'">
            <v-text-field
              v-model="turno.referidoInterno"
              label="Nombre del Referido Interno (Opcional)"
              variant="outlined"
              clearable
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6" v-if="turno.medioEntero === 'Asesor Comercial'">
            <v-text-field
              v-model="turno.asesorComercial"
              label="Nombre del Asesor Comercial (Opcional)"
              variant="outlined"
              clearable
            ></v-text-field>
          </v-col>
          <!-- FIN Campos condicionales -->

          <v-col cols="12">
            <v-textarea
              v-model="turno.observaciones"
              label="Observaciones (Opcional)"
              variant="outlined"
              rows="3"
              clearable
            ></v-textarea>
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model="turno.horaIngreso"
              label="Hora de Ingreso (HH:mm:ss)"
              variant="outlined"
              readonly
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="turno.horaSalida"
              label="Hora de Salida (HH:mm:ss)"
              variant="outlined"
              clearable
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="turno.tiempoServicio"
              label="Tiempo de Servicio (ej. '30 min')"
              variant="outlined"
              clearable
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="turno.estado"
              :items="['activo', 'inactivo', 'cancelado', 'finalizado']"
              label="Estado del Turno"
              variant="outlined"
              required
            ></v-select>
          </v-col>
        </v-row>

        <v-divider class="my-6"></v-divider>

        <v-card-actions class="justify-end">
          <v-btn
            color="grey"
            variant="flat"
            prepend-icon="mdi-arrow-left"
            @click="router.push('/rtm/turnos-dia')"
          >
            Volver
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            prepend-icon="mdi-content-save"
            type="submit"
            :loading="isSaving"
          >
            Guardar Cambios
          </v-btn>
        </v-card-actions>
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
        <v-btn color="white" variant="text" @click="snackbar.show = false">Cerrar</v-btn>
      </template>
    </v-snackbar>

    <v-dialog v-model="confirmSaveDialog.show" max-width="500">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold">Confirmar Guardar Cambios</v-card-title>
        <v-card-text>¿Está seguro de que desea guardar los cambios en este turno?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" variant="text" @click="confirmSaveDialog.show = false">Cancelar</v-btn>
          <v-btn color="primary" variant="elevated" @click="saveTurno">Confirmar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isLoading" persistent width="300">
      <v-card color="primary" dark>
        <v-card-text class="py-4 text-center">
          Cargando turno...
          <v-progress-linear indeterminate color="white" class="mb-0"></v-progress-linear>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TurnosDelDiaService from '@/services/turnosdeldiaService'
import { authSetStore } from '@/stores/AuthStore'

interface Turno {
  id: number;
  turnoNumero: number;
  fecha: string;
  horaIngreso: string;
  horaSalida: string | null;
  tiempoServicio: string | null;
  placa: string;
  tipoVehiculo: 'carro' | 'moto' | 'taxi' | 'enseñanza';
  tieneCita: boolean;
  convenio: string | null;
  referidoInterno: string | null;
  // CAMBIO: 'referidoExterno' eliminado de la interfaz si no hay input directo
  asesorComercial: string | null;
  medioEntero:
    | 'Redes Sociales'
    | 'Convenio o Referido Externo'
    | 'Call Center'
    | 'Fachada'
    | 'Referido Interno'
    | 'Asesor Comercial'
    | 'Otros'; // Mantener 'Otros' si es un valor posible en tu backend
  observaciones: string | null;
  funcionarioId: number;
  estado: 'activo' | 'inactivo' | 'cancelado' | 'finalizado';
  funcionario?: {
    id: number;
    nombres: string;
    apellidos: string;
  };
  createdAt: string;
  updatedAt: string;
}

const route = useRoute()
const router = useRouter()
const authStore = authSetStore()

const turno = ref<Turno>({
  id: 0,
  turnoNumero: 0,
  fecha: '',
  horaIngreso: '',
  horaSalida: null,
  tiempoServicio: null,
  placa: '',
  tipoVehiculo: 'carro',
  tieneCita: false,
  convenio: null,
  referidoInterno: null,
  asesorComercial: null,
  medioEntero: 'Fachada', // Valor inicial que debe ser uno de los del backend
  observaciones: null,
  funcionarioId: 0,
  estado: 'activo',
  createdAt: '',
  updatedAt: ''
})

const isLoading = ref(true)
const isSaving = ref(false)

const snackbar = ref({
  show: false,
  message: '',
  color: '',
  timeout: 4000,
})

const showSnackbar = (message: string, color = 'info', timeout = 4000) => {
  snackbar.value = { show: true, message, color, timeout }
}

const confirmSaveDialog = ref({
  show: false,
})

const openConfirmSaveDialog = () => {
  confirmSaveDialog.value.show = true
}

// CAMBIO: Opciones para el v-select de medioEntero (valores exactos del backend)
const medioEnteroOptions: Turno['medioEntero'][] = [
  'Redes Sociales',
  'Convenio o Referido Externo',
  'Call Center',
  'Fachada',
  'Referido Interno',
  'Asesor Comercial',
  // 'Otros' // CAMBIO: Eliminado si no se maneja explícitamente en el backend
];

// CAMBIO: Watcher para limpiar campos condicionales cuando cambia turno.medioEntero
watch(() => turno.value.medioEntero, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    // Limpiar todos los campos condicionales al cambiar la opción
    turno.value.convenio = null;
    turno.value.referidoInterno = null;
    turno.value.asesorComercial = null;
  }
});

const fetchTurnoDetails = async (id: number) => {
  isLoading.value = true
  try {
    const token = authStore.token
    if (!token) {
      showSnackbar('Error: No hay token de autenticación. Por favor, inicie sesión.', 'error')
      authStore.logout()
      router.push('/login')
      return
    }
    const data = await TurnosDelDiaService.fetchTurnoById(id, token) as Turno
    turno.value = { ...data }
  } catch (error: unknown) {
    console.error('Error al cargar los detalles del turno:', error)
    let message = 'Error al cargar los detalles del turno. Intente recargar la página.'
    if (error instanceof Error) {
      message = error.message
      if (message.includes('Sesión expirada') || message.includes('no autorizada')) {
        authStore.logout()
        router.push('/login')
      } else if (message.includes('not found')) {
        message = 'Turno no encontrado.'
      }
    }
    showSnackbar(message, 'error')
    router.push('/rtm/turnos-dia')
  } finally {
    isLoading.value = false
  }
}

const saveTurno = async () => {
  confirmSaveDialog.value.show = false
  isSaving.value = true
  try {
    const token = authStore.token
    if (!token) {
      showSnackbar('Error: No hay token de autenticación. Por favor, inicie sesión.', 'error')
      authStore.logout()
      router.push('/login')
      return
    }

    const updatePayload = {
      placa: turno.value.placa,
      tipoVehiculo: turno.value.tipoVehiculo,
      tieneCita: turno.value.tieneCita,
      convenio: turno.value.convenio,
      referidoInterno: turno.value.referidoInterno,
      // CAMBIO: 'referidoExterno' se elimina del payload si no hay input directo y no es necesario en el backend
      // Si tu backend lo espera, considera añadir un input para él o manejarlo de otra forma.
      medioEntero: turno.value.medioEntero,
      observaciones: turno.value.observaciones,
      funcionarioId: turno.value.funcionarioId,
      horaSalida: turno.value.horaSalida,
      tiempoServicio: turno.value.tiempoServicio,
      estado: turno.value.estado,
      asesorComercial: turno.value.asesorComercial,
    }

    await TurnosDelDiaService.updateTurno(turno.value.id, updatePayload, token)

    showSnackbar('Turno guardado exitosamente!', 'success')
    router.push('/rtm/turnos-dia')
  } catch (error: unknown) {
    console.error('Error al guardar el turno:', error)
    let message = 'Error al guardar el turno. Intente de nuevo.'
    if (error instanceof Error) {
      message = error.message
      if (message.includes('Sesión expirada') || message.includes('no autorizada')) {
        authStore.logout()
        router.push('/login')
      } else if (message.includes('Failed to fetch')) {
        message = 'No se pudo conectar con el servidor. Verifique su conexión o el estado del servidor.'
      }
    }
    showSnackbar(message, 'error')
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  const turnoId = Number(route.params.id)
  if (turnoId) {
    fetchTurnoDetails(turnoId)
  } else {
    showSnackbar('ID de turno no proporcionado.', 'error')
    router.push('/rtm/turnos-dia')
  }
})

watch(
  () => route.params.id,
  (newId) => {
    if (newId && typeof newId === 'string') {
      fetchTurnoDetails(Number(newId))
    }
  }
)
</script>

<style scoped>
.v-card-title {
  font-weight: bold;
  letter-spacing: 0.05em;
}
.v-card {
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15), 0 6px 6px rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  background: linear-gradient(145deg, #f0f2f5, #e0e2e5);
}
.v-btn {
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
.v-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}
</style>
