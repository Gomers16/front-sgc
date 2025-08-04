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
          <v-btn
            color="info"
            prepend-icon="mdi-content-save"
            @click="guardarPasosLocally"
            :disabled="!usuarioSeleccionado || !tipoContratoSeleccionado"
            class="mt-4"
          >
            Guardar Pasos
          </v-btn>
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

    <!-- Diálogo de Alerta Personalizado (igual que en UserProfileView) -->
    <v-dialog v-model="showAlertDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h6 bg-primary text-white">{{ alertDialogTitle }}</v-card-title>
        <v-card-text class="py-4">{{ alertDialogMessage }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="showAlertDialog = false">Aceptar</v-btn>
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
import { useContratoStore } from '@/stores/contrato';

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
  archivoFile?: File | null;
  fase: string;
}

interface UsuarioExtendida extends Usuario {
  nombreCompleto: string;
}

interface ContratoFinal {
  nombre: string;
  ruta: string;
}

// --- Tipos de contrato y pasos ---
const tiposContrato = ref([
  { nombre: 'Prestación de Servicios', valor: 'prestacion' },
  { nombre: 'Temporal', valor: 'temporal' },
  { nombre: 'Laboral', valor: 'laboral' },
]);

const pasosPrestacion: Paso[] = [
  { nombre: 'Inicio Contrato', completado: false, fase: 'Inicio' },
  { nombre: 'Firma Documentos', completado: false, fase: 'Inicio' },
  { nombre: 'Afiliación Seguridad Social', completado: false, fase: 'Inicio' },
];
const pasosTemporal: Paso[] = [
  { nombre: 'Solicitud Personal', completado: false, fase: 'Inicio' },
  { nombre: 'Entrevista Inicial', completado: false, fase: 'Inicio' },
  { nombre: 'Pruebas Psicotécnicas', completado: false, fase: 'Inicio' },
  { nombre: 'Examen Médico Pre-ocupacional', completado: false, fase: 'Inicio' },
  { nombre: 'Contratación y Documentación', completado: false, fase: 'Inicio' },
];
const pasosLaboral: Paso[] = [
  { nombre: 'Proceso de Selección', completado: false, fase: 'Inicio' },
  { nombre: 'Verificación de Referencias', completado: false, fase: 'Inicio' },
  { nombre: 'Entrevista Final', completado: false, fase: 'Inicio' },
  { nombre: 'Examen Médico de Ingreso', completado: false, fase: 'Inicio' },
  { nombre: 'Firma de Contrato', completado: false, fase: 'Inicio' },
  { nombre: 'Inducción y Bienvenida', completado: false, fase: 'Inicio' },
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
const contratoStore = useContratoStore();

// --- Diálogo de Alerta Personalizado ---
const showAlertDialog = ref(false);
const alertDialogTitle = ref('');
const alertDialogMessage = ref('');

const showAlert = (title: string, message: string) => {
  alertDialogTitle.value = title;
  alertDialogMessage.value = message;
  showAlertDialog.value = true;
};

// --- Propiedades computadas ---
const pasosInicio = computed(() => {
  if (tipoContratoSeleccionado.value === 'prestacion') return pasosPrestacion;
  if (tipoContratoSeleccionado.value === 'temporal') return pasosTemporal;
  if (tipoContratoSeleccionado.value === 'laboral') return pasosLaboral;
  return [];
});

const usuarioSeleccionadoNombreCompleto = computed(() => {
  const usuario = usuarios.value.find(u => u.id === usuarioSeleccionado.value);
  return usuario ? usuario.nombres + ' ' + usuario.apellidos : 'el usuario';
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
    modalPaso.value.form.archivo = paso.archivoFile || null;
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
    pasoACompletar.completado = true;
    pasoACompletar.observacion = modalPaso.value.form.observacion;
    pasoACompletar.fechaCompletado = new Date().toISOString().split('T')[0];
    pasoACompletar.archivoFile = modalPaso.value.form.archivo;
    pasoACompletar.nombreArchivo = modalPaso.value.form.archivo?.name || undefined;

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

// ✅ Nuevo método para "Guardar Pasos" localmente
function guardarPasosLocally() {
  if (!usuarioSeleccionado.value || !tipoContratoSeleccionado.value) {
    showAlert('Advertencia', 'Por favor, seleccione un usuario y un tipo de contrato primero.');
    return;
  }

  const allStepsCompleted = pasosInicio.value.every(paso => paso.completado);

  if (allStepsCompleted) {
    showAlert('Éxito', '¡Todos los pasos han sido completados y guardados localmente!');
  } else {
    showAlert('Información', 'Los pasos incompletos se guardarán localmente. Asegúrese de completar todos los pasos antes de anexar el contrato.');
  }
  // No se realiza ninguna llamada al backend aquí. Los pasos se envían con anexarContratoFinal.
}


async function anexarContratoFinal() {
  if (usuarioSeleccionado.value && archivoContrato.value && tipoContratoSeleccionado.value) {
    // Opcional: Puedes añadir una validación aquí para asegurar que todos los pasos importantes estén completados
    // antes de permitir anexar el contrato final.
    const allStepsCompleted = pasosInicio.value.every(paso => paso.completado);
    if (!allStepsCompleted) {
      const confirm = await showConfirm(
        'Pasos Incompletos',
        'No todos los pasos están marcados como completados. ¿Desea continuar de todos modos?'
      );
      if (!confirm) {
        return;
      }
    }


    try {
      const fechaInicio = new Date().toISOString().split('T')[0];

      const payload = {
        usuarioId: usuarioSeleccionado.value,
        archivoContrato: archivoContrato.value,
        tipoContrato: tipoContratoSeleccionado.value,
        fechaInicio: fechaInicio,
        pasos: pasosInicio.value // Send the current state of the steps
      };

      const nuevoContrato = await anexarContrato(payload);

      contratoStore.addContrato(nuevoContrato);

      contratoFinal.value = {
        nombre: nuevoContrato.nombreArchivoContratoFisico || '',
        ruta: nuevoContrato.rutaArchivoContratoFisico || ''
      };

      showAlert('Éxito', `El contrato ${contratoFinal.value.nombre} ha sido anexado correctamente al usuario ${usuarioSeleccionadoNombreCompleto.value}.`);

    } catch (error: any) {
      console.error('Error al anexar el contrato:', error);
      showAlert('Error', `Hubo un error al anexar el contrato: ${error.message || 'error desconocido'}.`);
    }
  } else {
    showAlert('Advertencia', 'Por favor, seleccione un usuario, un tipo de contrato y adjunte un archivo.');
  }
}

// Helper para mostrar confirmaciones personalizadas (añadido para la validación de pasos)
const showConfirm = (title: string, message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const confirmDialog = document.createElement('div');
    confirmDialog.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h3 style="margin-bottom: 10px;">${title}</h3>
        <p style="margin-bottom: 20px;">${message}</p>
        <button id="confirmBtn" style="background-color: #1976D2; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">Confirmar</button>
        <button id="cancelBtn" style="background-color: #B0BEC5; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">Cancelar</button>
      </div>
    `;
    confirmDialog.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background-color: white; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      z-index: 1000; width: 90%; max-width: 400px;
    `;
    document.body.appendChild(confirmDialog);

    const confirmBtn = confirmDialog.querySelector('#confirmBtn');
    const cancelBtn = confirmDialog.querySelector('#cancelBtn');

    confirmBtn?.addEventListener('click', () => {
      document.body.removeChild(confirmDialog);
      resolve(true);
    });
    cancelBtn?.addEventListener('click', () => {
      document.body.removeChild(confirmDialog);
      resolve(false);
    });
  });
};


// --- Watchers y ciclo de vida ---
watch(razonSocialSeleccionada, (newId) => {
  if (newId) {
    cargarUsuariosPorRazonSocial();
  } else {
    usuarios.value = [];
    usuarioSeleccionado.value = null;
    pasosInicio.value.forEach(p => {
      p.completado = false;
      p.observacion = undefined;
      p.nombreArchivo = undefined;
      p.fechaCompletado = undefined;
      p.archivoFile = null;
    });
    archivoContrato.value = null;
    contratoFinal.value = null;
    contratoStore.resetState();
  }
});

watch(usuarioSeleccionado, (newId) => {
  if (newId) {
    console.log(`Usuario ${newId} seleccionado. Iniciando nuevo proceso de contrato...`);
    // Reiniciar el estado para el nuevo usuario
    pasosInicio.value.forEach(p => {
      p.completado = false;
      p.observacion = undefined;
      p.nombreArchivo = undefined;
      p.fechaCompletado = undefined;
      p.archivoFile = null;
    });
    archivoContrato.value = null;
    contratoFinal.value = null;
    contratoStore.resetState();
  }
});

watch(tipoContratoSeleccionado, () => {
    // Reiniciar pasos al cambiar el tipo de contrato
    pasosInicio.value.forEach(p => {
      p.completado = false;
      p.observacion = undefined;
      p.nombreArchivo = undefined;
      p.fechaCompletado = undefined;
      p.archivoFile = null;
    });
    archivoContrato.value = null;
    contratoFinal.value = null;
    contratoStore.resetState();
});

onMounted(() => {
  cargarRazonesSociales();
});
</script>

<style scoped>
/* Estilos adicionales si los necesitas */
</style>
