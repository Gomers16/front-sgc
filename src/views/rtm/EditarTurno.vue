<template>
  <div class="edit-turno-container">
    <v-card elevation="8" class="pa-4 pa-sm-6 pa-md-8 rounded-xl responsive-card">
      <v-card-title class="text-h5 text-sm-h4 mb-4 mb-sm-6 text-center text-primary font-weight-bold">
        ✍️ {{ isEditing ? 'Editar Turno RTM' : 'Ver Detalles del Turno RTM' }} #{{ turno.turnoNumero }}
      </v-card-title>

      <v-form @submit.prevent="openConfirmSaveDialog">
        <v-row dense>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="turno.placa"
              label="Placa"
              variant="outlined"
              required
              :rules="[(v) => !!v || 'La placa es obligatoria']"
              @input="(event: { target: HTMLInputElement; }) => turno.placa = (event.target as HTMLInputElement).value.toUpperCase()"
              :readonly="!isEditing"
              density="comfortable"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6">
            <v-select
              v-model="turno.tipoVehiculo"
              :items="['carro', 'moto', 'taxi', 'enseñanza']"
              label="Tipo de Vehículo"
              variant="outlined"
              required
              :rules="[(v) => !!v || 'El tipo de vehículo es obligatorio']"
              :readonly="!isEditing"
              density="comfortable"
            ></v-select>
          </v-col>
          <v-col cols="12" sm="6">
            <v-checkbox
              v-model="turno.tieneCita"
              label="Tiene Cita"
              color="primary"
              :readonly="!isEditing"
              density="comfortable"
            ></v-checkbox>
          </v-col>
          <v-col cols="12" sm="6">
            <v-select
              v-model="turno.medioEntero"
              :items="medioEnteroOptions"
              item-title="title"
              item-value="value"
              label="¿Cómo se enteró de nosotros?"
              variant="outlined"
              required
              :rules="[(v) => !!v || 'El medio por el que se enteró es obligatorio']"
              :readonly="!isEditing"
              density="comfortable"
            ></v-select>
          </v-col>

          <!-- Campos condicionales (Convenio, Referido Interno, Asesor Comercial) -->
          <!-- AHORA usan los 'value' exactos del backend para las condiciones v-if -->
          <v-col cols="12" sm="6" v-if="turno.medioEntero === 'convenio_referido_externo'">
            <v-text-field
              v-model="turno.convenio"
              label="Nombre de Convenio o Referido Externo (Opcional)"
              variant="outlined"
              clearable
              :readonly="!isEditing"
              density="comfortable"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6" v-if="turno.medioEntero === 'referido_interno'">
            <v-text-field
              v-model="turno.referidoInterno"
              label="Nombre del Referido Interno (Opcional)"
              variant="outlined"
              clearable
              :readonly="!isEditing"
              density="comfortable"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6" v-if="turno.medioEntero === 'asesor_comercial'">
            <v-text-field
              v-model="turno.asesorComercial"
              label="Nombre del Asesor Comercial (Opcional)"
              variant="outlined"
              clearable
              :readonly="!isEditing"
              density="comfortable"
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
              :readonly="!isEditing"
              density="comfortable"
            ></v-textarea>
          </v-col>

          <v-col cols="12" sm="4">
            <v-text-field
              v-model="turno.horaIngreso"
              label="Hora de Ingreso (HH:mm:ss)"
              variant="outlined"
              readonly
              density="comfortable"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="turno.horaSalida"
              label="Hora de Salida (HH:mm:ss)"
              variant="outlined"
              clearable
              :readonly="!isEditing"
              density="comfortable"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="turno.tiempoServicio"
              label="Tiempo de Servicio (ej. '30 min')"
              variant="outlined"
              clearable
              :readonly="!isEditing"
              density="comfortable"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6">
            <v-select
              v-model="turno.estado"
              :items="['activo', 'inactivo', 'cancelado', 'finalizado']"
              label="Estado del Turno"
              variant="outlined"
              required
              :readonly="!isEditing"
              density="comfortable"
            ></v-select>
          </v-col>
        </v-row>

        <v-divider class="my-6"></v-divider>

        <v-card-actions class="justify-end responsive-actions">
          <v-btn
            color="grey"
            variant="flat"
            prepend-icon="mdi-arrow-left"
            @click="router.push('/rtm/turnos-dia')"
            size="large"
          >
            Volver
          </v-btn>
          <v-btn
            v-if="!isEditing"
            color="primary"
            variant="elevated"
            prepend-icon="mdi-pencil"
            @click="isEditing = true"
            size="large"
          >
            Editar Turno
          </v-btn>
          <v-btn
            v-if="isEditing"
            color="primary"
            variant="elevated"
            prepend-icon="mdi-content-save"
            type="submit"
            :loading="isSaving"
            size="large"
          >
            Guardar Cambios
          </v-btn>
          <v-btn
            v-if="isEditing"
            color="error"
            variant="outlined"
            prepend-icon="mdi-close"
            @click="cancelEdit"
            size="large"
          >
            Cancelar Edición
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
  </div>
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
  asesorComercial: string | null;
  // La interfaz debe ser flexible para recibir tanto Title Case como snake_case
  medioEntero:
    | 'Redes Sociales'
    | 'Convenio o Referido Externo'
    | 'Call Center'
    | 'Fachada'
    | 'Referido Interno'
    | 'Asesor Comercial'
    | 'Otros'
    | 'redes_sociales'
    | 'convenio_referido_externo'
    | 'call_center'
    | 'fachada'
    | 'referido_interno'
    | 'asesor_comercial';
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

const originalTurno = ref<Turno | null>(null);
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
  medioEntero: 'fachada', // Valor inicial
  observaciones: null,
  funcionarioId: 0,
  estado: 'activo',
  createdAt: '',
  updatedAt: ''
})

const isLoading = ref(true)
const isSaving = ref(false)
const isEditing = ref(false)

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

// Opciones para el v-select de medioEntero con 'title' y 'value'
const medioEnteroOptions = [
  { title: 'Redes Sociales', value: 'redes_sociales' },
  { title: 'Convenio o Referido Externo', value: 'convenio_referido_externo' },
  { title: 'Call Center', value: 'call_center' },
  { title: 'Fachada', value: 'fachada' },
  { title: 'Referido Interno', value: 'referido_interno' },
  { title: 'Asesor Comercial', value: 'asesor_comercial' },
  { title: 'Otros', value: 'otros' },
];

// Función de mapeo para convertir Title Case a snake_case
const mapToSnakeCase = (value: string | null): string | null => {
  if (!value) return null;
  const foundOption = medioEnteroOptions.find(option => option.title === value);
  return foundOption ? foundOption.value : value; // Si no lo encuentra, devuelve el original
};

// Watcher para limpiar campos condicionales cuando cambia turno.medioEntero
watch(() => turno.value.medioEntero, (newValue, oldValue) => {
  if (newValue !== oldValue && isEditing.value) {
    if (newValue !== 'convenio_referido_externo') turno.value.convenio = null;
    if (newValue !== 'referido_interno') turno.value.referidoInterno = null;
    if (newValue !== 'asesor_comercial') turno.value.asesorComercial = null;
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
    const data = await TurnosDelDiaService.fetchTurnoById(id, token) as unknown as Turno

    console.log('--- FETCH TURNO DETAILS ---');
    console.log('Datos recibidos del backend (original):', data);
    console.log('Valor de medioEntero recibido del backend (original):', data.medioEntero);
    console.log('Tipo de medioEntero recibido del backend (original):', typeof data.medioEntero);

    // CAMBIO CLAVE: Mapear medioEntero a snake_case al cargar
    const processedData = {
        ...data,
        medioEntero: mapToSnakeCase(data.medioEntero) as typeof turno.value.medioEntero // Asegura el tipo correcto
    };

    console.log('Valor de medioEntero después de mapear (snake_case):', processedData.medioEntero);

    turno.value = { ...processedData }
    originalTurno.value = { ...processedData }; // Almacenar los datos originales ya procesados
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
      asesorComercial: turno.value.asesorComercial,
      medioEntero: turno.value.medioEntero, // Este valor ahora debería ser el snake_case
      observaciones: turno.value.observaciones,
      funcionarioId: turno.value.funcionarioId,
      horaSalida: turno.value.horaSalida,
      tiempoServicio: turno.value.tiempoServicio,
      estado: turno.value.estado,
    }

    console.log('--- SAVE TURNO ---');
    console.log('Payload enviado al backend:', updatePayload);
    console.log('Valor de medioEntero en payload:', updatePayload.medioEntero);
    console.log('Tipo de medioEntero en payload:', typeof updatePayload.medioEntero);

    await TurnosDelDiaService.updateTurno(turno.value.id, updatePayload, token)

    showSnackbar('Turno guardado exitosamente!', 'success')
    isEditing.value = false;
    // Si la edición fue exitosa, el original también debe actualizarse al nuevo estado
    originalTurno.value = { ...turno.value };
  } catch (error: unknown) {
    console.error('Error al guardar el turno:', error)
    let message = 'Error al guardar el turno. Intente de nuevo.'
    if (error instanceof Error) {
      message = error.message
      if (message.includes('Valor inválido para \'medioEntero\'') || message.includes('invalid value for medioEntero')) {
          message = 'Error: El valor seleccionado para "¿Cómo se enteró?" no es válido para el sistema. Por favor, revise la opción seleccionada.'
      } else if (message.includes('Sesión expirada') || message.includes('no autorizada')) {
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

const cancelEdit = () => {
  if (originalTurno.value) {
    turno.value = { ...originalTurno.value };
  }
  isEditing.value = false;
  showSnackbar('Edición cancelada. Los cambios no se guardaron.', 'info');
};

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
/* Contenedor principal para la vista, similar al de login para centrado */
.edit-turno-container {
  display: flex;
  justify-content: center;
  align-items: flex-start; /* Alinea arriba para que el contenido no se pegue al centro verticalmente */
  min-height: calc(100vh - 40px); /* Ajusta si tienes un header/footer */
  padding: 20px; /* Padding general */
  box-sizing: border-box;
}

/* Tarjeta principal del formulario */
.responsive-card {
  width: 100%; /* Ocupa todo el ancho en pantallas pequeñas */
  max-width: 900px; /* Máximo ancho en pantallas más grandes */
  padding: 16px; /* Padding base para móviles (pa-4 en Vuetify) */
  box-sizing: border-box;
}

/* Ajustes de tipografía y espaciado para hacerla más legible y menos apretada */
.v-card-title {
  font-weight: bold;
  letter-spacing: 0.05em;
  font-size: 1.5rem; /* Ajuste para móviles */
}

/* Media query para pantallas sm (pequeñas, usualmente > 600px, como tablets en vertical) */
@media (min-width: 600px) {
  .responsive-card {
    padding: 24px; /* pa-6 en Vuetify */
  }
  .v-card-title {
    font-size: 2rem; /* h4 en Vuetify */
  }
}

/* Media query para pantallas md (medianas, usualmente > 960px, como tablets en horizontal o desktops) */
@media (min-width: 960px) {
  .responsive-card {
    padding: 32px; /* pa-8 en Vuetify */
  }
  .v-card-title {
    font-size: 2.25rem; /* h3 o h4 más grande */
  }
}

/* Estilos existentes (mantener o ajustar según necesidad) */
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

/* Asegurar que los botones se ajusten en pantallas pequeñas */
.responsive-actions .v-btn {
  flex-grow: 1; /* Permite que los botones crezcan para llenar el espacio */
  margin: 4px; /* Pequeño margen entre botones */
}

@media (min-width: 600px) {
  .responsive-actions .v-btn {
    flex-grow: 0; /* Deshabilita el crecimiento en pantallas más grandes */
    margin: 0 8px; /* Margen estándar */
  }
}
</style>
