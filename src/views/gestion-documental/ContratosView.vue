<template>
  <v-container class="py-6">
    <v-card elevation="4" class="mb-6">
      <v-card-title class="text-h5 font-weight-bold">
        Gestión de Contratos y Trazabilidad
      </v-card-title>
    </v-card>

    <!-- Filtros -->
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
            />
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
            />
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
              :disabled="!usuarioSeleccionado || isEditing"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Formulario -->
    <v-card elevation="2" class="mb-6" v-if="usuarioSeleccionado">
      <v-card-title class="text-h6 font-weight-bold bg-blue-grey-lighten-5 d-flex align-center">
        <span v-if="!isEditing">Datos del Contrato</span>
        <span v-else>Editar Contrato #{{ contratoEditId }}</span>
        <v-spacer />
        <v-chip v-if="isEditing" color="warning" size="small" variant="flat">modo edición</v-chip>
      </v-card-title>

      <v-card-text>
        <v-form @submit.prevent="handleConfirmacion" class="form">
          <v-row dense>
            <v-col cols="12" md="6">
              <v-text-field
                ref="identificacionRef"
                label="Número de Identificación (Número de cédula)"
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
              />
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
              />
            </v-col>

            <!-- 💸 Campos numéricos -->
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

            <!-- ⬇️ Visible/obligatoria según tipo -->
            <v-col
              cols="12"
              md="6"
              v-if="isFechaTerminacionVisible"
            >
              <v-text-field
                label="Fecha de Terminación"
                v-model="fechaTerminacion"
                :error-messages="fechaTerminacionError"
                :required="isFechaTerminacionRequired"
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
              />
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
              />
            </v-col>

            <!-- 🔽 CAMBIO: TextField -> Select fijo -->
            <v-col cols="12" md="6">
              <v-select
                label="Centro de Costo (Área)"
                v-model="centroCosto"
                :items="centrosCostoOptions"
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
              <v-divider class="my-4" />
              <h4 class="text-h6 text-center">Afiliaciones y Seguridad Social</h4>
              <v-divider class="my-4" />
            </v-col>

            <!-- EPS -->
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
              >
                <template #append-inner>
                  <v-tooltip text="ENTIDAD PRESTADORA DE SERVICIOS DE SALUD" location="top">
                    <template #activator="{ props }">
                      <v-icon
                        v-bind="props"
                        icon="mdi-help-circle-outline"
                        size="18"
                        class="ml-1 text-medium-emphasis"
                        aria-label="¿Qué es EPS?"
                      />
                    </template>
                  </v-tooltip>
                </template>
              </v-select>
            </v-col>

            <!-- ARL -->
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
              >
                <template #append-inner>
                  <v-tooltip text="ADMINISTRADORA DE RIESGOS LABORALES" location="top">
                    <template #activator="{ props }">
                      <v-icon
                        v-bind="props"
                        icon="mdi-help-circle-outline"
                        size="18"
                        class="ml-1 text-medium-emphasis"
                        aria-label="¿Qué es ARL?"
                      />
                    </template>
                  </v-tooltip>
                </template>
              </v-select>
            </v-col>

            <!-- AFP -->
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
              >
                <template #append-inner>
                  <v-tooltip text="ADMINISTRADORA DE FONDO DE PENSIONES" location="top">
                    <template #activator="{ props }">
                      <v-icon
                        v-bind="props"
                        icon="mdi-help-circle-outline"
                        size="18"
                        class="ml-1 text-medium-emphasis"
                        aria-label="¿Qué es AFP?"
                      />
                    </template>
                  </v-tooltip>
                </template>
              </v-select>
            </v-col>

            <!-- AFC -->
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
              >
                <template #append-inner>
                  <v-tooltip text="ADMINISTRADORA DE FONDO DE CESANTÍAS" location="top">
                    <template #activator="{ props }">
                      <v-icon
                        v-bind="props"
                        icon="mdi-help-circle-outline"
                        size="18"
                        class="ml-1 text-medium-emphasis"
                        aria-label="¿Qué es AFC?"
                      />
                    </template>
                  </v-tooltip>
                </template>
              </v-select>
            </v-col>

            <!-- CCF -->
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
              >
                <template #append-inner>
                  <v-tooltip text="CAJA DE COMPENSACIÓN FAMILIAR" location="top">
                    <template #activator="{ props }">
                      <v-icon
                        v-bind="props"
                        icon="mdi-help-circle-outline"
                        size="18"
                        class="ml-1 text-medium-emphasis"
                        aria-label="¿Qué es CCF?"
                      />
                    </template>
                  </v-tooltip>
                </template>
              </v-select>
            </v-col>

            <v-col cols="12">
              <v-divider class="my-4" />
              <h4 class="text-h6 text-center">Recomendaciones Médicas</h4>
              <v-divider class="my-4" />
            </v-col>

            <v-col cols="12" md="6">
              <v-checkbox
                v-model="tieneRecomendacionesMedicas"
                label="¿Requiere Recomendaciones Médicas?"
                density="compact"
                hide-details
                class="mt-0"
              />
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
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Pasos + Anexar -->
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
                    />
                    <v-btn
                      v-else-if="paso.completado"
                      icon="mdi-pencil-outline"
                      color="warning"
                      variant="tonal"
                      size="small"
                      @click="abrirModalPaso(paso)"
                    />
                  </div>
                </v-timeline-item>
              </v-timeline>
              <v-alert v-if="loadingPasos" type="info" variant="tonal" class="mt-4">
                Cargando pasos...
              </v-alert>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <h4 class="text-h6 mb-4">{{ isEditing ? 'Reemplazar Archivo de Contrato (opcional)' : 'Anexar Contrato' }}</h4>
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
              />
              <v-alert v-if="!archivoContrato" type="info" variant="tonal">
                {{ isEditing ? 'Si no cargas archivo, se mantiene el actual.' : 'Adjunte el archivo del contrato para anexarlo al usuario.' }}
              </v-alert>
              <v-alert v-else type="success" variant="tonal">
                Archivo <strong>{{ archivoContrato.name }}</strong> listo.
              </v-alert>
            </v-card>
          </v-col>
        </v-row>

        <v-card-actions class="d-flex justify-end pr-4 pb-4 mt-4">
          <v-btn
            v-if="isEditing"
            color="grey-darken-1"
            variant="text"
            class="mr-2"
            @click="cancelarEdicion"
          >Cancelar edición</v-btn>

          <v-btn
            v-if="!isEditing"
            color="success"
            prepend-icon="mdi-content-save-check"
            :disabled="!usuarioSeleccionado || !archivoContrato"
            @click="handleConfirmacion"
          >Crear y Anexar Contrato</v-btn>

          <v-btn
            v-else
            color="warning"
            prepend-icon="mdi-content-save"
            :disabled="!usuarioSeleccionado"
            @click="guardarCambiosContrato"
          >Guardar cambios</v-btn>
        </v-card-actions>
      </v-card-text>
    </v-card>

    <!-- Historial -->
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
              <th class="text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in contratosUsuario" :key="c.id">
              <td>{{ c.id }}</td>
              <td class="text-capitalize">{{ c.tipoContrato }}</td>
              <td class="text-capitalize">{{ (c.terminoContrato || '—').replaceAll('_',' ') }}</td>
              <td>
                <v-chip :color="c.estado === 'activo' ? 'success' : 'grey' " size="small" variant="flat">
                  {{ c.estado }}
                </v-chip>
              </td>
              <td>{{ (c.fechaInicio || '').slice(0,10) }}</td>
              <td>{{ c.fechaTerminacion ? String(c.fechaTerminacion).slice(0,10) : '—' }}</td>
              <td>{{ c.sede?.nombre || '—' }}</td>
              <td>{{ c.cargo?.nombre || '—' }}</td>

              <!-- ⬇️ SOLO DESCARGAR ARCHIVO DEL CONTRATO -->
              <td>
                <div v-if="c.rutaArchivoContratoFisico" class="d-flex flex-wrap ga-2">
                  <v-btn
                    size="x-small"
                    variant="tonal"
                    prepend-icon="mdi-download"
                    @click="descargarArchivo(`/api/contratos/${c.id}/archivo`)"
                  >
                    Descargar
                  </v-btn>
                </div>
                <span v-else>—</span>
              </td>

              <td class="d-flex ga-2">
                <v-btn
                  size="x-small"
                  color="warning"
                  variant="tonal"
                  prepend-icon="mdi-pencil"
                  @click="editarContrato(c)"
                >Editar</v-btn>

                <v-btn
                  size="x-small"
                  :color="c.estado === 'activo' ? 'error' : 'success'"
                  variant="tonal"
                  :prepend-icon="c.estado === 'activo' ? 'mdi-cancel' : 'mdi-check-circle'"
                  @click="toggleEstadoContrato(c)"
                >{{ c.estado === 'activo' ? 'Inactivar' : 'Activar' }}</v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <!-- Modales -->
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
            />
            <v-file-input
              v-model="modalPaso.form.archivo"
              label="Archivo adjunto (opcional)"
              variant="outlined"
              density="compact"
              show-size
              prepend-icon="mdi-paperclip"
              @change="onFilePasoChange"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
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
          <v-spacer />
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
          <v-spacer />
          <v-btn color="grey-darken-1" variant="text" @click="showConfirmDialog = false">Cancelar</v-btn>
          <v-btn color="success" variant="flat" @click="submitForm">Confirmar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useForm, useField } from 'vee-validate'
import { listarRazonesSociales, fetchUsuariosPorRazonSocial } from '@/services/razonSocialService'
import { obtenerSedes, obtenerCargos, obtenerEntidadesSalud } from '@/services/UserService'
import {
  anexarContrato,
  crearContrato,
  crearContratoSalario,
  obtenerContratosPorUsuario,
  actualizarContrato,
  cambiarEstadoContrato,
  obtenerContratoPorId,
} from '@/services/contratoService'
import { crearPasoContrato } from '@/services/contratosPasosService'

interface RazonSocial { id: number; nombre: string }
interface Paso {
  nombre: string; completado: boolean; observacion?: string;
  nombreArchivo?: string; fechaCompletado?: string; archivoUrl?: string;
  archivoFile?: File | null; fase: 'inicio' | 'desarrollo' | 'fin'; orden?: number
}
interface UsuarioExtendida {
  id: number; nombres: string; apellidos: string;
  nombreCompleto: string; recomendaciones: boolean; razonSocialId: number
}
interface ContratoRow {
  id: number
  tipoContrato: 'prestacion' | 'temporal' | 'laboral' | 'aprendizaje'
  terminoContrato: string | null
  estado: 'activo' | 'inactivo'
  fechaInicio: string
  fechaTerminacion: string | null
  sede?: any
  cargo?: any
  rutaArchivoContratoFisico?: string | null
  rutaArchivoRecomendacionMedica?: string | null
  identificacion?: string
  funcionesCargo?: string | null
  centroCosto?: string | null
  epsId?: number | null
  arlId?: number | null
  afpId?: number | null
  afcId?: number | null
  ccfId?: number | null
  salarios?: Array<{ salarioBasico:number; bonoSalarial:number; auxilioTransporte:number; auxilioNoSalarial:number }>
  salario?: number
  salarioBasico?: number
  bonoSalarial?: number
  auxilioTransporte?: number
  auxilioNoSalarial?: number
}

const tiposContratoSelectItems = ref([
  { nombre: 'Prestación de Servicios', valor: 'prestacion' },
  { nombre: 'Temporal', valor: 'temporal' },
  { nombre: 'Laboral', valor: 'laboral' },
  { nombre: 'Contrato de Aprendizaje', valor: 'aprendizaje' },
])

const basePasosPrestacion: Paso[] = [
  { nombre: 'Inicio Contrato', completado: false, fase: 'inicio', orden: 1 },
  { nombre: 'Firma Documentos', completado: false, fase: 'inicio', orden: 2 },
  { nombre: 'Afiliación Seguridad Social', completado: false, fase: 'inicio', orden: 3 },
]
const basePasosTemporal: Paso[] = [
  { nombre: 'Solicitud Personal', completado: false, fase: 'inicio', orden: 1 },
  { nombre: 'Entrevista Inicial', completado: false, fase: 'inicio', orden: 2 },
  { nombre: 'Pruebas Psicotécnicas', completado: false, fase: 'inicio', orden: 3 },
  { nombre: 'Examen Médico Pre-ocupacional', completado: false, fase: 'inicio', orden: 4 },
  { nombre: 'Contratación y Documentación', completado: false, fase: 'inicio', orden: 5 },
]
const basePasosLaboral: Paso[] = [
  { nombre: 'Proceso de Selección', completado: false, fase: 'inicio', orden: 1 },
  { nombre: 'Verificación de Referencias', completado: false, fase: 'inicio', orden: 2 },
  { nombre: 'Entrevista Final', completado: false, fase: 'inicio', orden: 3 },
  { nombre: 'Examen Médico de Ingreso', completado: false, fase: 'inicio', orden: 4 },
  { nombre: 'Firma de Contrato', completado: false, fase: 'inicio', orden: 5 },
  { nombre: 'Inducción y Bienvenida', completado: false, fase: 'inicio', orden: 6 },
]

const formatTermForDisplay = (term: string) =>
  term.replace(/_/g, ' ').split(' ').map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ')

const terminosContratoTemporal = computed(() => [
  { text: formatTermForDisplay('obra_o_labor_determinada'), value: 'obra_o_labor_determinada' }
])
const terminosContratoLaboral = computed(() => [
  { text: formatTermForDisplay('fijo'), value: 'fijo' },
  { text: formatTermForDisplay('obra_o_labor_determinada'), value: 'obra_o_labor_determinada' },
  { text: formatTermForDisplay('indefinido'), value: 'indefinido' }
])

// estado general
const razonSocialSeleccionada = ref<number | null>(null)
const usuarioSeleccionado = ref<number | null>(null)
const tipoContratoSeleccionado = ref<'prestacion' | 'temporal' | 'laboral' | 'aprendizaje'>('prestacion')
const razonesSociales = ref<RazonSocial[]>([])
const usuarios = ref<UsuarioExtendida[]>([])
const sedes = ref<any[]>([])
const cargos = ref<any[]>([])
const entidadesSalud = ref<any[]>([])
const loadingRazonesSociales = ref(false)
const loadingUsuarios = ref(false)
const loadingSedes = ref(false)
const loadingCargos = ref(false)
const loadingEntidades = ref(false)
const loadingPasos = ref(false)

// edición
const isEditing = ref(false)
const contratoEditId = ref<number | null>(null)

// modal paso
const modalPaso = ref({
  mostrar: false,
  paso: null as Paso | null,
  form: { observacion: '', archivo: null as File | null }
})

// archivo contrato
const archivoContrato = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// recomendaciones médicas
const tieneRecomendacionesMedicas = ref(false)
const archivoRecomendacionMedica = ref<File | null>(null)

// focus
const identificacionRef = ref()

// alertas
const showAlertDialog = ref(false)
const alertDialogTitle = ref('')
const alertDialogMessage = ref('')
const showAlert = (title: string, message: string) => {
  alertDialogTitle.value = title
  alertDialogMessage.value = message
  showAlertDialog.value = true
}

// confirm
const showConfirmDialog = ref(false)
const { handleSubmit, resetForm, validate } = useForm()

// ✔ Reglas y campos (numéricos con '' para no forzar 0)
const required = (v: any) => (v !== null && v !== undefined && v !== '') || 'Este campo es obligatorio.'
const optionalNumber = (v: any) => (v == null || v === '') ? true : !isNaN(Number(v)) || 'Debe ser un número válido.'

const { value: identificacion, errorMessage: identificacionError } = useField('identificacion', [required, (val: string) => val.length >= 5 || 'Debe tener al menos 5 caracteres.'])
const { value: sedeId, errorMessage: sedeIdError } = useField<number | null>('sedeId', [required], { initialValue: null })
const { value: cargoId, errorMessage: cargoIdError } = useField<number | null>('cargoId', [required], { initialValue: null })
const { value: funcionesCargo, errorMessage: funcionesCargoError } = useField('funcionesCargo', [required], { initialValue: '' })

// ⬇️ Importante: initialValue = '' para no mandar 0 por defecto
const { value: salarioBasico, errorMessage: salarioBasicoError } = useField('salarioBasico', [required, optionalNumber], { initialValue: '' })
const { value: bonoSalarial, errorMessage: bonoSalarialError } = useField('bonoSalarial', [optionalNumber], { initialValue: '' })
const { value: auxilioTransporte, errorMessage: auxilioTransporteError } = useField('auxilioTransporte', [optionalNumber], { initialValue: '' })
const { value: auxilioNoSalarial, errorMessage: auxilioNoSalarialError } = useField('auxilioNoSalarial', [optionalNumber], { initialValue: '' })

const { value: fechaInicio } = useField('fechaInicio', [required], { initialValue: '' })

// 👇 No requerir término cuando es prestacion **o** aprendizaje
const terminoContratoRules = computed(() =>
  (tipoContratoSeleccionado.value !== 'prestacion' && tipoContratoSeleccionado.value !== 'aprendizaje') ? [required] : []
)
const { value: terminoContrato, errorMessage: terminoContratoError } = useField('terminoContrato', terminoContratoRules, { initialValue: null })

// ✅ Requerimiento/visibilidad dinámica de FECHA DE TERMINACIÓN
const isFechaTerminacionRequired = computed(() => {
  const t = tipoContratoSeleccionado.value
  if (t === 'prestacion' || t === 'aprendizaje' || t === 'temporal') return true
  if (t === 'laboral') return terminoContrato.value !== 'indefinido'
  return false
})
const isFechaTerminacionVisible = isFechaTerminacionRequired

const fechaTerminacionRules = computed(() => isFechaTerminacionRequired.value ? [required] : [])
const { value: fechaTerminacion, errorMessage: fechaTerminacionError } = useField('fechaTerminacion', fechaTerminacionRules, { initialValue: '' })

const { value: centroCosto, errorMessage: centroCostoError } = useField('centroCosto', undefined, { initialValue: '' })
const { value: epsId, errorMessage: epsIdError } = useField<number | null>('epsId', [required], { initialValue: null })
const { value: arlId, errorMessage: arlIdError } = useField<number | null>('arlId', [required], { initialValue: null })
const { value: afpId, errorMessage: afpIdError } = useField<number | null>('afpId', [required], { initialValue: null })
const { value: afcId, errorMessage: afcIdError } = useField<number | null>('afcId', undefined, { initialValue: null })
const { value: ccfId, errorMessage: ccfIdError } = useField<number | null>('ccfId', [required], { initialValue: null })

const contratosUsuario = ref<ContratoRow[]>([])
const loadingContratos = ref(false)

// 🔽 Opciones fijas para Centro de Costo (Área)
const centrosCostoOptions = ref<string[]>([
  'ADMINISTRACIÓN',
  'TALENTO HUMANO',
  'CONTABILIDAD',
  'OPERACIÓN',
  'SERVICIO AL CLIENTE',
  'DIRECCIÓN',
  'COMERCIAL',
])

const pasosContrato = computed(() => {
  let current: Paso[] = []
  if (tipoContratoSeleccionado.value === 'prestacion' || tipoContratoSeleccionado.value === 'aprendizaje') current = [...basePasosPrestacion]
  else if (tipoContratoSeleccionado.value === 'temporal') current = [...basePasosTemporal]
  else current = [...basePasosLaboral]
  return current.map((p, i) => ({ ...p, orden: i + 1 })).sort((a, b) => (a.orden || 0) - (b.orden || 0))
})

const filteredEps = computed(() => entidadesSalud.value.filter(e => e.tipo === 'eps'))
const filteredArl = computed(() => entidadesSalud.value.filter(e => e.tipo === 'arl'))
const filteredAfp = computed(() => entidadesSalud.value.filter(e => e.tipo === 'afp'))
const filteredAfc = computed(() => entidadesSalud.value.filter(e => e.tipo === 'afc'))
const filteredCcf = computed(() => entidadesSalud.value.filter(e => e.tipo === 'ccf'))

const salarioTotalCalculado = computed(() => {
  const sb = Number(salarioBasico.value) || 0
  const bs = Number(bonoSalarial.value) || 0
  const at = Number(auxilioTransporte.value) || 0
  const ans = Number(auxilioNoSalarial.value) || 0
  return (sb + bs + at + ans).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })
})

/* ===========================
   Cargar datos
   =========================== */
async function cargarHistorialContratos() {
  if (!usuarioSeleccionado.value) { contratosUsuario.value = []; return }
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
async function cargarRazonesSociales() {
  loadingRazonesSociales.value = true
  try { razonesSociales.value = await listarRazonesSociales() }
  catch (e) { console.error(e) }
  finally { loadingRazonesSociales.value = false }
}
async function cargarUsuariosPorRazonSocial() {
  loadingUsuarios.value = true; usuarios.value = []; usuarioSeleccionado.value = null
  if (razonSocialSeleccionada.value) {
    try {
      const data = await fetchUsuariosPorRazonSocial(razonSocialSeleccionada.value)
      usuarios.value = data.map((u: any) => ({
        ...u, nombreCompleto: `${u.nombres} ${u.apellidos}`, recomendaciones: !!u.recomendaciones
      }))
    } catch (e) { console.error(e) } finally { loadingUsuarios.value = false }
  } else loadingUsuarios.value = false
}
async function cargarSedes() { loadingSedes.value = true; try { sedes.value = await obtenerSedes() } finally { loadingSedes.value = false } }
async function cargarCargos() { loadingCargos.value = true; try { cargos.value = await obtenerCargos() } finally { loadingCargos.value = false } }
async function cargarEntidadesSalud() { loadingEntidades.value = true; try { entidadesSalud.value = await obtenerEntidadesSalud() } finally { loadingEntidades.value = false } }

/* ===========================
   Crear nuevo
   =========================== */
const handleConfirmacion = async () => {
  const { valid } = await validate()
  if (!valid) return showAlert('Error de Validación', 'Revisa los campos en rojo.')
  if (!usuarioSeleccionado.value || !tipoContratoSeleccionado.value) return showAlert('Advertencia', 'Seleccione usuario y tipo de contrato.')
  if (isFechaTerminacionRequired.value && !fechaTerminacion.value) return showAlert('Advertencia', 'La fecha de terminación es obligatoria para este tipo de contrato.')
  if (!archivoContrato.value) return showAlert('Advertencia', 'Adjunte el PDF del contrato.')
  if (tieneRecomendacionesMedicas.value && !archivoRecomendacionMedica.value) return showAlert('Advertencia', 'Adjunte Recomendación Médica o desmarque la opción.')
  showConfirmDialog.value = true
}
const submitForm = handleSubmit(async (values) => { showConfirmDialog.value = false; await crearYAnexarContrato(values) })

async function crearYAnexarContrato(formData: any) {
  if (!usuarioSeleccionado.value || !archivoContrato.value || !razonSocialSeleccionada.value) return showAlert('Error', 'Falta información clave.')

  const requiresEndDate = isFechaTerminacionRequired.value

  const payloadContrato: any = {
    usuarioId: Number(usuarioSeleccionado.value),
    razonSocialId: Number(razonSocialSeleccionada.value),
    identificacion: (identificacion.value || '').trim(),
    sedeId: sedeId.value ? Number(sedeId.value) : null,
    cargoId: cargoId.value ? Number(cargoId.value) : null,
    funcionesCargo: (funcionesCargo.value || '').trim() || null,
    fechaInicio: formData.fechaInicio,
    fechaTerminacion: requiresEndDate ? (formData.fechaTerminacion || null) : null,
    tipoContrato: tipoContratoSeleccionado.value,
    terminoContrato: (tipoContratoSeleccionado.value !== 'prestacion' && tipoContratoSeleccionado.value !== 'aprendizaje') ? terminoContrato.value : null,
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

    salarioBasico: Number(salarioBasico.value) || 0,
    bonoSalarial: Number(bonoSalarial.value) || 0,
    auxilioTransporte: Number(auxilioTransporte.value) || 0,
    auxilioNoSalarial: Number(auxilioNoSalarial.value) || 0,
  }

  try {
    const nuevoContrato: any = await crearContrato(payloadContrato)

    const salarioViene = Array.isArray(nuevoContrato.salarios) && nuevoContrato.salarios.length > 0
    if (!salarioViene) {
      const payloadSalario = {
        contratoId: Number(nuevoContrato.id),
        salarioBasico: Number(salarioBasico.value) || 0,
        bonoSalarial: Number(bonoSalarial.value) || 0,
        auxilioTransporte: Number(auxilioTransporte.value) || 0,
        auxilioNoSalarial: Number(auxilioNoSalarial.value) || 0,
        fechaEfectiva: `${formData.fechaInicio}T00:00:00`,
      }
      await crearContratoSalario(payloadSalario)
    }

    await anexarContrato({
      contratoId: Number(nuevoContrato.id),
      archivo: archivoContrato.value!,
      razonSocialId: Number(razonSocialSeleccionada.value),
      tieneRecomendacionesMedicas: !!tieneRecomendacionesMedicas.value && !!archivoRecomendacionMedica.value,
      archivoRecomendacionMedica: archivoRecomendacionMedica.value || undefined,
    })

    try {
      const creates = pasosContrato.value.map(p => {
        const fd = new FormData()
        fd.append('fase', p.fase)
        fd.append('nombrePaso', p.nombre)
        if (p.observacion) fd.append('observacion', p.observacion)
        if (p.orden != null) fd.append('orden', String(p.orden))
        fd.append('completado', p.completado ? 'true' : 'false')
        if (p.fechaCompletado) fd.append('fecha', p.fechaCompletado)
        if (p.archivoFile) fd.append('archivo', p.archivoFile, p.archivoFile.name)
        return crearPasoContrato(Number(nuevoContrato.id), fd)
      })
      await Promise.all(creates)
    } catch (e) { console.error('Pasos base', e) }

    showAlert('Éxito', 'Contrato creado, salario inicial, archivos y pasos registrados.')
    await cargarHistorialContratos()
    limpiarFormulario()
  } catch (e: any) {
    console.error(e)
    showAlert('Error', e?.message || 'No fue posible crear el contrato.')
  }
}

/* ===========================
   Edición
   =========================== */
async function editarContrato(c: ContratoRow) {
  isEditing.value = true
  contratoEditId.value = c.id

  let full: any = null
  try {
    full = await obtenerContratoPorId(c.id)
  } catch (e) {
    console.error('No se pudo cargar el contrato completo, uso fila de la tabla:', e)
  }
  const src = full || c

  tipoContratoSeleccionado.value = src.tipoContrato ?? c.tipoContrato

  identificacion.value = src.identificacion ?? c.identificacion ?? ''
  sedeId.value = src.sede?.id ?? src.sedeId ?? c.sede?.id ?? null
  cargoId.value = src.cargo?.id ?? src.cargoId ?? c.cargo?.id ?? null
  funcionesCargo.value = src.funcionesCargo ?? c.funcionesCargo ?? ''
  centroCosto.value = src.centroCosto ?? c.centroCosto ?? ''

  fechaInicio.value = (src.fechaInicio || c.fechaInicio || '').slice(0, 10)
  fechaTerminacion.value = (src.fechaTerminacion || c.fechaTerminacion) ? String(src.fechaTerminacion || c.fechaTerminacion).slice(0, 10) : ''

  // aprendizaje = prestación (sin término)
  terminoContrato.value = (src.tipoContrato === 'prestacion' || src.tipoContrato === 'aprendizaje') ? null : (src.terminoContrato ?? c.terminoContrato ?? null)

  epsId.value = src.epsId ?? c.epsId ?? null
  arlId.value = src.arlId ?? c.arlId ?? null
  afpId.value = src.afpId ?? c.afpId ?? null
  afcId.value = src.afcId ?? c.afcId ?? null
  ccfId.value = src.ccfId ?? c.ccfId ?? null

  tieneRecomendacionesMedicas.value = !!(src.tieneRecomendacionesMedicas ?? false)
  archivoRecomendacionMedica.value = null

  // salario vigente (robusto)
  const sb =
    (src.salarioBasico as number | undefined) ??
    (Array.isArray(src.salarios) ? src.salarios[0]?.salarioBasico : undefined) ??
    (typeof src.salario === 'number' ? src.salario : undefined)

  const bs =
    (src.bonoSalarial as number | undefined) ??
    (Array.isArray(src.salarios) ? src.salarios[0]?.bonoSalarial : undefined)

  const at =
    (src.auxilioTransporte as number | undefined) ??
    (Array.isArray(src.salarios) ? src.salarios[0]?.auxilioTransporte : undefined)

  const ans =
    (src.auxilioNoSalarial as number | undefined) ??
    (Array.isArray(src.salarios) ? src.salarios[0]?.auxilioNoSalarial : undefined)

  if (sb != null) salarioBasico.value = String(sb)
  if (bs != null) bonoSalarial.value = String(bs)
  if (at != null) auxilioTransporte.value = String(at)
  if (ans != null) auxilioNoSalarial.value = String(ans)

  archivoContrato.value = null

  await nextTick()
  window.scrollTo({ top: 0, behavior: 'smooth' })
  ;(identificacionRef.value as any)?.focus?.()
}

async function guardarCambiosContrato() {
  if (!contratoEditId.value) return

  const { valid } = await validate()
  if (!valid) return showAlert('Error de Validación', 'Revisa los campos obligatorios.')

  const requiresEndDate = isFechaTerminacionRequired.value
  if (requiresEndDate && !fechaTerminacion.value) {
    return showAlert('Advertencia', 'La fecha de terminación es obligatoria para este tipo de contrato.')
  }

  const payload: any = {
    tipoContrato: tipoContratoSeleccionado.value,
    terminoContrato: (tipoContratoSeleccionado.value !== 'prestacion' && tipoContratoSeleccionado.value !== 'aprendizaje') ? terminoContrato.value : null,
    identificacion: (identificacion.value || '').trim(),
    sedeId: sedeId.value ? Number(sedeId.value) : null,
    cargoId: cargoId.value ? Number(cargoId.value) : null,
    funcionesCargo: (funcionesCargo.value || '').trim() || null,
    fechaInicio: fechaInicio.value,
    fechaTerminacion: requiresEndDate ? (fechaTerminacion.value || null) : null,
    centroCosto: (centroCosto.value || '').trim() || null,
    epsId: epsId.value ?? null,
    arlId: arlId.value ?? null,
    afpId: afpId.value ?? null,
    afcId: afcId.value ?? null,
    ccfId: ccfId.value ?? null,
    tieneRecomendacionesMedicas: !!tieneRecomendacionesMedicas.value,

    // Condicionales (no pisar con 0)
    salarioBasico: salarioBasico.value !== '' ? Number(salarioBasico.value) : undefined,
    bonoSalarial: bonoSalarial.value !== '' ? Number(bonoSalarial.value) : undefined,
    auxilioTransporte: auxilioTransporte.value !== '' ? Number(auxilioTransporte.value) : undefined,
    auxilioNoSalarial: auxilioNoSalarial.value !== '' ? Number(auxilioNoSalarial.value) : undefined,
  }

  try {
    await actualizarContrato(Number(contratoEditId.value), payload)

    if (archivoContrato.value) {
      await anexarContrato({
        contratoId: Number(contratoEditId.value),
        archivo: archivoContrato.value,
        razonSocialId: Number(razonSocialSeleccionada.value),
        tieneRecomendacionesMedicas: !!tieneRecomendacionesMedicas.value && !!archivoRecomendacionMedica.value,
        archivoRecomendacionMedica: archivoRecomendacionMedica.value || undefined,
      })
    }

    showAlert('Éxito', 'Contrato actualizado correctamente.')
    await cargarHistorialContratos()
    cancelarEdicion()
  } catch (e: any) {
    console.error(e)
    showAlert('Error', e?.message || 'No fue posible actualizar el contrato.')
  }
}

function cancelarEdicion() {
  isEditing.value = false
  contratoEditId.value = null
  limpiarFormulario()
}

function limpiarFormulario() {
  resetForm()
  archivoContrato.value = null
  archivoRecomendacionMedica.value = null
  tipoContratoSeleccionado.value = 'prestacion'
  terminoContrato.value = null
}

// activar/inactivar
async function toggleEstadoContrato(c: ContratoRow) {
  const nuevoEstado = c.estado === 'activo' ? 'inactivo' : 'activo'
  try {
    await cambiarEstadoContrato(c.id, nuevoEstado)
    showAlert('Listo', `Contrato ${c.id} ahora está ${nuevoEstado}.`)
    await cargarHistorialContratos()
    if (isEditing.value && contratoEditId.value === c.id && nuevoEstado === 'inactivo') {
      cancelarEdicion()
    }
  } catch (e: any) {
    console.error(e)
    showAlert('Error', e?.message || 'No fue posible cambiar el estado.')
  }
}

// modal pasos (local, UI)
const abrirModalPaso = (paso: Paso) => { modalPaso.value.paso = paso; modalPaso.value.form.observacion = paso.observacion || ''; modalPaso.value.form.archivo = paso.archivoFile || null; modalPaso.value.mostrar = true }
const cerrarModalPaso = () => { modalPaso.value.mostrar = false; modalPaso.value.paso = null; modalPaso.value.form = { observacion: '', archivo: null } }
const completarPasoConfirmado = async () => {
  if (!modalPaso.value.paso) return
  const paso = modalPaso.value.paso
  if (!modalPaso.value.form.observacion) return showAlert('Error', 'La observación es obligatoria.')
  paso.completado = true
  paso.observacion = modalPaso.value.form.observacion
  paso.fechaCompletado = new Date().toISOString().slice(0, 10)
  if (modalPaso.value.form.archivo) {
    paso.nombreArchivo = modalPaso.value.form.archivo.name
    paso.archivoFile = modalPaso.value.form.archivo
    paso.archivoUrl = URL.createObjectURL(modalPaso.value.form.archivo)
  }
  cerrarModalPaso()
}

// file handlers
const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  archivoContrato.value = target.files && target.files.length ? target.files[0] : null
}
const onFilePasoChange = () => { /* noop */ }

/* ===========================
   DESCARGAR ARCHIVO
   =========================== */
function parseFilenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null
  const match = /filename\*?=(?:UTF-8''|")?([^\";]+)/i.exec(header)
  if (match && match[1]) {
    try { return decodeURIComponent(match[1].replace(/\"/g, '')) } catch { return match[1].replace(/\"/g, '') }
  }
  return null
}

async function descargarArchivo(url?: string | null, sugerido?: string) {
  if (!url) return showAlert('Archivo no disponible', 'No se encontró la ruta del archivo para este contrato.')
  try {
    const resp = await fetch(url, { credentials: 'include' })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const blob = await resp.blob()

    let filename = parseFilenameFromContentDisposition(resp.headers.get('content-disposition'))
    if (!filename) filename = sugerido || 'archivo.pdf'

    const link = document.createElement('a')
    const objectUrl = URL.createObjectURL(blob)
    link.href = objectUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(objectUrl)
  } catch (e) {
    console.error('Descarga falló, abriendo como fallback:', e)
    window.open(url!, '_blank', 'noopener')
  }
}

// watchers
watch(razonSocialSeleccionada, (newVal) => { if (newVal) cargarUsuariosPorRazonSocial() })
watch(usuarioSeleccionado, async (newVal) => { if (newVal) { resetForm(); archivoContrato.value = null; await cargarHistorialContratos() } else contratosUsuario.value = [] })
watch(tipoContratoSeleccionado, (newVal) => { if (newVal === 'prestacion' || newVal === 'aprendizaje') terminoContrato.value = null })
watch(tieneRecomendacionesMedicas, (newVal) => { if (!newVal) archivoRecomendacionMedica.value = null })

// mount
onMounted(() => { cargarRazonesSociales(); cargarSedes(); cargarCargos(); cargarEntidadesSalud() })
</script>

<style scoped>
.form .v-col { padding-top: 4px; padding-bottom: 4px; }
</style>
