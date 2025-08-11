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
                  <!-- Eliminado el bloque especial para 'Recomendaciones Médicas' en los pasos -->
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

    <!-- Historial de contratos del usuario -->
    <v-card elevation="2" v-if="usuarioSeleccionado" class="mt-6">
      <v-card-title class="text-h6 font-weight-bold bg-blue-grey-lighten-5">
        Historial de Contratos del Usuario
      </v-card-title>
      <v-card-text>
        <v-alert v-if="loadingContratos" type="info" variant="tonal" class="mb-4">
          Cargando historial de contratos...
        </v-alert>

        <v-alert v-else-if="!loadingContratos && contratosUsuario.length === 0" type="warning" variant="tonal" class="mb-4">
          Este usuario no tiene contratos registrados.
        </v-alert>

        <v-table v-else density="comfortable">
          <thead>
            <tr>
              <th class="text-left">#</th>
              <th class="text-left">Tipo</th>
              <th class="text-left">Término</th>
              <th class="text-left">Estado</th>
              <th class="text-left">Inicio</th>
              <th class="text-left">Terminación</th>
              <th class="text-left">Sede</th>
              <th class="text-left">Cargo</th>
              <th class="text-left">Archivo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in contratosUsuario" :key="c.id">
              <td>{{ c.id }}</td>
              <td class="text-capitalize">{{ c.tipoContrato }}</td>
              <td class="text-capitalize">{{ (c.terminoContrato || '—').replaceAll('_',' ') }}</td>
              <td>
                <v-chip :color="c.estado === 'activo' ? 'success' : 'grey'" size="small" variant="flat">
                  {{ c.estado }}
                </v-chip>
              </td>
              <td>{{ (c.fechaInicio || '').slice(0,10) }}</td>
              <td>{{ c.fechaTerminacion ? String(c.fechaTerminacion).slice(0,10) : '—' }}</td>
              <td>{{ c.sede?.nombre || '—' }}</td>
              <td>{{ c.cargo?.nombre || '—' }}</td>
              <td>
                <v-btn
                  v-if="c.rutaArchivoContratoFisico"
                  :href="c.rutaArchivoContratoFisico"
                  target="_blank"
                  size="x-small"
                  color="primary"
                  variant="tonal"
                  prepend-icon="mdi-file-pdf-box"
                >
                  Ver PDF
                </v-btn>
                <span v-else>—</span>
              </td>
            </tr>
          </tbody>
        </v-table>
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
import { anexarContrato, crearContrato, crearContratoSalario, obtenerContratosPorUsuario } from '@/services/contratoService';
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

// Definición de los pasos base por tipo de contrato (SIN "Recomendaciones Médicas" en pasos)
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
const usuarioSeleccionado = ref<number | null>(null);
const tipoContratoSeleccionado = ref('prestacion');
const razonesSociales = ref<RazonSocial[]>([]);
const usuarios = ref<UsuarioExtendida[]>([]);
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
const fileInputRef = ref(null);

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
  console.log(`Alerta: ${title} - ${message}`);
  alertDialogTitle.value = title;
  alertDialogMessage.value = message;
  showAlertDialog.value = true;
};

// --- Nuevo: Modal de Confirmación ---
const showConfirmDialog = ref(false);
const { handleSubmit, resetForm, validate } = useForm();

const handleConfirmacion = async () => {
  const { valid, errors } = await validate();

  if (!valid) {
    console.error('Errores de validación detectados:', errors);
    showAlert('Error de Validación', 'Por favor, corrija los errores en el formulario antes de continuar. Revise los campos marcados en rojo.');
    return;
  }

  if (!usuarioSeleccionado.value || !tipoContratoSeleccionado.value) {
    showAlert('Advertencia', 'Por favor, seleccione un usuario y un tipo de contrato.');
    return;
  }
  if (!archivoContrato.value) {
    showAlert('Advertencia', 'Por favor, adjunte un archivo de contrato para continuar.');
    return;
  }
  if (tieneRecomendacionesMedicas.value && !archivoRecomendacionMedica.value) {
    showAlert('Advertencia', 'Por favor, adjunte el archivo de Recomendación Médica o desmarque la opción.');
    return;
  }

  console.log('Todas las validaciones pasaron. Mostrando modal de confirmación...');
  showConfirmDialog.value = true;
};

const submitForm = handleSubmit(async (values) => {
  console.log('Formulario válido. Procediendo a crear y anexar contrato...');
  showConfirmDialog.value = false;
  await crearYAnexarContrato(values);
});

// --- Propiedades computadas ---
const selectedUserObject = computed(() => {
  return usuarios.value.find(u => u.id === usuarioSeleccionado.value) || null;
});

const pasosContrato = computed(() => {
  let currentPasos: Paso[] = [];
  if (tipoContratoSeleccionado.value === 'prestacion') {
    currentPasos = [...basePasosPrestacion];
  } else if (tipoContratoSeleccionado.value === 'temporal') {
    currentPasos = [...basePasosTemporal];
  } else if (tipoContratoSeleccionado.value === 'laboral') {
    currentPasos = [...basePasosLaboral];
  }

  // Eliminada la inserción del paso "Recomendaciones Médicas" en los pasos del contrato

  return currentPasos.map((p, index) => ({ ...p, orden: index + 1 })).sort((a, b) => (a.orden || 0) - (b.orden || 0));
});

const usuarioSeleccionadoNombreCompleto = computed(() => {
  return selectedUserObject.value ? selectedUserObject.value.nombreCompleto : 'el usuario';
});

const filteredEps = computed(() => entidadesSalud.value.filter(e => e.tipo === 'eps'));
const filteredArl = computed(() => entidadesSalud.value.filter(e => e.tipo === 'arl'));
const filteredAfp = computed(() => entidadesSalud.value.filter(e => e.tipo === 'afp'));
const filteredAfc = computed(() => entidadesSalud.value.filter(e => e.tipo === 'afc'));
const filteredCcf = computed(() => entidadesSalud.value.filter(e => e.tipo === 'ccf'));

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
const { value: bonoSalarial, errorMessage: bonoSalarialError } = useField('bonoSalarial', [optionalNumber], { initialValue: 0 });
const { value: auxilioTransporte, errorMessage: auxilioTransporteError } = useField('auxilioTransporte', [optionalNumber], { initialValue: 0 });
const { value: auxilioNoSalarial, errorMessage: auxilioNoSalarialError } = useField('auxilioNoSalarial', [optionalNumber], { initialValue: 0 });

const { value: fechaInicio, errorMessage: fechaInicioError } = useField('fechaInicio', [required], { initialValue: '' });
const { value: fechaTerminacion, errorMessage: fechaTerminacionError } = useField('fechaTerminacion', undefined, { initialValue: '' });

const terminoContratoRules = computed(() => {
  return tipoContratoSeleccionado.value !== 'prestacion' ? [required] : [];
});
const { value: terminoContrato, errorMessage: terminoContratoError } = useField('terminoContrato', terminoContratoRules, { initialValue: null });

const { value: centroCosto, errorMessage: centroCostoError } = useField('centroCosto', undefined, { initialValue: '' });
const { value: epsId, errorMessage: epsIdError } = useField<number | null>('epsId', [required], { initialValue: null });
const { value: arlId, errorMessage: arlIdError } = useField<number | null>('arlId', [required], { initialValue: null });
const { value: afpId, errorMessage: afpIdError } = useField<number | null>('afpId', [required], { initialValue: null });
const { value: afcId, errorMessage: afcIdError } = useField<number | null>('afcId', undefined, { initialValue: null });
const { value: ccfId, errorMessage: ccfIdError } = useField<number | null>('ccfId', [required], { initialValue: null });

// --- Historial de contratos del usuario ---
const contratosUsuario = ref<any[]>([])
const loadingContratos = ref(false)

async function cargarHistorialContratos() {
  if (!usuarioSeleccionado.value) {
    contratosUsuario.value = []
    return
  }
  loadingContratos.value = true
  try {
    const data = await obtenerContratosPorUsuario(Number(usuarioSeleccionado.value))
    contratosUsuario.value = data
  } catch (err) {
    console.error('Error al cargar historial de contratos:', err)
    contratosUsuario.value = []
  } finally {
    loadingContratos.value = false
  }
}

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
      usuarios.value = data.map((u: any) => ({
        ...u,
        nombreCompleto: `${u.nombres} ${u.apellidos}`,
        recomendaciones: u.recomendaciones || false,
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
  if (!usuarioSeleccionado.value || !archivoContrato.value || !razonSocialSeleccionada.value) {
    console.error('Falta el ID de usuario, el ID de razón social o el archivo del contrato.');
    showAlert('Error', 'No se puede crear el contrato. Falta información clave.');
    return;
  }

  // ¿Se requiere fechaTerminacion según el tipo/termino?
  const requiresEndDate =
    tipoContratoSeleccionado.value === 'temporal' ||
    (tipoContratoSeleccionado.value === 'laboral' && terminoContrato.value !== 'indefinido');

  // Solo columnas que existen en el modelo Contrato
  const payloadContrato = {
    usuarioId: Number(usuarioSeleccionado.value),
    razonSocialId: Number(razonSocialSeleccionada.value),

    identificacion: (identificacion.value || '').trim(),

    sedeId: sedeId.value ? Number(sedeId.value) : null,
    cargoId: cargoId.value ? Number(cargoId.value) : null,
    funcionesCargo: (funcionesCargo.value || '').trim() || null,

    fechaInicio: formData.fechaInicio,
    fechaTerminacion: requiresEndDate ? (formData.fechaTerminacion || null) : null,

    tipoContrato: tipoContratoSeleccionado.value as 'prestacion' | 'temporal' | 'laboral',
    terminoContrato:
      tipoContratoSeleccionado.value !== 'prestacion'
        ? (terminoContrato.value as 'fijo' | 'obra_o_labor' | 'indefinido' | null)
        : null,

    estado: 'activo',

    periodoPrueba: null,
    horarioTrabajo: null,
    centroCosto: (centroCosto.value || '').trim() || null,

    epsId: epsId.value ? Number(epsId.value) : null,
    arlId: arlId.value ? Number(arlId.value) : null,
    afpId: afpId.value ? Number(afpId.value) : null,
    afcId: afcId.value ? Number(afcId.value) : null,
    ccfId: ccfId.value ? Number(ccfId.value) : null,

    tieneRecomendacionesMedicas: !!tieneRecomendacionesMedicas.value,
  };

  try {
    console.log('Payload crearContrato =>', payloadContrato);
    const nuevoContrato = await crearContrato(payloadContrato);
    console.log('Contrato creado exitosamente:', nuevoContrato);

    // Crear registro de salario (opcional según reglas, aquí lo hacemos si NO es prestación)
    if (payloadContrato.tipoContrato !== 'prestacion') {
      const payloadSalario = {
        contratoId: Number(nuevoContrato.id),
        salarioBasico: Number(salarioBasico.value) || 0,
        bonoSalarial: Number(bonoSalarial.value) || 0,
        auxilioTransporte: Number(auxilioTransporte.value) || 0,
        auxilioNoSalarial: Number(auxilioNoSalarial.value) || 0,
        fechaEfectiva: `${formData.fechaInicio}T00:00:00`,
      };
      console.log('Payload crearContratoSalario =>', payloadSalario);
      await crearContratoSalario(payloadSalario);
    }

    // Anexar archivo(s) al contrato existente (PDF obligatorio)
    await anexarContrato({
      contratoId: Number(nuevoContrato.id),
      archivo: archivoContrato.value!,
      razonSocialId: Number(razonSocialSeleccionada.value),
      tieneRecomendacionesMedicas: !!tieneRecomendacionesMedicas.value && !!archivoRecomendacionMedica.value,
      archivoRecomendacionMedica: archivoRecomendacionMedica.value || undefined,
    });

    showAlert('Éxito', 'Contrato creado y archivos anexados correctamente.');
  } catch (error: any) {
    console.error('Error al crear o anexar el contrato:', error);
    showAlert('Error', error.message || 'Hubo un problema al crear o anexar el contrato.');
  }
}

// CORRECCIÓN: construir FormData incluyendo razonSocialId
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function anexarArchivoRecomendacion(contratoId: number, archivo: File) {
  try {
    const fdRec = new FormData();
    fdRec.append('contratoId', String(contratoId));
    fdRec.append('razonSocialId', String(razonSocialSeleccionada.value!)); // ✅ importante
    fdRec.append('archivo', archivo, archivo.name);
    fdRec.append('tipo', 'recomendacion_medica'); // si el backend lo usa
    await anexarContrato(fdRec);
    console.log('Archivo de recomendación médica anexado');
  } catch (error) {
    console.error('Error al anexar el archivo de recomendación médica:', error);
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

  paso.completado = true;
  paso.observacion = observacion;
  paso.fechaCompletado = new Date().toISOString().slice(0, 10);

  if (archivo) {
    paso.nombreArchivo = archivo.name;
    paso.archivoFile = archivo;
    paso.archivoUrl = URL.createObjectURL(archivo);
  }

  console.log(`Paso '${paso.nombre}' actualizado con éxito.`, paso);

  cerrarModalPaso();
};

// --- Watchers ---
watch(razonSocialSeleccionada, (newVal) => {
  if (newVal) {
    cargarUsuariosPorRazonSocial();
  }
});

watch(usuarioSeleccionado, (newVal) => {
  if (newVal) {
    resetForm();
    archivoContrato.value = null;
    cargarHistorialContratos(); // <-- carga historial al seleccionar usuario
  } else {
    contratosUsuario.value = [];
  }
});

watch(tipoContratoSeleccionado, (newVal) => {
  if (newVal === 'prestacion') {
    terminoContrato.value = null;
  }
});

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
