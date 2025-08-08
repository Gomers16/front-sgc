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
          <v-col cols="12" md="4">
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
          <v-col cols="12" md="4">
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
          <v-col cols="12" md="4">
            <v-select
              v-model="tipoContratoSeleccionado"
              :items="tiposContratoSelectItems"
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
    <v-card elevation="2" class="mb-6" v-if="usuarioSeleccionado">
      <v-card-title class="text-h6 font-weight-bold bg-blue-grey-lighten-5">
        Datos del Contrato
      </v-card-title>
      <v-card-text>
        <v-form @submit.prevent="handleConfirmacion" class="form">
          <v-row dense>
            <v-col cols="12" md="6">
              <v-text-field
                label="Número de Identificación"
                v-model="identificacion"
                :error-messages="identificacionError"
                required
                variant="outlined"
                clearable
                density="compact"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                label="Sede"
                v-model="sedeId"
                :items="sedes"
                item-title="nombre"
                item-value="id"
                :error-messages="sedeIdError"
                required
                variant="outlined"
                clearable
                density="compact"
                :loading="loadingSedes"
              ></v-select>
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                label="Cargo"
                v-model="cargoId"
                :items="cargos"
                item-title="nombre"
                item-value="id"
                :error-messages="cargoIdError"
                required
                variant="outlined"
                clearable
                density="compact"
                :loading="loadingCargos"
              ></v-select>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                label="Salario Base"
                v-model="salarioBasico"
                :error-messages="salarioBasicoError"
                type="number"
                prefix="$"
                required
                variant="outlined"
                clearable
                density="compact"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                label="Bono Salarial"
                v-model="bonoSalarial"
                :error-messages="bonoSalarialError"
                type="number"
                prefix="$"
                variant="outlined"
                clearable
                density="compact"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                label="Auxilio de Transporte"
                v-model="auxilioTransporte"
                :error-messages="auxilioTransporteError"
                type="number"
                prefix="$"
                variant="outlined"
                clearable
                density="compact"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                label="Auxilio No Salarial"
                v-model="auxilioNoSalarial"
                :error-messages="auxilioNoSalarialError"
                type="number"
                prefix="$"
                variant="outlined"
                clearable
                density="compact"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                label="Salario Total Calculado"
                :model-value="salarioTotalCalculado"
                readonly
                prefix="$"
                variant="outlined"
                density="compact"
                class="font-weight-bold"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                label="Fecha de Inicio"
                v-model="fechaInicio"
                type="date"
                required
                variant="outlined"
                clearable
                density="compact"
              />
            </v-col>
            <v-col cols="12" md="6"
              v-if="tipoContratoSeleccionado === 'temporal' || (tipoContratoSeleccionado === 'laboral' && terminoContrato !== 'indefinido')">
              <v-text-field
                label="Fecha de Terminación"
                v-model="fechaTerminacion"
                type="date"
                variant="outlined"
                clearable
                density="compact"
              />
            </v-col>
            <v-col cols="12" md="6" v-if="tipoContratoSeleccionado === 'laboral'">
              <v-select
                label="Término de Contrato"
                v-model="terminoContrato"
                :items="terminosContratoLaboral"
                item-title="text"
                item-value="value"
                :error-messages="terminoContratoError"
                variant="outlined"
                clearable
                density="compact"
                required
              ></v-select>
            </v-col>
            <v-col cols="12" md="6" v-else-if="tipoContratoSeleccionado === 'temporal'">
              <v-select
                label="Término de Contrato"
                v-model="terminoContrato"
                :items="terminosContratoTemporal"
                item-title="text"
                item-value="value"
                :error-messages="terminoContratoError"
                variant="outlined"
                clearable
                density="compact"
                required
              ></v-select>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                label="Centro de Costo"
                v-model="centroCosto"
                :error-messages="centroCostoError"
                variant="outlined"
                clearable
                density="compact"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                label="Funciones y Objeto del Cargo"
                v-model="funcionesCargo"
                :error-messages="funcionesCargoError"
                rows="2"
                variant="outlined"
                clearable
                density="compact"
              />
            </v-col>
            <v-col cols="12">
              <v-divider class="my-4"></v-divider>
              <h4 class="text-h6 text-center">Afiliaciones y Seguridad Social</h4>
              <v-divider class="my-4"></v-divider>
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                label="EPS"
                v-model="epsId"
                :items="filteredEps"
                item-title="nombre"
                item-value="id"
                :error-messages="epsIdError"
                variant="outlined"
                clearable
                density="compact"
                :loading="loadingEntidades"
              ></v-select>
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                label="ARL"
                v-model="arlId"
                :items="filteredArl"
                item-title="nombre"
                item-value="id"
                :error-messages="arlIdError"
                variant="outlined"
                clearable
                density="compact"
                :loading="loadingEntidades"
              ></v-select>
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                label="AFP"
                v-model="afpId"
                :items="filteredAfp"
                item-title="nombre"
                item-value="id"
                :error-messages="afpIdError"
                variant="outlined"
                clearable
                density="compact"
                :loading="loadingEntidades"
              ></v-select>
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                label="AFC"
                v-model="afcId"
                :items="filteredAfc"
                item-title="nombre"
                item-value="id"
                :error-messages="afcIdError"
                variant="outlined"
                clearable
                density="compact"
                :loading="loadingEntidades"
              ></v-select>
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                label="CCF"
                v-model="ccfId"
                :items="filteredCcf"
                item-title="nombre"
                item-value="id"
                :error-messages="ccfIdError"
                variant="outlined"
                clearable
                density="compact"
                :loading="loadingEntidades"
              ></v-select>
            </v-col>

            <v-col cols="12">
              <v-divider class="my-4"></v-divider>
              <h4 class="text-h6 text-center">Recomendaciones Médicas</h4>
              <v-divider class="my-4"></v-divider>
            </v-col>
            <v-col cols="12" md="6">
              <v-checkbox
                v-model="tieneRecomendacionesMedicas"
                label="¿Requiere Recomendaciones Médicas?"
                density="compact"
                hide-details
                class="mt-0"
              ></v-checkbox>
            </v-col>
            <v-col cols="12" md="6">
              <v-file-input
                v-model="archivoRecomendacionMedica"
                label="Adjuntar Archivo de Recomendación Médica"
                accept=".pdf,.doc,.docx"
                variant="outlined"
                density="compact"
                prepend-icon="mdi-file-upload"
                :disabled="!tieneRecomendacionesMedicas"
                :rules="tieneRecomendacionesMedicas ? [(v) => !!v || 'Archivo requerido'] : []"
                clearable
              ></v-file-input>
            </v-col>
            </v-row>
        </v-form>
      </v-card-text>
    </v-card>
    <v-card elevation="2" v-if="usuarioSeleccionado" class="mt-6">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <h3 class="text-h6 mb-4">Pasos del Contrato</h3>
            <v-card class="pa-4">
              <v-timeline side="end" density="compact">
                <v-timeline-item
                  v-for="(paso, index) in pasosContrato"
                  :key="index"
                  :dot-color="paso.completado ? 'success' : 'grey'"
                  size="small"
                >
                  <div class="d-flex align-center justify-space-between w-100">
                    <span class="font-weight-medium">{{ paso.nombre }}</span>
                    <v-btn
                      v-if="!paso.completado && (index === 0 || pasosContrato[index - 1]?.completado)"
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
                  <div v-if="paso.nombre === 'Recomendaciones Médicas' && paso.completado" class="mt-2">
                    <v-file-input
                      label="Adjuntar Recomendación Médica (Seguimiento)"
                      variant="outlined"
                      density="compact"
                      show-size
                      prepend-icon="mdi-file-upload"
                      @change="onFileRecomendacionChange($event, paso)"
                    ></v-file-input>
                    <v-btn
                      v-if="paso.archivoUrl"
                      class="mt-2"
                      :href="paso.archivoUrl"
                      target="_blank"
                      color="info"
                      size="small"
                    >
                      Ver Adjunto Actual
                    </v-btn>
                  </div>
                </v-timeline-item>
              </v-timeline>
              <v-alert v-if="loadingPasos" type="info" variant="tonal" class="mt-4">
                Cargando pasos...
              </v-alert>
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <h4 class="text-h6 mb-4">Anexar Contrato</h4>
            <v-card class="pa-4">
              <v-file-input
                label="Subir archivo del contrato físico"
                variant="outlined"
                density="compact"
                show-size
                accept="application/pdf"
                prepend-icon="mdi-file-upload"
                class="mb-4"
                @change="onFileChange"
                ref="fileInputRef"
              ></v-file-input>
              <v-alert
                v-if="!archivoContrato"
                type="info"
                variant="tonal"
              >
                Adjunte el archivo del contrato para anexarlo al usuario.
              </v-alert>
              <v-alert
                v-else
                type="success"
                variant="tonal"
              >
                Archivo **{{ archivoContrato.name }}** listo para anexar.
              </v-alert>
            </v-card>
          </v-col>
        </v-row>
        <v-card-actions class="d-flex justify-end pr-4 pb-4 mt-4">
          <v-btn
            color="success"
            prepend-icon="mdi-content-save-check"
            :disabled="!usuarioSeleccionado || !archivoContrato"
            @click="handleConfirmacion"
          >
            Crear y Anexar Contrato
          </v-btn>
        </v-card-actions>
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
    <v-dialog v-model="showConfirmDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h6 bg-warning text-white">Confirmar Acción</v-card-title>
        <v-card-text class="py-4">
          ¿Estás seguro de que quieres crear y anexar el contrato? Esta acción es irreversible.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="showConfirmDialog = false">Cancelar</v-btn>
          <v-btn color="success" variant="flat" @click="submitForm">Confirmar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useForm, useField } from 'vee-validate';
import { listarRazonesSociales, fetchUsuariosPorRazonSocial } from '@/services/razonSocialService';
import { obtenerSedes, obtenerCargos, obtenerEntidadesSalud } from '@/services/UserService';
import { anexarContrato, crearContrato } from '@/services/contratoService';
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
  archivoUrl?: string;
  archivoFile?: File | null;
  fase: 'inicio' | 'desarrollo' | 'fin';
  orden?: number;
}
interface UsuarioExtendida {
  id: number;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  recomendaciones: boolean;
  razonSocialId: number;
}
interface ContratoFinal {
  nombre: string;
  ruta: string;
}

// --- Tipos de contrato y pasos ---
const tiposContratoSelectItems = ref([
  { nombre: 'Prestación de Servicios', valor: 'prestacion' },
  { nombre: 'Temporal', valor: 'temporal' },
  { nombre: 'Laboral', valor: 'laboral' },
]);

// Definición de los pasos base por tipo de contrato (SIN "Recomendaciones Médicas" inicialmente)
const basePasosPrestacion: Paso[] = [
  { nombre: 'Inicio Contrato', completado: false, fase: 'inicio', orden: 1 },
  { nombre: 'Firma Documentos', completado: false, fase: 'inicio', orden: 2 },
  { nombre: 'Afiliación Seguridad Social', completado: false, fase: 'inicio', orden: 3 },
];
const basePasosTemporal: Paso[] = [
  { nombre: 'Solicitud Personal', completado: false, fase: 'inicio', orden: 1 },
  { nombre: 'Entrevista Inicial', completado: false, fase: 'inicio', orden: 2 },
  { nombre: 'Pruebas Psicotécnicas', completado: false, fase: 'inicio', orden: 3 },
  { nombre: 'Examen Médico Pre-ocupacional', completado: false, fase: 'inicio', orden: 4 },
  { nombre: 'Contratación y Documentación', completado: false, fase: 'inicio', orden: 5 },
];
const basePasosLaboral: Paso[] = [
  { nombre: 'Proceso de Selección', completado: false, fase: 'inicio', orden: 1 },
  { nombre: 'Verificación de Referencias', completado: false, fase: 'inicio', orden: 2 },
  { nombre: 'Entrevista Final', completado: false, fase: 'inicio', orden: 3 },
  { nombre: 'Examen Médico de Ingreso', completado: false, fase: 'inicio', orden: 4 },
  { nombre: 'Firma de Contrato', completado: false, fase: 'inicio', orden: 5 },
  { nombre: 'Inducción y Bienvenida', completado: false, fase: 'inicio', orden: 6 },
];

// Función para formatear los términos de contrato para la visualización
const formatTermForDisplay = (term: string) => {
  // Reemplaza guiones bajos con espacios y capitaliza la primera letra de cada palabra
  return term.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// Términos de contrato específicos para cada tipo, ahora como objetos con 'text' y 'value'
const terminosContratoTemporal = computed(() => [
  { text: formatTermForDisplay('obra_o_labor_determinada'), value: 'obra_o_labor_determinada' }
]);
const terminosContratoLaboral = computed(() => [
  { text: formatTermForDisplay('fijo'), value: 'fijo' },
  { text: formatTermForDisplay('obra_o_labor_determinada'), value: 'obra_o_labor_determinada' },
  { text: formatTermForDisplay('indefinido'), value: 'indefinido' }
]);

// --- Estado de la vista ---
const razonSocialSeleccionada = ref<number | null>(null);
const usuarioSeleccionado = ref<number | null>(null); // Contiene solo el ID del usuario seleccionado en el v-select
const tipoContratoSeleccionado = ref('prestacion'); // Valor inicial para el tipo de contrato
const razonesSociales = ref<RazonSocial[]>([]);
const usuarios = ref<UsuarioExtendida[]>([]); // Lista completa de usuarios con sus propiedades
const sedes = ref<any[]>([]);
const cargos = ref<any[]>([]);
const entidadesSalud = ref<any[]>([]);
const loadingRazonesSociales = ref(false);
const loadingUsuarios = ref(false);
const loadingSedes = ref(false);
const loadingCargos = ref(false);
const loadingEntidades = ref(false);
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
const fileInputRef = ref(null); // Referencia al v-file-input

// Nuevos estados para Recomendaciones Médicas en el formulario principal
const tieneRecomendacionesMedicas = ref(false);
const archivoRecomendacionMedica = ref<File | null>(null);

// --- Inicializa el store de Pinia ---
const contratoStore = useContratoStore();

// --- Diálogo de Alerta Personalizado ---
const showAlertDialog = ref(false);
const alertDialogTitle = ref('');
const alertDialogMessage = ref('');
const showAlert = (title: string, message: string) => {
  console.log(`Alerta: ${title} - ${message}`); // Agregado para depuración
  alertDialogTitle.value = title;
  alertDialogMessage.value = message;
  showAlertDialog.value = true;
};

// --- Nuevo: Modal de Confirmación ---
const showConfirmDialog = ref(false);
// Se obtiene la función `validate` del `useForm` para la validación explícita
const { handleSubmit, resetForm, validate } = useForm();

const handleConfirmacion = async () => {
  // 🚀 Paso 1: Validar todos los campos del formulario usando VeeValidate
  const { valid, errors } = await validate();

  if (!valid) {
    console.error('Errores de validación detectados:', errors);
    showAlert('Error de Validación', 'Por favor, corrija los errores en el formulario antes de continuar. Revise los campos marcados en rojo.');
    return; // Detiene la ejecución si hay errores de validación
  }

  // 🚀 Paso 2: Validaciones adicionales que no son cubiertas por VeeValidate directamente
  if (!usuarioSeleccionado.value || !tipoContratoSeleccionado.value) {
    showAlert('Advertencia', 'Por favor, seleccione un usuario y un tipo de contrato.');
    return;
  }
  if (!archivoContrato.value) {
    showAlert('Advertencia', 'Por favor, adjunte un archivo de contrato para continuar.');
    return;
  }
  // Validación para Recomendaciones Médicas si el checkbox está marcado
  if (tieneRecomendacionesMedicas.value && !archivoRecomendacionMedica.value) {
    showAlert('Advertencia', 'Por favor, adjunte el archivo de Recomendación Médica o desmarque la opción.');
    return;
  }

  // 🚀 Paso 3: Si todas las validaciones pasan, mostrar el modal de confirmación
  console.log('Todas las validaciones pasaron. Mostrando modal de confirmación...'); // Agregado para depuración
  showConfirmDialog.value = true;
};

const submitForm = handleSubmit(async (values) => {
  // Esta parte solo se ejecuta si el formulario es válido según las reglas de VeeValidate
  console.log('Formulario válido. Procediendo a crear y anexar contrato...'); // Agregado para depuración
  showConfirmDialog.value = false;
  await crearYAnexarContrato(values);
});

// --- Propiedades computadas ---
// Obtiene el objeto completo del usuario seleccionado para acceder a sus propiedades (ej. 'recomendaciones')
const selectedUserObject = computed(() => {
  return usuarios.value.find(u => u.id === usuarioSeleccionado.value) || null;
});

// Define los pasos del contrato dinámicamente según el tipo de contrato y las recomendaciones del usuario
const pasosContrato = computed(() => {
  let currentPasos: Paso[] = [];
  if (tipoContratoSeleccionado.value === 'prestacion') {
    currentPasos = [...basePasosPrestacion];
  } else if (tipoContratoSeleccionado.value === 'temporal') {
    currentPasos = [...basePasosTemporal];
  } else if (tipoContratoSeleccionado.value === 'laboral') {
    currentPasos = [...basePasosLaboral];
  }

  // Añade el paso de "Recomendaciones Médicas" solo si el usuario seleccionado tiene la propiedad 'recomendaciones' en true
  // Este paso es para la línea de tiempo de seguimiento, no para el campo de adjunto inicial.
  if (selectedUserObject.value && selectedUserObject.value.recomendaciones) {
    // Crea una copia del paso para evitar mutaciones directas en los arrays base
    const recomendacionPaso: Paso = {
      nombre: 'Recomendaciones Médicas',
      completado: false, // Se reinicia al seleccionar un nuevo usuario/contrato
      fase: 'inicio',
      orden: 99, // Un orden alto para que aparezca al final de los pasos iniciales
    };
    // Busca si ya existe un paso similar para evitar duplicados y mantener el estado si ya fue completado
    const existingPaso = currentPasos.find(p => p.nombre === 'Recomendaciones Médicas');
    if (!existingPaso) {
      currentPasos.push(recomendacionPaso);
    } else {
      // Si ya existe, actualiza su estado con el de la plantilla (ej. reinicia 'completado')
      Object.assign(existingPaso, recomendacionPaso);
    }
  }

  // Reordena los pasos por su propiedad 'orden'
  return currentPasos.map((p, index) => ({ ...p, orden: index + 1 })).sort((a, b) => (a.orden || 0) - (b.orden || 0));
});

const usuarioSeleccionadoNombreCompleto = computed(() => {
  return selectedUserObject.value ? selectedUserObject.value.nombreCompleto : 'el usuario';
});

// Propiedades computadas para filtrar las entidades de salud por tipo
const filteredEps = computed(() => entidadesSalud.value.filter(e => e.tipo === 'eps'));
const filteredArl = computed(() => entidadesSalud.value.filter(e => e.tipo === 'arl'));
const filteredAfp = computed(() => entidadesSalud.value.filter(e => e.tipo === 'afp'));
const filteredAfc = computed(() => entidadesSalud.value.filter(e => e.tipo === 'afc'));
const filteredCcf = computed(() => entidadesSalud.value.filter(e => e.tipo === 'ccf'));

// Cálculo de Salario Total
const salarioTotalCalculado = computed(() => {
  const sb = Number(salarioBasico.value) || 0;
  const bs = Number(bonoSalarial.value) || 0;
  const at = Number(auxilioTransporte.value) || 0;
  const ans = Number(auxilioNoSalarial.value) || 0;
  return (sb + bs + at + ans).toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
});

// --- Validaciones con VeeValidate ---
const required = (value: any) => (value !== null && value !== undefined && value !== '') || 'Este campo es obligatorio.';
const optionalNumber = (value: any) => {
  if (value === null || value === undefined || value === '') return true;
  return !isNaN(Number(value)) || 'Debe ser un número válido.';
};

const { value: identificacion, errorMessage: identificacionError } = useField('identificacion', [required, (val: string) => val.length >= 5 || 'Debe tener al menos 5 caracteres.']);
const { value: sedeId, errorMessage: sedeIdError } = useField<number | null>('sedeId', [required], { initialValue: null });
const { value: cargoId, errorMessage: cargoIdError } = useField<number | null>('cargoId', [required], { initialValue: null });
const { value: funcionesCargo, errorMessage: funcionesCargoError } = useField('funcionesCargo', [required], { initialValue: '' });
const { value: salarioBasico, errorMessage: salarioBasicoError } = useField('salarioBasico', [required, optionalNumber], { initialValue: null });
// Campos de salario adicionales con validación
const { value: bonoSalarial, errorMessage: bonoSalarialError } = useField('bonoSalarial', [optionalNumber], { initialValue: 0 });
const { value: auxilioTransporte, errorMessage: auxilioTransporteError } = useField('auxilioTransporte', [optionalNumber], { initialValue: 0 });
const { value: auxilioNoSalarial, errorMessage: auxilioNoSalarialError } = useField('auxilioNoSalarial', [optionalNumber], { initialValue: 0 });
// Fin de campos de salario adicionales

const { value: fechaInicio, errorMessage: fechaInicioError } = useField('fechaInicio', [required], { initialValue: '' });
const { value: fechaTerminacion, errorMessage: fechaTerminacionError } = useField('fechaTerminacion', undefined, { initialValue: '' });

// **LA CORRECCIÓN ESTÁ AQUÍ:** Dinamizar la regla de validación de terminoContrato
const terminoContratoRules = computed(() => {
  return tipoContratoSeleccionado.value !== 'prestacion' ? [required] : [];
});
const { value: terminoContrato, errorMessage: terminoContratoError } = useField('terminoContrato', terminoContratoRules, { initialValue: null });
// **FIN DE LA CORRECCIÓN**

const { value: centroCosto, errorMessage: centroCostoError } = useField('centroCosto', undefined, { initialValue: '' });
const { value: epsId, errorMessage: epsIdError } = useField<number | null>('epsId', [required], { initialValue: null });
const { value: arlId, errorMessage: arlIdError } = useField<number | null>('arlId', [required], { initialValue: null });
const { value: afpId, errorMessage: afpIdError } = useField<number | null>('afpId', [required], { initialValue: null });
const { value: afcId, errorMessage: afcIdError } = useField<number | null>('afcId', undefined, { initialValue: null });
const { value: ccfId, errorMessage: ccfIdError } = useField<number | null>('ccfId', [required], { initialValue: null });

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
  usuarios.value = []; // Limpia la lista de usuarios
  usuarioSeleccionado.value = null; // Limpia el ID del usuario seleccionado
  if (razonSocialSeleccionada.value) {
    try {
      const data = await fetchUsuariosPorRazonSocial(razonSocialSeleccionada.value);
      // Asegúrate de que la propiedad 'recomendaciones' esté presente en los datos del usuario
      usuarios.value = data.map((u: any) => ({
        ...u,
        nombreCompleto: `${u.nombres} ${u.apellidos}`,
        recomendaciones: u.recomendaciones || false, // Asegura que siempre exista esta propiedad
      }));
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      loadingUsuarios.value = false;
    }
  }
}

async function cargarSedes() {
  loadingSedes.value = true;
  try {
    const data = await obtenerSedes();
    sedes.value = data;
  } catch (error) {
    console.error('Error al cargar sedes:', error);
  } finally {
    loadingSedes.value = false;
  }
}

async function cargarCargos() {
  loadingCargos.value = true;
  try {
    const data = await obtenerCargos();
    cargos.value = data;
  } catch (error) {
    console.error('Error al cargar cargos:', error);
  } finally {
    loadingCargos.value = false;
  }
}

async function cargarEntidadesSalud() {
  loadingEntidades.value = true;
  try {
    const data = await obtenerEntidadesSalud();
    entidadesSalud.value = data;
  } catch (error) {
    console.error('Error al cargar entidades de salud:', error);
  } finally {
    loadingEntidades.value = false;
  }
}

async function crearYAnexarContrato(formData: any) {
  if (!usuarioSeleccionado.value || !archivoContrato.value) {
    console.error('Falta el ID de usuario o el archivo del contrato.');
    showAlert('Error', 'No se puede crear el contrato. Falta información clave.');
    return;
  }

  try {
    // Llama al servicio para crear el contrato en la base de datos
    const nuevoContrato = await crearContrato({
      usuarioId: usuarioSeleccionado.value,
      tipoContrato: tipoContratoSeleccionado.value,
      identificacion: formData.identificacion,
      sedeId: formData.sedeId,
      cargoId: formData.cargoId,
      funcionesCargo: formData.funcionesCargo,
      salarioBasico: formData.salarioBasico,
      bonoSalarial: formData.bonoSalarial,
      auxilioTransporte: formData.auxilioTransporte,
      auxilioNoSalarial: formData.auxilioNoSalarial,
      fechaInicio: formData.fechaInicio,
      fechaTerminacion: formData.fechaTerminacion,
      terminoContrato: formData.terminoContrato,
      centroCosto: formData.centroCosto,
      epsId: formData.epsId,
      arlId: formData.arlId,
      afpId: formData.afpId,
      afcId: formData.afcId,
      ccfId: formData.ccfId,
      tieneRecomendacionesMedicas: tieneRecomendacionesMedicas.value,
    });

    console.log('Contrato creado exitosamente:', nuevoContrato);

    // Si se creó el contrato, ahora anexa el archivo físico
    const idContrato = nuevoContrato.id;

    const anexarResponse = await anexarContrato(idContrato, archivoContrato.value);
    console.log('Archivo anexado exitosamente:', anexarResponse);

    // Si el usuario tiene recomendaciones médicas y se adjuntó un archivo, anéxalo también
    if (tieneRecomendacionesMedicas.value && archivoRecomendacionMedica.value) {
      await anexarArchivoRecomendacion(idContrato, archivoRecomendacionMedica.value);
    }

    showAlert('Contrato Creado', `El contrato para ${usuarioSeleccionadoNombreCompleto.value} ha sido creado y anexado correctamente.`);
    resetForm();
    archivoContrato.value = null; // Limpiar el archivo subido
    archivoRecomendacionMedica.value = null; // Limpiar el archivo de recomendación
    if (fileInputRef.value) {
      (fileInputRef.value as any).reset(); // Restablece el componente v-file-input
    }

  } catch (error) {
    console.error('Error al crear o anexar el contrato:', error);
    showAlert('Error', 'Hubo un problema al crear o anexar el contrato. Por favor, inténtelo de nuevo.');
  }
}

// Función para anexar el archivo de recomendación médica
async function anexarArchivoRecomendacion(contratoId: number, archivo: File) {
  try {
    const response = await anexarContrato(contratoId, archivo, 'recomendacion_medica');
    console.log('Archivo de recomendación médica anexado:', response);
  } catch (error) {
    console.error('Error al anexar el archivo de recomendación médica:', error);
    // Manejar el error apropiadamente
  }
}

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    archivoContrato.value = target.files[0];
  } else {
    archivoContrato.value = null;
  }
};

const onFileRecomendacionChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    archivoRecomendacionMedica.value = target.files[0];
  } else {
    archivoRecomendacionMedica.value = null;
  }
};

const abrirModalPaso = (paso: Paso) => {
  modalPaso.value.paso = paso;
  modalPaso.value.form.observacion = paso.observacion || '';
  modalPaso.value.form.archivo = paso.archivoFile || null;
  modalPaso.value.mostrar = true;
};

const cerrarModalPaso = () => {
  modalPaso.value.mostrar = false;
  modalPaso.value.paso = null;
  modalPaso.value.form = { observacion: '', archivo: null };
};

const completarPasoConfirmado = async () => {
  if (!modalPaso.value.paso) return;

  const paso = modalPaso.value.paso;
  const observacion = modalPaso.value.form.observacion;
  const archivo = modalPaso.value.form.archivo;

  if (!observacion) {
    showAlert('Error', 'La observación es obligatoria para completar este paso.');
    return;
  }

  // Lógica para actualizar el estado del paso
  paso.completado = true;
  paso.observacion = observacion;
  paso.fechaCompletado = new Date().toISOString().slice(0, 10);

  if (archivo) {
    // Aquí podrías tener la lógica para subir el archivo y obtener su URL
    paso.nombreArchivo = archivo.name;
    paso.archivoFile = archivo;
    // Simulación de una URL del archivo
    paso.archivoUrl = URL.createObjectURL(archivo);
  }

  // Lógica para persistir el cambio en la base de datos si fuera necesario
  console.log(`Paso '${paso.nombre}' actualizado con éxito.`, paso);

  cerrarModalPaso();
};


// --- Watchers para lógica de la vista ---
watch(razonSocialSeleccionada, (newVal) => {
  if (newVal) {
    cargarUsuariosPorRazonSocial();
  }
});

watch(usuarioSeleccionado, (newVal) => {
  if (newVal) {
    // Si se selecciona un nuevo usuario, reinicia el formulario
    resetForm();
    // Limpia el archivo de contrato
    archivoContrato.value = null;
    // Carga los datos específicos del usuario si es necesario
  }
});

watch(tipoContratoSeleccionado, (newVal, oldVal) => {
  // Limpiar el campo terminoContrato si se cambia a 'prestacion'
  if (newVal === 'prestacion') {
    terminoContrato.value = null;
  }
});

// Watcher para sincronizar el estado de la validación de Recomendaciones Médicas
watch(tieneRecomendacionesMedicas, (newVal) => {
  if (!newVal) {
    archivoRecomendacionMedica.value = null;
  }
});

// --- Lifecycle Hooks ---
onMounted(() => {
  cargarRazonesSociales();
  cargarSedes();
  cargarCargos();
  cargarEntidadesSalud();
});
</script>

<style scoped>
.form .v-col {
  padding-top: 4px;
  padding-bottom: 4px;
}
</style>
