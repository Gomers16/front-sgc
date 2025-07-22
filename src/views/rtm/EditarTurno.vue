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
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="turno.tipoVehiculo"
              :items="['vehiculo', 'moto']"
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
              :items="['fachada', 'redes', 'telemercadeo', 'otros', 'convenio']"
              label="Medio Entero"
              variant="outlined"
              required
              :rules="[(v) => !!v || 'El medio por el que se enteró es obligatorio']"
            ></v-select>
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="turno.convenio"
              label="Convenio (Opcional)"
              variant="outlined"
              clearable
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="turno.referidoInterno"
              label="Referido Interno (Opcional)"
              variant="outlined"
              clearable
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="turno.referidoExterno"
              label="Referido Externo (Opcional)"
              variant="outlined"
              clearable
            ></v-text-field>
          </v-col>
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
              :items="['activo', 'inactivo', 'cancelado']"
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
import TurnosDelDiaService from '@/services/turnosdeldiaService' // Tu servicio existente
import { authSetStore } from '@/stores/AuthStore' // Tu store de autenticación

// Define la interfaz para la estructura de un Turno, asegurando la tipificación.
// Asegúrate de que esta interfaz coincida exactamente con la que usa tu backend.
interface Turno {
  id: number;
  turnoNumero: number;
  fecha: string;
  horaIngreso: string;
  horaSalida: string | null;
  tiempoServicio: string | null;
  placa: string;
  tipoVehiculo: 'vehiculo' | 'moto';
  tieneCita: boolean;
  convenio: string | null;
  referidoInterno: string | null;
  referidoExterno: string | null;
  medioEntero: 'fachada' | 'redes' | 'telemercadeo' | 'otros' | 'convenio'; // Añadido 'convenio' aquí
  observaciones: string | null;
  funcionarioId: number;
  estado: 'activo' | 'inactivo' | 'cancelado';
  // Puedes añadir funcionario si lo precargas y lo necesitas en el formulario
  funcionario?: {
    id: number;
    nombres: string;
    apellidos: string;
  };
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
  tipoVehiculo: 'vehiculo',
  tieneCita: false,
  convenio: null,
  referidoInterno: null,
  referidoExterno: null,
  medioEntero: 'fachada',
  observaciones: null,
  funcionarioId: 0, // Asegúrate de que este valor sea el ID real del funcionario logueado o asignado.
  estado: 'activo',
})

const isLoading = ref(true) // Para la carga inicial del turno
const isSaving = ref(false) // Para el botón de guardar

// Snackbar para notificaciones
const snackbar = ref({
  show: false,
  message: '',
  color: '',
  timeout: 4000,
})

const showSnackbar = (message: string, color = 'info', timeout = 4000) => {
  snackbar.value = { show: true, message, color, timeout }
}

// Modal de confirmación para guardar
const confirmSaveDialog = ref({
  show: false,
})

const openConfirmSaveDialog = () => {
  confirmSaveDialog.value.show = true
}

// Función para cargar los detalles del turno
const fetchTurnoDetails = async (id: number) => {
  isLoading.value = true
  try {
    const token = authStore.token
    if (!token) {
      showSnackbar('Error: No hay token de autenticación. Por favor, inicie sesión.', 'error')
      authStore.logout() // Asegurar logout si el token no existe
      router.push('/login')
      return
    }
    const data = await TurnosDelDiaService.fetchTurnoById(id, token) as Turno
    // Usa spread para asegurar reactividad y que se copien todas las propiedades
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

// Función para guardar los cambios del turno
const saveTurno = async () => {
  confirmSaveDialog.value.show = false // Cierra el modal de confirmación
  isSaving.value = true
  try {
    const token = authStore.token
    if (!token) {
      showSnackbar('Error: No hay token de autenticación. Por favor, inicie sesión.', 'error')
      authStore.logout() // Asegurar logout si el token no existe
      router.push('/login')
      return
    }

    // Prepara los datos a enviar. Incluye solo los campos que tu API de 'update'
    // en el backend está configurada para recibir y procesar.
    const updatePayload = {
      placa: turno.value.placa,
      tipoVehiculo: turno.value.tipoVehiculo,
      tieneCita: turno.value.tieneCita,
      convenio: turno.value.convenio,
      referidoInterno: turno.value.referidoInterno,
      referidoExterno: turno.value.referidoExterno,
      medioEntero: turno.value.medioEntero,
      observaciones: turno.value.observaciones,
      funcionarioId: turno.value.funcionarioId, // Asegúrate de enviar el funcionarioId si es necesario
      horaSalida: turno.value.horaSalida,
      tiempoServicio: turno.value.tiempoServicio,
      estado: turno.value.estado,
      // No incluyas id, turnoNumero, fecha, horaIngreso, createdAt, updatedAt
      // a menos que tu API esté diseñada para que se puedan modificar explícitamente.
    }

    // AHORA SÍ: LLAMADA AL SERVICIO PARA ACTUALIZAR EL TURNO
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
        // Error de red, el servidor no responde
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

// Opcional: Watch para recargar si el ID de la ruta cambia (útil si se navega entre ediciones sin destruir el componente)
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
