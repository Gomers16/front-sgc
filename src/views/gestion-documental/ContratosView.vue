<template>
  <v-container class="py-6">
    <v-card elevation="4" class="mb-6">
      <v-card-title class="text-h5 font-weight-bold">
        Gestión de Contratos y Trazabilidad
      </v-card-title>
    </v-card>

    <v-card elevation="2" class="mb-6">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-select
              v-model="razonSocialSeleccionada"
              :items="razonesSociales"
              label="Seleccione una Razón Social"
              item-title="nombre"
              item-value="id"
              variant="outlined"
              density="compact"
              :loading="loadingRazonesSociales"
              clearable
            ></v-select>
          </v-col>

          <v-col cols="12" md="6">
            <v-select
              v-model="usuarioSeleccionado"
              :items="usuarios"
              label="Seleccione un Usuario"
              item-title="nombreCompleto"
              item-value="id"
              variant="outlined"
              density="compact"
              :disabled="!razonSocialSeleccionada"
              :loading="loadingUsuarios"
              clearable
            ></v-select>
          </v-col>

          <v-col cols="12" md="6">
            <v-select
              v-model="tipoContratoSeleccionado"
              :items="tiposContrato"
              label="Seleccione un tipo de contrato"
              item-title="nombre"
              item-value="valor"
              variant="outlined"
              density="compact"
              :disabled="!usuarioSeleccionado"
            ></v-select>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card elevation="2" v-if="usuarioSeleccionado">
      <v-card-text>
        <h3 class="text-h6 mb-4">Pasos del Contrato</h3>
        <v-card class="pa-4 mb-8">
          <v-timeline side="end" density="compact">
            <v-timeline-item
              v-for="(paso, index) in pasosInicio"
              :key="index"
              :dot-color="paso.completado ? 'success' : 'grey'"
              size="small"
            >
              <div class="d-flex align-center justify-space-between w-100">
                <span class="font-weight-medium">{{ paso.nombre }}</span>
                <v-btn
                  v-if="!paso.completado && (index === 0 || pasosInicio[index - 1]?.completado)"
                  icon="mdi-check"
                  color="primary"
                  variant="tonal"
                  size="small"
                  @click="abrirModalPaso(paso)"
                ></v-btn>
                <v-btn
                  v-else-if="paso.completado"
                  icon="mdi-pencil-outline"
                  color="warning"
                  variant="tonal"
                  size="small"
                  @click="abrirModalPaso(paso)"
                ></v-btn>
              </div>
            </v-timeline-item>
          </v-timeline>
          <v-alert v-if="loadingPasos" type="info" variant="tonal" class="mt-4">
            Cargando pasos...
          </v-alert>
        </v-card>

        <div class="mt-8">
          <h4 class="text-h6 mb-2">Anexar Contrato</h4>
          <v-alert
            v-if="!contratoFinal"
            type="info"
            variant="tonal"
            class="mb-4"
          >
            Adjunte el archivo del contrato para anexarlo al usuario.
          </v-alert>
          <v-alert
            v-else
            type="success"
            variant="tonal"
            class="mb-4"
          >
            El contrato **{{ contratoFinal.nombre }}** ha sido anexado correctamente a **{{ usuarioSeleccionadoNombreCompleto }}**.
          </v-alert>

          <v-file-input
            label="Subir archivo del contrato físico"
            variant="outlined"
            density="compact"
            show-size
            accept="application/pdf"
            prepend-icon="mdi-file-upload"
            class="mb-4"
            @change="onFileChange"
            :disabled="!!contratoFinal"
          ></v-file-input>

          <v-btn
            color="success"
            prepend-icon="mdi-content-save-check"
            @click="anexarContratoFinal"
            :disabled="!archivoContrato || !!contratoFinal"
          >
            Anexar Contrato al Usuario
          </v-btn>
        </div>

      </v-card-text>
    </v-card>

    <v-dialog v-model="modalPaso.mostrar" max-width="600px">
      <v-card>
        <v-card-title class="text-h6">
          {{ modalPaso.paso?.completado ? 'Editar paso' : 'Completar paso' }}: {{ modalPaso.paso?.nombre }}
        </v-card-title>
        <v-card-text>
          <v-form ref="formPaso" @submit.prevent="completarPasoConfirmado">
            <v-textarea
              v-model="modalPaso.form.observacion"
              label="Observación"
              variant="outlined"
              rows="3"
              required
              class="mb-4"
            ></v-textarea>
            <v-file-input
              v-model="modalPaso.form.archivo"
              label="Archivo adjunto (opcional)"
              variant="outlined"
              density="compact"
              show-size
              prepend-icon="mdi-paperclip"
              @change="onFilePasoChange"
            ></v-file-input>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="cerrarModalPaso">Cancelar</v-btn>
          <v-btn
            :color="modalPaso.paso?.completado ? 'warning' : 'primary'"
            variant="flat"
            type="submit"
            @click="completarPasoConfirmado"
          >
            {{ modalPaso.paso?.completado ? 'Guardar Cambios' : 'Marcar como Completado' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { listarRazonesSociales, fetchUsuariosPorRazonSocial } from '@/services/razonSocialService';
import type { Usuario } from '@/services/razonSocialService';
import { anexarContrato } from '@/services/contratoService';
import { useContratoStore } from '@/stores/contrato'; // ✅ Corregido: Importación del store singular

// --- Interfaces para tipado ---
interface RazonSocial {
  id: number;
  nombre: string;
}

interface Paso {
  nombre: string;
  completado: boolean;
  observacion?: string;
  nombreArchivo?: string;
  fechaCompletado?: string;
}

// Interfaz extendida para Usuario que incluye nombreCompleto
interface UsuarioExtendida extends Usuario {
  nombreCompleto: string;
}

// Interfaz de ContratoFinal (se mantiene local para la vista)
interface ContratoFinal {
  nombre: string;
  ruta: string;
}

// --- Tipos de contrato y pasos (ahora como ref para resolver el error de TS) ---
const tiposContrato = ref([ // ✅ Corregido: Envuelto en ref
  { nombre: 'Prestación de Servicios', valor: 'prestacion' },
  { nombre: 'Temporal', valor: 'temporal' },
  { nombre: 'Laboral', valor: 'laboral' },
]);

const pasosPrestacion: Paso[] = [
  { nombre: 'Inicio', completado: false },
  { nombre: 'Desarrollo', completado: false },
  { nombre: 'Fin', completado: false },
];
const pasosTemporal: Paso[] = [
  { nombre: 'Solicitud', completado: false },
  { nombre: 'Pruebas', completado: false },
  { nombre: 'Visto Bueno Empresa', completado: false },
  { nombre: 'Examen Médico', completado: false },
  { nombre: 'Contratación', completado: false },
];
const pasosLaboral: Paso[] = [
  { nombre: 'Reclutamiento / Selección', completado: false },
  { nombre: 'Referencias', completado: false },
  { nombre: 'Pruebas', completado: false },
  { nombre: 'Examen Médico', completado: false },
  { nombre: 'Contrato', completado: false },
  { nombre: 'Afiliaciones', completado: false },
];

// --- Estado de la vista ---
const razonSocialSeleccionada = ref<number | null>(null);
const usuarioSeleccionado = ref<number | null>(null);
const tipoContratoSeleccionado = ref('prestacion');

const razonesSociales = ref<RazonSocial[]>([]);
const usuarios = ref<UsuarioExtendida[]>([]);
const loadingRazonesSociales = ref(false);
const loadingUsuarios = ref(false);
const loadingPasos = ref(false);

// --- Estados para los modales ---
const modalPaso = ref({
  mostrar: false,
  paso: null as Paso | null,
  form: {
    observacion: '',
    archivo: null as File | null
  }
});

// --- Estado del contrato final ---
const archivoContrato = ref<File | null>(null);
const contratoFinal = ref<ContratoFinal | null>(null);

// --- Inicializa el store de Pinia ---
const contratoStore = useContratoStore(); // ✅ Corregido: Uso del store singular

// --- Propiedades computadas ---
const pasosInicio = computed(() => {
  if (tipoContratoSeleccionado.value === 'prestacion') return pasosPrestacion;
  if (tipoContratoSeleccionado.value === 'temporal') return pasosTemporal;
  if (tipoContratoSeleccionado.value === 'laboral') return pasosLaboral;
  return [];
});

const usuarioSeleccionadoNombreCompleto = computed(() => {
  const usuario = usuarios.value.find(u => u.id === usuarioSeleccionado.value);
  return usuario ? usuario.nombreCompleto : 'el usuario';
});

// --- Métodos de la vista ---
async function cargarRazonesSociales() {
  loadingRazonesSociales.value = true;
  try {
    const data = await listarRazonesSociales();
    razonesSociales.value = data;
  } catch (error) {
    console.error('Error al cargar razones sociales:', error);
  } finally {
    loadingRazonesSociales.value = false;
  }
}

async function cargarUsuariosPorRazonSocial() {
  loadingUsuarios.value = true;
  usuarios.value = [];
  usuarioSeleccionado.value = null;
  if (razonSocialSeleccionada.value) {
    try {
      const data = await fetchUsuariosPorRazonSocial(razonSocialSeleccionada.value);
      usuarios.value = data.map(u => ({
        ...u,
        nombreCompleto: `${u.nombres} ${u.apellidos}`
      }));
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      loadingUsuarios.value = false;
    }
  }
}

function abrirModalPaso(paso: Paso) {
  modalPaso.value.paso = paso;

  if (paso.completado) {
    modalPaso.value.form.observacion = paso.observacion || '';
  } else {
    modalPaso.value.form = { observacion: '', archivo: null };
  }

  modalPaso.value.mostrar = true;
}

function onFilePasoChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    modalPaso.value.form.archivo = target.files[0];
  } else {
    modalPaso.value.form.archivo = null;
  }
}

async function completarPasoConfirmado() {
  if (!modalPaso.value.paso) return;

  const pasoACompletar = pasosInicio.value.find(p => p.nombre === modalPaso.value.paso?.nombre);

  if (pasoACompletar) {
    const observacion = modalPaso.value.form.observacion;
    const archivo = modalPaso.value.form.archivo;

    // Simulación de la actualización local
    pasoACompletar.completado = true;
    pasoACompletar.observacion = observacion;
    pasoACompletar.fechaCompletado = new Date().toLocaleDateString('es-CO');
    if (archivo) {
      pasoACompletar.nombreArchivo = archivo.name;
    }

    console.log(`Guardando/completando paso "${pasoACompletar.nombre}" para el usuario ${usuarioSeleccionado.value}.`);
  }

  cerrarModalPaso();
}

function cerrarModalPaso() {
  modalPaso.value.mostrar = false;
  modalPaso.value.form = { observacion: '', archivo: null };
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    archivoContrato.value = target.files[0];
  } else {
    archivoContrato.value = null;
  }
}

async function anexarContratoFinal() {
  if (usuarioSeleccionado.value && archivoContrato.value && tipoContratoSeleccionado.value) {
    try {
      // Obtener fechas para el contrato (puedes añadir campos de fecha en tu UI si son dinámicas)
      const fechaInicio = new Date().toISOString().substr(0, 10); // Ejemplo: fecha actual
      // const fechaFin = 'YYYY-MM-DD'; // Si tienes una fecha de fin, obténla de tu UI

      // Llama al servicio para enviar los datos al backend
      const nuevoContrato = await anexarContrato(
        usuarioSeleccionado.value,
        archivoContrato.value,
        tipoContratoSeleccionado.value,
        fechaInicio
        // fechaFin // Pasa la fecha de fin si la tienes
      );

      // ✅ IMPORTANTE: Añade el nuevo contrato al store de Pinia
      contratoStore.addContrato(nuevoContrato); // ✅ Corregido: Uso del store singular

      contratoFinal.value = {
        nombre: nuevoContrato.nombreArchivoContratoFisico || '',
        ruta: nuevoContrato.rutaArchivoContratoFisico || ''
      };

      console.log(`El contrato ${contratoFinal.value.nombre} ha sido anexado correctamente al usuario ${usuarioSeleccionadoNombreCompleto.value}.`);
      // Aquí puedes mostrar una notificación de éxito al usuario (ej. con un snackbar de Vuetify)

    } catch (error) {
      console.error('Error al anexar el contrato:', error);
      alert('Hubo un error al anexar el contrato. Inténtelo de nuevo.'); // Usar un snackbar real en producción
    }
  } else {
    alert('Por favor, seleccione un usuario, un tipo de contrato y adjunte un archivo.');
  }
}

// --- Watchers y ciclo de vida ---
watch(razonSocialSeleccionada, (newId) => {
  if (newId) {
    cargarUsuariosPorRazonSocial();
  } else {
    usuarios.value = [];
    usuarioSeleccionado.value = null;
    pasosInicio.value.forEach(p => p.completado = false);
    archivoContrato.value = null;
    contratoFinal.value = null;
    contratoStore.resetState(); // ✅ Corregido: Uso del store singular
  }
});

watch(usuarioSeleccionado, (newId) => {
  if (newId) {
    console.log(`Usuario ${newId} seleccionado. Iniciando nuevo proceso de contrato...`);
    // Reiniciar el estado para el nuevo usuario
    pasosInicio.value.forEach(p => p.completado = false);
    archivoContrato.value = null;
    contratoFinal.value = null;
    contratoStore.resetState(); // ✅ Corregido: Uso del store singular
  }
});

watch(tipoContratoSeleccionado, () => {
    // Reiniciar pasos al cambiar el tipo de contrato
    pasosInicio.value.forEach(p => p.completado = false);
    archivoContrato.value = null;
    contratoFinal.value = null;
    contratoStore.resetState(); // ✅ Corregido: Uso del store singular
});

onMounted(() => {
  cargarRazonesSociales();
});
</script>

<style scoped>
/* Estilos adicionales si los necesitas */
</style>
