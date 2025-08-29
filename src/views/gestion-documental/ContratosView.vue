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
              clearable
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
            <!-- Identificación -->
            <v-col cols="12" md="6">
              <v-text-field
                ref="identificacionRef"
                label="Número de Identificación (Número de cédula)"
                v-model="identificacion"
                :error-messages="identificacionError"
                variant="outlined"
                clearable
                density="compact"
              />
            </v-col>

            <!-- Término (siempre visible; opciones dependen del tipo) -->
            <v-col cols="12" md="6">
              <v-select
                label="Término de Contrato"
                v-model="terminoContrato"
                :items="terminosContratoOptions"
                item-title="text"
                item-value="value"
                :error-messages="terminoContratoError"
                variant="outlined"
                clearable
                density="compact"
                required
              />
            </v-col>

            <!-- Sede / Cargo -->
            <v-col cols="12" md="6">
              <v-select
                label="Sede"
                v-model="sedeId"
                :items="sedes"
                item-title="nombre"
                item-value="id"
                :error-messages="sedeIdError"
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
                inputmode="numeric"
                :max="MAX_MONEY"
                prefix="$"
                variant="outlined"
                clearable
                density="compact"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                label="Bono Salarial"
                v-model="bonoSalarial"
                type="number"
                inputmode="numeric"
                :max="MAX_MONEY"
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
                type="number"
                inputmode="numeric"
                :max="MAX_MONEY"
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
                type="number"
                inputmode="numeric"
                :max="MAX_MONEY"
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

            <!-- Fechas -->
            <v-col cols="12" md="6">
              <v-text-field
                label="Fecha de Inicio"
                v-model="fechaInicio"
                :error-messages="fechaInicioError"
                type="date"
                variant="outlined"
                clearable
                density="compact"
              />
            </v-col>

            <v-col cols="12" md="6" v-if="isFechaTerminacionVisible">
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

            <!-- Centro de costo -->
            <v-col cols="12" md="6">
              <v-select
                label="Centro de Costo (Área)"
                v-model="centroCosto"
                :items="centrosCostoOptions"
                variant="outlined"
                clearable
                density="compact"
              />
            </v-col>

            <!-- Funciones -->
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

            <!-- Afiliaciones -->
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
                  <div :key="certStatusKey('eps')" class="append-icons">
                    <v-tooltip text="ENTIDAD PRESTADORA DE SERVICIOS DE SALUD" location="top">
                      <template #activator="{ props }">
                        <v-icon v-bind="props" icon="mdi-help-circle-outline" size="18" class="ml-1 text-medium-emphasis" />
                      </template>
                    </v-tooltip>
                    <v-tooltip v-if="hasCertUI('eps')" text="Archivo cargado" location="top">
                      <template #activator="{ props }"><v-icon v-bind="props" size="18" color="success" class="ml-1">mdi-check-circle</v-icon></template>
                    </v-tooltip>
                    <v-tooltip :text="hasCertUI('eps') ? 'Ver/Reemplazar certificado EPS' : 'Subir certificado EPS'" location="top">
                      <template #activator="{ props }">
                        <v-btn v-bind="props" icon="mdi-paperclip" size="small" variant="text" class="ml-1" :disabled="!epsId" :ripple="false" @click.stop="openCert('eps', $event)" />
                      </template>
                    </v-tooltip>
                  </div>
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
                  <div :key="certStatusKey('arl')" class="append-icons">
                    <v-tooltip text="ADMINISTRADORA DE RIESGOS LABORALES" location="top">
                      <template #activator="{ props }">
                        <v-icon v-bind="props" icon="mdi-help-circle-outline" size="18" class="ml-1 text-medium-emphasis" />
                      </template>
                    </v-tooltip>
                    <v-tooltip v-if="hasCertUI('arl')" text="Archivo cargado" location="top">
                      <template #activator="{ props }"><v-icon v-bind="props" size="18" color="success" class="ml-1">mdi-check-circle</v-icon></template>
                    </v-tooltip>
                    <v-tooltip :text="hasCertUI('arl') ? 'Ver/Reemplazar certificado ARL' : 'Subir certificado ARL'" location="top">
                      <template #activator="{ props }">
                        <v-btn v-bind="props" icon="mdi-paperclip" size="small" variant="text" class="ml-1" :disabled="!arlId" :ripple="false" @click.stop="openCert('arl', $event)" />
                      </template>
                    </v-tooltip>
                  </div>
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
                  <div :key="certStatusKey('afp')" class="append-icons">
                    <v-tooltip text="ADMINISTRADORA DE FONDO DE PENSIONES" location="top">
                      <template #activator="{ props }">
                        <v-icon v-bind="props" icon="mdi-help-circle-outline" size="18" class="ml-1 text-medium-emphasis" />
                      </template>
                    </v-tooltip>
                    <v-tooltip v-if="hasCertUI('afp')" text="Archivo cargado" location="top">
                      <template #activator="{ props }"><v-icon v-bind="props" size="18" color="success" class="ml-1">mdi-check-circle</v-icon></template>
                    </v-tooltip>
                    <v-tooltip :text="hasCertUI('afp') ? 'Ver/Reemplazar certificado AFP' : 'Subir certificado AFP'" location="top">
                      <template #activator="{ props }">
                        <v-btn v-bind="props" icon="mdi-paperclip" size="small" variant="text" class="ml-1" :disabled="!afpId" :ripple="false" @click.stop="openCert('afp', $event)" />
                      </template>
                    </v-tooltip>
                  </div>
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
                variant="outlined"
                clearable
                density="compact"
                :loading="loadingEntidades"
              >
                <template #append-inner>
                  <div :key="certStatusKey('afc')" class="append-icons">
                    <v-tooltip text="ADMINISTRADORA DE FONDO DE CESANTÍAS" location="top">
                      <template #activator="{ props }">
                        <v-icon v-bind="props" icon="mdi-help-circle-outline" size="18" class="ml-1 text-medium-emphasis" />
                      </template>
                    </v-tooltip>
                    <v-tooltip v-if="hasCertUI('afc')" text="Archivo cargado" location="top">
                      <template #activator="{ props }"><v-icon v-bind="props" size="18" color="success" class="ml-1">mdi-check-circle</v-icon></template>
                    </v-tooltip>
                    <v-tooltip :text="hasCertUI('afc') ? 'Ver/Reemplazar certificado AFC' : 'Subir certificado AFC'" location="top">
                      <template #activator="{ props }">
                        <v-btn v-bind="props" icon="mdi-paperclip" size="small" variant="text" class="ml-1" :disabled="!afcId" :ripple="false" @click.stop="openCert('afc', $event)" />
                      </template>
                    </v-tooltip>
                  </div>
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
                  <div :key="certStatusKey('ccf')" class="append-icons">
                    <v-tooltip text="CAJA DE COMPENSACIÓN FAMILIAR" location="top">
                      <template #activator="{ props }">
                        <v-icon v-bind="props" icon="mdi-help-circle-outline" size="18" class="ml-1 text-medium-emphasis" />
                      </template>
                    </v-tooltip>
                    <v-tooltip v-if="hasCertUI('ccf')" text="Archivo cargado" location="top">
                      <template #activator="{ props }"><v-icon v-bind="props" size="18" color="success" class="ml-1">mdi-check-circle</v-icon></template>
                    </v-tooltip>
                    <v-tooltip :text="hasCertUI('ccf') ? 'Ver/Reemplazar certificado CCF' : 'Subir certificado CCF'" location="top">
                      <template #activator="{ props }">
                        <v-btn v-bind="props" icon="mdi-paperclip" size="small" variant="text" class="ml-1" :disabled="!ccfId" :ripple="false" @click.stop="openCert('ccf', $event)" />
                      </template>
                    </v-tooltip>
                  </div>
                </template>
              </v-select>
            </v-col>

            <!-- Recomendaciones Médicas -->
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
              <v-text-field
                label="Recomendación Médica"
                :model-value="tieneRecomendacionesMedicas ? (recNombreActual || '—') : 'No aplica'"
                readonly
                variant="outlined"
                density="compact"
                :disabled="!tieneRecomendacionesMedicas"
              >
                <template #append-inner>
                  <div :key="recUiKey" class="append-icons">
                    <v-tooltip v-if="recTieneArchivo" text="Archivo cargado" location="top">
                      <template #activator="{ props }"><v-icon v-bind="props" size="18" color="success" class="ml-1">mdi-check-circle</v-icon></template>
                    </v-tooltip>
                    <v-tooltip :text="recTieneArchivo ? 'Ver/Reemplazar Recomendación Médica' : 'Subir Recomendación Médica'" location="top">
                      <template #activator="{ props }">
                        <v-btn
                          v-bind="props"
                          icon="mdi-paperclip"
                          size="small"
                          variant="text"
                          class="ml-1"
                          :disabled="!tieneRecomendacionesMedicas"
                          :ripple="false"
                          @click.stop="openRecDialog($event)"
                        />
                      </template>
                    </v-tooltip>
                  </div>
                </template>
              </v-text-field>
              <div class="text-caption text-medium-emphasis mb-3" v-if="tieneRecomendacionesMedicas">
                Formatos permitidos: PDF, DOC, DOCX (máx {{ MAX_UPLOAD_MB }} MB)
              </div>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Pasos + Anexar -->
    <v-card elevation="2" v-if="usuarioSeleccionado" class="mt-6">
      <v-card-text>
        <v-row>
          <!-- Pasos -->
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
                      @click.stop="abrirModalPaso(paso, $event)"
                    />
                    <v-btn
                      v-else-if="paso.completado"
                      icon="mdi-pencil-outline"
                      color="warning"
                      variant="tonal"
                      size="small"
                      @click.stop="abrirModalPaso(paso, $event)"
                    />
                  </div>
                </v-timeline-item>
              </v-timeline>
              <v-alert v-if="loadingPasos" type="info" variant="tonal" class="mt-4">
                Cargando pasos...
              </v-alert>
            </v-card>
          </v-col>

          <!-- Anexar/Reemplazar contrato: UN SOLO INPUT -->
          <v-col cols="12" md="6">
            <h4 class="text-h6 mb-2">
              {{ isEditing ? 'Reemplazar Archivo de Contrato (opcional)' : 'Anexar Contrato' }}
            </h4>

            <v-card class="pa-4">
              <!-- Archivo actual (solo en edición) -->
              <v-alert
                v-if="isEditing && contratoEditTieneArchivo"
                type="success"
                variant="tonal"
                class="mb-3"
              >
                <div class="d-flex flex-wrap align-center ga-2">
                  <div>
                    <strong>Actual:</strong> {{ contratoEditNombreArchivo || 'Contrato actual' }}
                  </div>
                  <v-btn
                    size="x-small"
                    variant="tonal"
                    prepend-icon="mdi-file-eye-outline"
                    class="ml-2"
                    :href="toAbsoluteApiUrl(contratoEditArchivoUrl)"
                    target="_blank"
                  >
                    Ver / Descargar
                  </v-btn>
                </div>
              </v-alert>

              <!-- ÚNICO v-file-input -->
              <v-file-input
                :key="fileInputKey"
                label="Subir archivo del contrato físico"
                variant="outlined"
                density="compact"
                show-size
                accept="application/pdf"
                prepend-icon="mdi-file-upload"
                class="mb-1"
                @change="onFileChange"
                ref="fileInputRef"
              >
                <template #append>
                  <v-icon
                    v-if="archivoContrato || (isEditing && contratoEditTieneArchivo)"
                    size="18"
                    color="success"
                    class="ml-2"
                  >mdi-check-circle</v-icon>
                </template>
              </v-file-input>

              <div class="text-caption text-medium-emphasis mb-3">
                Formato permitido: PDF (máx {{ MAX_UPLOAD_MB }} MB)
              </div>

              <v-alert
                v-if="!archivoContrato && !(isEditing && contratoEditTieneArchivo)"
                type="info"
                variant="tonal"
              >
                {{ isEditing ? 'Si no cargas archivo, se mantiene el actual.' : 'Adjunte el archivo del contrato para anexarlo al usuario.' }}
              </v-alert>
              <v-alert v-else type="success" variant="tonal">
                <template v-if="archivoContrato">
                  Archivo <strong>{{ archivoContrato.name }}</strong> listo.
                </template>
                <template v-else>
                  Archivo actual disponible.
                </template>
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
          >
            Cancelar edición
          </v-btn>

          <v-btn
            v-if="!isEditing"
            color="success"
            prepend-icon="mdi-content-save-check"
            :disabled="!usuarioSeleccionado || !archivoContrato || isSaving"
            :loading="isSaving"
            @click="handleConfirmacion"
          >
            Crear y Anexar Contrato
          </v-btn>

          <v-btn
            v-else
            color="warning"
            prepend-icon="mdi-content-save"
            :disabled="!usuarioSeleccionado || isSaving"
            :loading="isSaving"
            @click="guardarCambiosContrato"
          >
            Guardar cambios
          </v-btn>
        </v-card-actions>
      </v-card-text>
    </v-card>

    <!-- Historial de Contratos -->
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
                <v-chip :color="c.estado === 'activo' ? 'success' : 'grey'" size="small" variant="flat">
                  {{ c.estado }}
                </v-chip>
              </td>
              <td>{{ (c.fechaInicio || '').slice(0,10) }}</td>
              <td>{{ c.fechaTerminacion ? String(c.fechaTerminacion).slice(0,10) : '—' }}</td>
              <td>{{ c.sede?.nombre || '—' }}</td>
              <td>{{ c.cargo?.nombre || '—' }}</td>

              <td>
                <div v-if="c.rutaArchivoContratoFisico" class="d-flex flex-wrap ga-2">
                  <v-btn
                    size="x-small"
                    variant="tonal"
                    prepend-icon="mdi-file-eye-outline"
                    :href="toAbsoluteApiUrl(c.rutaArchivoContratoFisico)"
                    target="_blank"
                  >
                    Ver / Descargar
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

    <!-- Modal Paso -->
    <v-dialog v-model="modalPaso.mostrar" max-width="600px">
      <v-card>
        <v-card-title class="text-h6">
          {{ modalPaso.paso?.completado ? 'Editar paso' : 'Completar paso' }}: {{ modalPaso.paso?.nombre }}
        </v-card-title>

        <v-card-text>
          <v-alert
            v-if="isEditing && modalPaso.paso?.archivoUrl"
            type="success"
            variant="tonal"
            class="mb-3"
          >
            <div class="d-flex flex-wrap align-center ga-2">
              <div>
                <strong>Archivo actual:</strong>
                {{ modalPaso.paso?.nombreArchivo || modalPaso.paso?.archivoUrl?.split('/').pop() }}
              </div>
              <v-btn size="x-small" variant="tonal" prepend-icon="mdi-eye" @click="verArchivoPaso">Ver</v-btn>
              <v-btn size="x-small" variant="tonal" prepend-icon="mdi-download" @click="descargarArchivoPaso">Descargar</v-btn>
              <v-btn size="x-small" color="error" variant="tonal" prepend-icon="mdi-delete" @click="eliminarArchivoPaso">Eliminar</v-btn>
            </div>
          </v-alert>

          <v-form ref="formPaso" @submit.prevent="completarPasoConfirmado">
            <v-textarea v-model="modalPaso.form.observacion" label="Observación" variant="outlined" rows="3" class="mb-4" />
            <v-file-input
              v-model="modalPaso.form.archivo"
              label="Archivo adjunto (opcional — reemplaza el actual)"
              variant="outlined"
              density="compact"
              show-size
              prepend-icon="mdi-paperclip"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
              @change="onFilePasoChange"
            />
            <div class="text-caption text-medium-emphasis mt-1">
              Permitidos: PDF, DOC, DOCX, JPG, PNG (máx {{ MAX_UPLOAD_MB }} MB)
            </div>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn color="grey-darken-1" variant="text" @click="cerrarModalPaso">Cancelar</v-btn>
          <v-btn
            :color="modalPaso.paso?.completado ? 'warning' : 'primary'"
            variant="flat"
            :loading="modalPaso.loading"
            :disabled="modalPaso.loading"
            type="submit"
            @click="completarPasoConfirmado"
          >
            {{ modalPaso.paso?.completado ? 'Guardar Cambios' : 'Marcar como Completado' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialogo Certificado -->
    <v-dialog v-model="certDialog.open" max-width="640px">
      <v-card>
        <v-card-title class="text-h6">
          {{ certDialog.entidadNombre ? certDialog.entidadNombre : 'Entidad' }} — Certificado ({{ certDialog.tipo?.toUpperCase() }})
        </v-card-title>
        <v-card-text>
          <v-alert v-if="certDialog.loading" type="info" variant="tonal" class="mb-3">
            Cargando información del certificado...
          </v-alert>

          <div v-else>
            <v-alert v-if="certTieneArchivo" type="success" variant="tonal" class="mb-3">
              <div class="d-flex flex-wrap align-center ga-2">
                <div><strong>Actual:</strong> {{ getArchivoNombre(certDialog.meta) || 'Archivo cargado' }}</div>
              </div>
            </v-alert>

            <v-file-input
              v-model="certDialog.file"
              label="Seleccionar archivo (PDF/JPG/PNG/WEBP)"
              accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
              variant="outlined"
              density="compact"
              prepend-icon="mdi-paperclip"
              show-size
              class="mb-1"
            />
            <div class="text-caption text-medium-emphasis">Permitidos: PDF, JPG, PNG, WEBP (máx {{ MAX_UPLOAD_MB }} MB)</div>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" color="grey-darken-1" @click="cerrarCertDialog">Cerrar</v-btn>
          <v-btn v-if="certTieneArchivo" variant="tonal" prepend-icon="mdi-download" @click="descargarCertificadoSeleccionado">Descargar</v-btn>
          <v-btn v-if="certTieneArchivo" variant="tonal" color="error" prepend-icon="mdi-delete" @click="eliminarCertificadoSeleccionado">Eliminar</v-btn>
          <v-btn color="primary" variant="flat" prepend-icon="mdi-upload" :disabled="!certDialog.file || certDialog.loading" @click="subirCertificadoSeleccionado">
            {{ certTieneArchivo ? 'Reemplazar' : 'Subir' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialogo Recomendación Médica -->
    <v-dialog v-model="recDialog.open" max-width="640px">
      <v-card>
        <v-card-title class="text-h6">Recomendación Médica — Archivo</v-card-title>
        <v-card-text>
          <v-alert v-if="recDialog.loading" type="info" variant="tonal" class="mb-3">
            Cargando información de la recomendación...
          </v-alert>

          <div v-else>
            <v-alert v-if="recTieneArchivo" type="success" variant="tonal" class="mb-3">
              <div class="d-flex flex-wrap align-center ga-2">
                <div><strong>Actual:</strong> {{ recNombreActual || 'Archivo cargado' }}</div>
              </div>
            </v-alert>

            <v-file-input
              v-model="recDialog.file"
              label="Seleccionar archivo (PDF/DOC/DOCX)"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              variant="outlined"
              density="compact"
              prepend-icon="mdi-paperclip"
              show-size
              class="mb-1"
            />
            <div class="text-caption text-medium-emphasis">Permitidos: PDF, DOC, DOCX (máx {{ MAX_UPLOAD_MB }} MB)</div>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" color="grey-darken-1" @click="cerrarRecDialog">Cerrar</v-btn>
          <v-btn v-if="recTieneArchivo" variant="tonal" prepend-icon="mdi-download" @click="descargarRecomendacionSeleccionada">Descargar</v-btn>
          <v-btn v-if="recTieneArchivo" variant="tonal" color="error" prepend-icon="mdi-delete" @click="eliminarRecomendacionSeleccionada">Eliminar</v-btn>
          <v-btn color="primary" variant="flat" prepend-icon="mdi-upload" :disabled="!recDialog.file || recDialog.loading" @click="subirRecomendacionSeleccionada">
            {{ recTieneArchivo ? 'Reemplazar' : 'Subir' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo Confirmación: eliminar recomendación al desmarcar -->
    <v-dialog v-model="dialogEliminarRec" max-width="480px">
      <v-card>
        <v-card-title class="text-h6">Confirmar eliminación</v-card-title>
        <v-card-text>
          Si desmarcas este campo, se eliminará la recomendación médica asociada al contrato.
          <br />¿Deseas continuar?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogEliminarRec = false">Cancelar</v-btn>
          <v-btn color="error" variant="text" @click="confirmarEliminarRecMedica">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Alertas simples -->
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

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :timeout="snackbar.timeout" :color="snackbar.color">
      <v-icon class="mr-2">mdi-check-circle</v-icon>{{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>
<script setup lang="ts">
/* Vue + VeeValidate */
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useForm, useField } from 'vee-validate'

/* Datos maestros */
import { listarRazonesSociales, fetchUsuariosPorRazonSocial } from '@/services/razonSocialService'
import { obtenerSedes, obtenerCargos, obtenerEntidadesSalud } from '@/services/UserService'

/* Contratos (incluye afiliaciones POR CONTRATO) */
import {
  crearContrato,
  anexarContrato,
  crearContratoSalario,
  obtenerContratosPorUsuario,
  actualizarContrato,
  cambiarEstadoContrato,
  obtenerContratoPorId,
  obtenerAfiliacionContratoMeta as obtenerArchivoAfiliacionMeta,
  subirAfiliacionContrato as subirArchivoAfiliacion,
  eliminarAfiliacionContrato as eliminarArchivoAfiliacion,
  subirRecomendacionMedica,
  obtenerRecomendacionMedicaMeta,
  eliminarRecomendacionMedica,
} from '@/services/contratoService'

/* PASOS (solo listar/actualizar/crear) */
import { fetchPasosContrato as fetchPasosContratoAPI } from '@/services/contratosPasosService'

/* ======= Constantes / utils ======= */
const MAX_UPLOAD_MB = 10
const BYTES_MB = 1024 * 1024
const ALLOWED_CONTRATO_MIME = ['application/pdf']
const ALLOWED_REC_EXT = ['pdf', 'doc', 'docx']
const ALLOWED_CERT_EXT = ['pdf', 'jpg', 'jpeg', 'png', 'webp']
const ALLOWED_PASO_EXT = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png']
const MAX_MONEY = 2_000_000_000

const isSaving = ref(false)

/* =====================================================================
 * URL ABSOLUTA HACIA LA API
 * ===================================================================== */
const API_ORIGIN = (() => {
  const env = (import.meta as any)?.env || {}
  const raw = env.VITE_API_BASE_URL || env.VITE_API_URL || 'http://localhost:3333'
  try { return new URL(String(raw)).origin } catch { return String(raw).replace(/\/+$/, '') }
})()

function toAbsoluteApiUrl(input?: string | null): string {
  if (!input) return ''
  const raw = String(input)
  if (/^https?:\/\//i.test(raw)) {
    try {
      const u = new URL(raw)
      if (u.origin === API_ORIGIN) return raw
      if (u.pathname.startsWith('/uploads') || u.pathname.startsWith('/api')) {
        return `${API_ORIGIN}${u.pathname}${u.search}${u.hash}`
      }
      return raw
    } catch { return raw }
  }
  const rel = raw.startsWith('/') ? raw : `/${raw}`
  return `${API_ORIGIN}${rel}`
}

function extOf(name?: string) {
  if (!name) return ''
  const p = name.split('.')
  return (p[p.length - 1] || '').toLowerCase()
}
function validateFileOrMsg(
  file: File | null,
  opts: { allowedMime?: string[], allowedExt?: string[], maxMB?: number }
) {
  if (!file) return 'Archivo requerido.'
  if (opts.maxMB && file.size > (opts.maxMB * BYTES_MB)) return `El archivo supera ${opts.maxMB} MB.`
  if (opts.allowedMime && !opts.allowedMime.includes(file.type)) return `Tipo no permitido (${file.type || 'desconocido'}).`
  if (opts.allowedExt && !opts.allowedExt.includes(extOf(file.name))) return `Extensión no permitida (.${extOf(file.name)}).`
  return null
}
function sanitizeMoney(v: any) {
  if (v === null || v === undefined || v === '') return ''
  const n = Number(String(v).replace(/[^\d.-]/g, ''))
  if (isNaN(n)) return ''
  return Math.min(n, MAX_MONEY)
}

/* ======= Selects / tipos ======= */
const tiposContratoSelectItems = ref([
  { nombre: 'Prestación de Servicios', valor: 'prestacion' },
  { nombre: 'Temporal', valor: 'temporal' },
  { nombre: 'Laboral', valor: 'laboral' },
  { nombre: 'Contrato de Aprendizaje', valor: 'aprendizaje' },
])

type AfiliacionTipo = 'eps' | 'arl' | 'afp' | 'afc' | 'ccf'
interface Paso {
  id?: number
  nombre: string
  completado: boolean
  observacion?: string
  nombreArchivo?: string
  fechaCompletado?: string
  archivoUrl?: string
  archivoFile?: File | null
  fase: 'inicio' | 'desarrollo' | 'fin'
  orden?: number
}
interface ContratoRow {
  id: number
  tipoContrato: string
  terminoContrato: string | null
  estado: 'activo' | 'inactivo'
  fechaInicio: string
  fechaTerminacion: string | null
  sede?: any
  cargo?: any
  rutaArchivoContratoFisico?: string | null
  rutaArchivoRecomendacionMedica?: string | null
  salarios?: Array<{ salarioBasico:number; bonoSalarial:number; auxilioTransporte:number; auxilioNoSalarial:number }>
  salarioBasico?: number
  bonoSalarial?: number
  auxilioTransporte?: number
  auxilioNoSalarial?: number
  epsId?: number | null; arlId?: number | null; afpId?: number | null; afcId?: number | null; ccfId?: number | null
}

/* ======= Estado base ======= */
const razonSocialSeleccionada = ref<number | null>(null)
const usuarioSeleccionado = ref<number | null>(null)
const tipoContratoSeleccionado = ref<'prestacion' | 'temporal' | 'laboral' | 'aprendizaje'>('prestacion')

const razonesSociales = ref<any[]>([])
const usuarios = ref<any[]>([])
const sedes = ref<any[]>([])
const cargos = ref<any[]>([])
const entidadesSalud = ref<any[]>([])

const loadingRazonesSociales = ref(false)
const loadingUsuarios = ref(false)
const loadingSedes = ref(false)
const loadingCargos = ref(false)
const loadingEntidades = ref(false)
const loadingPasos = ref(false)

const isEditing = ref(false)
const contratoEditId = ref<number | null>(null)

/* ======= Archivos: contrato + recomendación ======= */
const archivoContrato = ref<File | null>(null)
const fileInputKey = ref(0)
const fileInputRef = ref<HTMLInputElement | null>(null)
const identificacionRef = ref<HTMLInputElement | null>(null)

const tieneRecomendacionesMedicas = ref(false)
const archivoRecomendacionMedica = ref<File | null>(null)

/* ======= Afiliaciones (por contrato) ======= */
const certStatusByTipo = ref<Record<AfiliacionTipo, boolean>>({
  eps:false, arl:false, afp:false, afc:false, ccf:false
})
const afiliacionMetaByTipo = ref<Record<AfiliacionTipo, any | null>>({
  eps:null, arl:null, afp:null, afc:null, ccf:null
})
const pendingCertsByTipo = ref<Record<AfiliacionTipo, File | null>>({
  eps:null, arl:null, afp:null, afc:null, ccf:null
})
const pendingEntidadIdByTipo = ref<Record<AfiliacionTipo, number | null>>({
  eps:null, arl:null, afp:null, afc:null, ccf:null
})
const certUiTick = ref(0)
const certStatusKey = (t: AfiliacionTipo) =>
  `${(isEditing.value ? contratoEditId.value : 'new')}-${t}-${Number(!!certStatusByTipo.value[t])}-${certUiTick.value}`
function setCertState(tipo: AfiliacionTipo, has:boolean, meta:any|null) {
  certStatusByTipo.value = { ...certStatusByTipo.value, [tipo]: !!has }
  afiliacionMetaByTipo.value = { ...afiliacionMetaByTipo.value, [tipo]: meta }
  certUiTick.value++
}
function hasCert(tipo: AfiliacionTipo) {
  const meta = afiliacionMetaByTipo.value[tipo]
  return !!certStatusByTipo.value[tipo] || !!meta?.data?.url || !!meta?.data?.nombreOriginal || !!meta?.url
}
function hasCertUI(tipo: AfiliacionTipo) {
  return isEditing.value ? hasCert(tipo) : !!pendingCertsByTipo.value[tipo]
}
function tieneArchivoAfiliacion(meta:any) {
  try { return !!(meta?.data?.url || meta?.data?.nombreOriginal || meta?.url || meta?.nombreOriginal) }
  catch { return false }
}
function getArchivoNombre(meta: any) {
  return meta?.data?.nombreOriginal || meta?.data?.filename || meta?.data?.name || meta?.nombreOriginal || meta?.url?.split('/')?.pop() || ''
}
function getEntidadIdByTipo(t: AfiliacionTipo): number | null {
  const map: Record<AfiliacionTipo, number | null> = {
    eps: epsId.value, arl: arlId.value, afp: afpId.value, afc: afcId.value, ccf: ccfId.value
  }
  return map[t]
}

/* ======= Recomendación médica ======= */
const recMetaCache = ref<{ url?: string | null, nombre?: string | null } | null>(null)
const recUiTick = ref(0)
const recUiKey = computed(() => `${contratoEditId.value || 'new'}-${recUiTick.value}`)
const recTieneArchivo = computed(() => isEditing.value ? !!recMetaCache.value?.url : !!archivoRecomendacionMedica.value)
const recNombreActual = computed(() => isEditing.value ? (recMetaCache.value?.nombre || recMetaCache.value?.url?.split('/').pop() || '') : (archivoRecomendacionMedica.value?.name || ''))

/* ======= 🔹 Helper: sincroniza el switch según meta/archivo/flag backend ======= */
function syncTieneRecFlagFromMeta(extraFlag?: any) {
  const hasMeta = !!(recMetaCache.value?.url || recMetaCache.value?.nombre)
  const hasPending = !!archivoRecomendacionMedica.value
  tieneRecomendacionesMedicas.value = Boolean(extraFlag || hasMeta || hasPending)
}

/* ======= Validaciones ======= */
const { handleSubmit, resetForm, validate } = useForm()
const required = (v:any) => (v !== null && v !== undefined && v !== '') || 'Este campo es obligatorio.'

/** Opciones del término por tipo de contrato */
const terminosContratoOptions = computed(() => {
  const t = tipoContratoSeleccionado.value
  if (t === 'laboral') {
    return [
      { text: 'Fijo', value: 'fijo' },
      { text: 'Obra o labor determinada', value: 'obra_o_labor_determinada' },
      { text: 'Indefinido', value: 'indefinido' },
    ]
  }
  if (t === 'temporal') {
    return [{ text:'Obra o labor determinada', value:'obra_o_labor_determinada' }]
  }
  if (t === 'prestacion') {
    return [
      { text: 'Fijo', value: 'fijo' },
      { text: 'Obra o labor determinada', value: 'obra_o_labor_determinada' },
    ]
  }
  // aprendizaje
  return [{ text:'Fijo', value:'fijo' }]
})

/** Reglas: obligatorio si hay opciones para elegir */
const terminoContratoRules = computed(() =>
  terminosContratoOptions.value.length ? [required] : []
)

const isFechaTerminacionRequired = computed(() => {
  const t = tipoContratoSeleccionado.value
  if (t === 'prestacion' || t === 'aprendizaje' || t === 'temporal') return true
  if (t === 'laboral') return terminoContrato.value !== 'indefinido'
  return false
})
const isFechaTerminacionVisible = isFechaTerminacionRequired

const fechaTerminacionRules = computed(() => isFechaTerminacionRequired.value ? [required] : [])

const { value: identificacion, errorMessage: identificacionError } =
  useField('identificacion', [required, (val:string)=> (val?.trim()?.length ?? 0) >= 5 || 'Debe tener al menos 5 caracteres.'], { initialValue: '' })
const { value: sedeId, errorMessage: sedeIdError } = useField<number | null>('sedeId', [required], { initialValue: null })
const { value: cargoId, errorMessage: cargoIdError } = useField<number | null>('cargoId', [required], { initialValue: null })
const { value: funcionesCargo, errorMessage: funcionesCargoError } = useField('funcionesCargo', [required], { initialValue: '' })

const { value: fechaInicio, errorMessage: fechaInicioError } = useField('fechaInicio', [required], { initialValue: '' })
const { value: fechaTerminacion, errorMessage: fechaTerminacionError } = useField('fechaTerminacion', fechaTerminacionRules, { initialValue: '' })
const { value: terminoContrato, errorMessage: terminoContratoError } = useField('terminoContrato', terminoContratoRules, { initialValue: null })

// Afiliaciones obligatorias (AFC opcional)
const { value: epsId, errorMessage: epsIdError } = useField<number | null>('epsId', [required], { initialValue: null })
const { value: arlId, errorMessage: arlIdError } = useField<number | null>('arlId', [required], { initialValue: null })
const { value: afpId, errorMessage: afpIdError } = useField<number | null>('afpId', [required], { initialValue: null })
const { value: afcId } = useField<number | null>('afcId', [], { initialValue: null })
const { value: ccfId, errorMessage: ccfIdError } = useField<number | null>('ccfId', [required], { initialValue: null })

/* Dinero */
const moneyRules = [
  (v: any) => (v === '' || v === null || v === undefined || Number(v) >= 0) || 'No puede ser negativo.',
  (v: any) => (v === '' || Number(v) <= MAX_MONEY) || `No puede superar ${MAX_MONEY.toLocaleString('es-CO')}.`,
]
const requiredMoney = (v:any) => (v !== '' && v !== null && v !== undefined) || 'Requerido.'
const { value: salarioBasico, errorMessage: salarioBasicoError } = useField('salarioBasico', [requiredMoney, ...moneyRules], { initialValue: '' })
const { value: bonoSalarial } = useField('bonoSalarial', moneyRules, { initialValue: '' })
const { value: auxilioTransporte } = useField('auxilioTransporte', moneyRules, { initialValue: '' })
const { value: auxilioNoSalarial } = useField('auxilioNoSalarial', moneyRules, { initialValue: '' })

const { value: centroCosto } = useField('centroCosto', [], { initialValue: '' })

const salarioTotalCalculado = computed(() => {
  const sb = Number(salarioBasico.value) || 0
  const bs = Number(bonoSalarial.value) || 0
  const at = Number(auxilioTransporte.value) || 0
  const ans = Number(auxilioNoSalarial.value) || 0
  return (sb + bs + at + ans).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })
})

/* ======= Datos auxiliares ======= */
const centrosCostoOptions = ref<string[]>([
  'ADMINISTRACIÓN','TALENTO HUMANO','CONTABILIDAD','OPERACIÓN','SERVICIO AL CLIENTE','DIRECCIÓN','COMERCIAL',
])
const filteredEps = computed(() => entidadesSalud.value.filter((e: any) => e.tipo === 'eps'))
const filteredArl = computed(() => entidadesSalud.value.filter((e: any) => e.tipo === 'arl'))
const filteredAfp = computed(() => entidadesSalud.value.filter((e: any) => e.tipo === 'afp'))
const filteredAfc = computed(() => entidadesSalud.value.filter((e: any) => e.tipo === 'afc'))
const filteredCcf = computed(() => entidadesSalud.value.filter((e: any) => e.tipo === 'ccf'))

/* ======= Pasos ======= */
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

const pasosBackend = ref<Paso[] | null>(null)
const pasosVersion = ref(0)
function resetPasos() {
  pasosVersion.value++
  pasosBackend.value = null
}
const pasosContrato = computed<Paso[]>(() => {
  void pasosVersion.value
  if (isEditing.value && pasosBackend.value) return pasosBackend.value
  let base: Paso[] = []
  if (tipoContratoSeleccionado.value === 'prestacion' || tipoContratoSeleccionado.value === 'aprendizaje') base = basePasosPrestacion
  else if (tipoContratoSeleccionado.value === 'temporal') base = basePasosTemporal
  else base = basePasosLaboral

  return base.map((p, i) => (Object.assign({}, p, {
    id: undefined,
    orden: i + 1,
    completado: false,
    observacion: undefined,
    nombreArchivo: undefined,
    archivoUrl: undefined,
    archivoFile: null,
    fechaCompletado: undefined,
  })))
})
function filenameFromUrl(u?: string | null) {
  if (!u) return undefined
  try { return decodeURIComponent(u.split('/').pop() || '') || undefined } catch { return (u.split('/').pop() || undefined) }
}
function mapPasoAPItoUI(raw: any): Paso {
  return {
    id: raw.id,
    nombre: raw.nombrePaso ?? raw.nombre_paso ?? '',
    fase: (raw.fase || 'inicio'),
    orden: raw.orden ?? undefined,
    completado: !!raw.completado,
    observacion: raw.observacion ?? undefined,
    fechaCompletado: raw.fecha ?? undefined,
    archivoUrl: raw.archivoUrl ?? raw.archivo_url ?? undefined,
    nombreArchivo: filenameFromUrl(raw.archivoUrl ?? raw.archivo_url),
    archivoFile: null,
  }
}
async function cargarPasosDesdeBackend(contratoId: number) {
  loadingPasos.value = true
  try {
    const list = await fetchPasosContratoAPI(contratoId)
    pasosBackend.value = list.map(mapPasoAPItoUI)
  } catch {
    pasosBackend.value = []
  } finally { loadingPasos.value = false }
}

/* ======= Alertas / snackbar ======= */
const showAlertDialog = ref(false)
const alertDialogTitle = ref('')
const alertDialogMessage = ref('')
const showAlert = (title: string, message: string) => {
  alertDialogTitle.value = title
  alertDialogMessage.value = message
  showAlertDialog.value = true
}
const snackbar = ref({ show:false, text:'', color:'success', timeout:1800 })
const notify = (text:string, color='success') => { snackbar.value = { show:true, text, color, timeout:1800 } }

/* ======= Certificados (por contrato) ======= */
const certDialog = ref({
  open:false,
  tipo: '' as AfiliacionTipo | '',
  entidadId: null as number | null,
  entidadNombre: '',
  file: null as File | null,
  loading: false,
  meta: null as any
})
const certTieneArchivo = computed(() => {
  const t = certDialog.value.tipo as AfiliacionTipo
  const meta = certDialog.value.meta ?? (t ? afiliacionMetaByTipo.value[t] : null)
  try { return tieneArchivoAfiliacion(meta) } catch { return false }
})
function cerrarCertDialog() {
  certDialog.value = { ...certDialog.value, open:false, tipo:'', entidadId:null, entidadNombre:'', file:null, loading:false, meta:null }
}
function openCert(tipo: AfiliacionTipo, ev?: MouseEvent) {
  ev?.stopPropagation(); ev?.preventDefault()
  abrirDialogoCertificado(tipo)
}
async function abrirDialogoCertificado(tipo: AfiliacionTipo) {
  const idMap: Record<AfiliacionTipo, number | null> = { eps: epsId.value, arl: arlId.value, afp: afpId.value, afc: afcId.value, ccf: ccfId.value }
  const id = idMap[tipo]
  if (!id) return showAlert('Selecciona una entidad', 'Elige la entidad para gestionar su certificado.')

  const ent = entidadesSalud.value.find((e:any) => e.id === id)
  certDialog.value = {
    ...certDialog.value,
    open: true, tipo, entidadId: id,
    entidadNombre: ent?.nombre || `Entidad ${id}`,
    file: null, loading: false,
    meta: null,
  }

  if (isEditing.value && contratoEditId.value) {
    certDialog.value.loading = true
    try {
      const meta = await obtenerArchivoAfiliacionMeta(Number(contratoEditId.value), tipo)
      setCertState(tipo, tieneArchivoAfiliacion(meta), meta)
      certDialog.value.meta = meta
    } catch {
      setCertState(tipo, false, null)
    } finally {
      certDialog.value.loading = false
    }
  }
}
async function subirCertificadoSeleccionado() {
  const t = certDialog.value.tipo as AfiliacionTipo
  const entidadId = certDialog.value.entidadId
  if (!t) return
  if (!entidadId) { notify('Selecciona primero la entidad.', 'error'); return }
  if (!certDialog.value.file) { notify('Adjunta un archivo.', 'error'); return }

  const msg = validateFileOrMsg(certDialog.value.file, { allowedExt: ALLOWED_CERT_EXT, maxMB: MAX_UPLOAD_MB })
  if (msg) { notify(msg, 'error'); return }

  if (!isEditing.value) {
    pendingCertsByTipo.value[t] = certDialog.value.file
    pendingEntidadIdByTipo.value[t] = entidadId
    certUiTick.value++
    certDialog.value.file = null
    notify('Archivo preparado. Se subirá al guardar el contrato.', 'success')
    return
  }

  if (!contratoEditId.value) return
  certDialog.value.loading = true
  try {
    await (subirArchivoAfiliacion as any)(Number(contratoEditId.value), t, certDialog.value.file, entidadId)
    const meta = await obtenerArchivoAfiliacionMeta(Number(contratoEditId.value), t)
    setCertState(t, true, meta)
    certDialog.value.meta = meta
    certDialog.value.file = null
    notify('Archivo de afiliación guardado con éxito', 'success')
  } catch (e:any) {
    notify(e?.message || 'No fue posible subir el archivo.', 'error')
  } finally {
    certDialog.value.loading = false
  }
}
async function eliminarCertificadoSeleccionado() {
  const t = certDialog.value.tipo as AfiliacionTipo
  if (!t) return

  if (!isEditing.value) {
    pendingCertsByTipo.value[t] = null
    pendingEntidadIdByTipo.value[t] = null
    certUiTick.value++
    notify('Archivo pendiente descartado.', 'success')
    return
  }

  if (!contratoEditId.value) return
  try {
    await eliminarArchivoAfiliacion(Number(contratoEditId.value), t)
    setCertState(t, false, null)
    certDialog.value.meta = null
    certDialog.value.file = null
    notify('Archivo eliminado', 'success')
  } catch (e:any) {
    notify(e?.message || 'No fue posible eliminar el archivo.', 'error')
  }
}
async function descargarCertificadoSeleccionado() {
  const t = certDialog.value.tipo as AfiliacionTipo

  if (!isEditing.value) {
    const f = pendingCertsByTipo.value[t]
    if (!f) return notify('No hay archivo para ver.', 'error')
    const url = URL.createObjectURL(f)
    window.open(url, '_blank', 'noopener')
    return
  }
  const meta = certDialog.value.meta ?? (t ? afiliacionMetaByTipo.value[t] : null)
  const urlRaw = meta?.data?.url || meta?.url
  if (!urlRaw) return notify('No hay archivo para ver.', 'error')
  const url = toAbsoluteApiUrl(urlRaw)
  window.open(url, '_blank', 'noopener')
}

/* ======= Recomendación: modal de archivo ======= */
const recDialog = ref({ open:false, file:null as File | null, loading:false })
function openRecDialog(ev?: MouseEvent) {
  ev?.stopPropagation(); ev?.preventDefault()
  if (!tieneRecomendacionesMedicas.value) return showAlert('No aplica', 'Activa el switch para gestionar la recomendación.')
  recDialog.value = { open:true, file:null, loading:false }
}
function cerrarRecDialog(){ recDialog.value = { open:false, file:null, loading:false } }
async function subirRecomendacionSeleccionada() {
  if (!recDialog.value.file) return
  const msg = validateFileOrMsg(recDialog.value.file, { allowedExt: ALLOWED_REC_EXT, maxMB: MAX_UPLOAD_MB })
  if (msg) return notify(msg, 'error')

  if (!isEditing.value) {
    archivoRecomendacionMedica.value = recDialog.value.file
    recUiTick.value++
    notify('Recomendación preparada para la creación del contrato.', 'success')
    return cerrarRecDialog()
  }
  if (!contratoEditId.value) return notify('No hay contrato en edición.', 'error')
  try {
    recDialog.value.loading = true
    await subirRecomendacionMedica(Number(contratoEditId.value), recDialog.value.file)
    const meta = await obtenerRecomendacionMedicaMeta(Number(contratoEditId.value))
    recMetaCache.value = { url: meta?.data?.url || null, nombre: meta?.data?.nombreOriginal || null }
    recUiTick.value++
    // ⚙️ Re-sincroniza el switch
    syncTieneRecFlagFromMeta(true)
    notify('Recomendación médica actualizada.', 'success')
    cerrarRecDialog()
  } catch (e:any) {
    notify(e?.message || 'No fue posible subir la recomendación.', 'error')
  } finally {
    recDialog.value.loading = false
  }
}
async function eliminarRecomendacionSeleccionada() {
  if (!isEditing.value) {
    archivoRecomendacionMedica.value = null
    recUiTick.value++
    // Si no hay archivo/flag en creación, desmarca
    syncTieneRecFlagFromMeta(false)
    cerrarRecDialog()
    return
  }
  if (!contratoEditId.value) return
  try {
    await eliminarRecomendacionMedica(Number(contratoEditId.value))
    recMetaCache.value = null
    recUiTick.value++
    tieneRecomendacionesMedicas.value = false
    notify('Recomendación eliminada.', 'success')
    cerrarRecDialog()
  } catch (e:any) {
    notify(e?.message || 'No fue posible eliminar la recomendación.', 'error')
  }
}
async function descargarRecomendacionSeleccionada() {
  if (!isEditing.value && archivoRecomendacionMedica.value) {
    const f = archivoRecomendacionMedica.value
    const u = URL.createObjectURL(f)
    window.open(u, '_blank', 'noopener')
    return
  }
  if (isEditing.value) {
    const u = recMetaCache.value?.url
    if (u) return window.open(toAbsoluteApiUrl(u), '_blank', 'noopener')
  }
  notify('No hay archivo para ver.', 'error')
}

/* ======= Diálogo de confirmación al desmarcar el check ======= */
const dialogEliminarRec = ref(false)

watch(tieneRecomendacionesMedicas, async (nuevo, viejo) => {
  // Si estaba marcado y el usuario lo desmarca…
  if (viejo && !nuevo) {
    // En edición: si hay archivo real en backend, pedimos confirmación
    if (isEditing.value && recMetaCache.value?.url) {
      dialogEliminarRec.value = true
      // Revertimos visualmente hasta que confirme
      tieneRecomendacionesMedicas.value = true
      return
    }
    // En creación: limpiar el archivo en memoria si lo había
    archivoRecomendacionMedica.value = null
    recUiTick.value++
  }
})

async function confirmarEliminarRecMedica() {
  try {
    if (isEditing.value && contratoEditId.value) {
      await eliminarRecomendacionMedica(Number(contratoEditId.value))
    }
    recMetaCache.value = null
    archivoRecomendacionMedica.value = null
    tieneRecomendacionesMedicas.value = false
    recUiTick.value++
    notify('Recomendación médica eliminada')
  } catch (e:any) {
    showAlert('Error', e?.message || 'No se pudo eliminar la recomendación médica')
  } finally {
    dialogEliminarRec.value = false
  }
}

/* ======= Carga de datos ======= */
const contratosUsuario = ref<ContratoRow[]>([])
const loadingContratos = ref(false)
async function cargarHistorialContratos() {
  if (!usuarioSeleccionado.value) { contratosUsuario.value = []; return }
  loadingContratos.value = true
  try { contratosUsuario.value = await obtenerContratosPorUsuario(Number(usuarioSeleccionado.value)) }
  catch { contratosUsuario.value = [] }
  finally { loadingContratos.value = false }
}
async function cargarRazonesSociales(){ loadingRazonesSociales.value = true; try { razonesSociales.value = await listarRazonesSociales() } finally { loadingRazonesSociales.value = false } }
async function cargarUsuariosPorRazonSocial(){
  loadingUsuarios.value = true; usuarios.value = []; usuarioSeleccionado.value = null
  if (razonSocialSeleccionada.value) {
    try {
      const data = await fetchUsuariosPorRazonSocial(razonSocialSeleccionada.value)
      usuarios.value = data.map((u:any)=>({ ...u, nombreCompleto:`${u.nombres} ${u.apellidos}` }))
    } finally { loadingUsuarios.value = false }
  } else loadingUsuarios.value = false
}
async function cargarSedes(){ loadingSedes.value = true; try { sedes.value = await obtenerSedes() } finally { loadingSedes.value = false } }
async function cargarCargos(){ loadingCargos.value = true; try { cargos.value = await obtenerCargos() } finally { loadingCargos.value = false } }
async function cargarEntidadesSalud(){ loadingEntidades.value = true; try { entidadesSalud.value = await obtenerEntidadesSalud() } finally { loadingEntidades.value = false } }

/* ======= Crear contrato ======= */
const submitForm = handleSubmit(async (values) => { await crearYAnexarContrato(values) })
async function handleConfirmacion() {
  if (isSaving.value) return

  // Validación general VeeValidate
  const { valid } = await validate()
  if (!valid) return showAlert('Error de Validación', 'Revisa los campos en rojo.')

  // 🔒 Validación/forzado del término por tipo
  const tipo = tipoContratoSeleccionado.value
  const termino = terminoContrato.value as string | null

  if (tipo === 'prestacion' && !termino) {
    return showAlert('Falta el término', 'Selecciona el Término de Contrato (Fijo u Obra o labor determinada).')
  }
  if (tipo === 'temporal') {
    if (!termino || termino !== 'obra_o_labor_determinada') {
      terminoContrato.value = 'obra_o_labor_determinada'
    }
  }
  if (tipo === 'aprendizaje') {
    if (!termino || termino !== 'fijo') {
      terminoContrato.value = 'fijo'
    }
  }
  if (tipo === 'laboral' && !termino) {
    return showAlert('Falta el término', 'En contrato laboral selecciona Fijo, Obra o labor determinada o Indefinido.')
  }

  // Fecha terminación (según reglas)
  if (isFechaTerminacionRequired.value && !fechaTerminacion.value) {
    return showAlert('Advertencia', 'La fecha de terminación es obligatoria para este tipo de contrato.')
  }

  // Archivo contrato
  const contratoMsg = validateFileOrMsg(archivoContrato.value, { allowedMime: ALLOWED_CONTRATO_MIME, maxMB: MAX_UPLOAD_MB })
  if (contratoMsg) return showAlert('Archivo de contrato inválido', contratoMsg)

  // Recomendación médica si aplica
  if (tieneRecomendacionesMedicas.value && archivoRecomendacionMedica.value) {
    const recMsg = validateFileOrMsg(archivoRecomendacionMedica.value, { allowedExt: ALLOWED_REC_EXT, maxMB: MAX_UPLOAD_MB })
    if (recMsg) return showAlert('Archivo de recomendación inválido', recMsg)
  }

  await submitForm()
}
async function crearYAnexarContrato(formData:any) {
  if (isSaving.value) return
  isSaving.value = true
  try {
    if (!usuarioSeleccionado.value || !archivoContrato.value || !razonSocialSeleccionada.value) {
      showAlert('Error', 'Falta información clave.'); return
    }

    // 🔧 Normalización de término ANTES de enviar al backend
    const terminoNormalizado = (() => {
      const tipo = tipoContratoSeleccionado.value
      const valor = terminoContrato.value as string | null
      if (tipo === 'temporal') return 'obra_o_labor_determinada'
      if (tipo === 'aprendizaje') return 'fijo'
      return valor || null
    })()

    const fechaTerminacionNormalizada =
      isFechaTerminacionRequired.value ? (formData.fechaTerminacion || null) : null

    const payloadContrato:any = {
      usuarioId: Number(usuarioSeleccionado.value),
      razonSocialId: Number(razonSocialSeleccionada.value),
      identificacion: (identificacion.value || '').trim(),
      sedeId: sedeId.value ? Number(sedeId.value) : null,
      cargoId: cargoId.value ? Number(cargoId.value) : null,
      funcionesCargo: (funcionesCargo.value || '').trim() || null,
      fechaInicio: formData.fechaInicio || null,
      fechaTerminacion: fechaTerminacionNormalizada,
      tipoContrato: tipoContratoSeleccionado.value,
      terminoContrato: terminoNormalizado,
      estado: 'activo',
      centroCosto: (centroCosto.value || '').trim() || null,
      epsId: epsId.value ?? null,
      arlId: arlId.value ?? null,
      afpId: afpId.value ?? null,
      afcId: afcId.value ?? null,
      ccfId: ccfId.value ?? null,
      tieneRecomendacionesMedicas: !!tieneRecomendacionesMedicas.value,
      salarioBasico: Number(salarioBasico.value) || 0,
      bonoSalarial: Number(bonoSalarial.value) || 0,
      auxilioTransporte: Number(auxilioTransporte.value) || 0,
      auxilioNoSalarial: Number(auxilioNoSalarial.value) || 0,
    }

    const nuevoContrato:any = await crearContrato(payloadContrato)

    const salarioViene = Array.isArray(nuevoContrato.salarios) && nuevoContrato.salarios.length > 0
    if (!salarioViene) {
      await crearContratoSalario({
        contratoId: Number(nuevoContrato.id),
        salarioBasico: Number(salarioBasico.value) || 0,
        bonoSalarial: Number(bonoSalarial.value) || 0,
        auxilioTransporte: Number(auxilioTransporte.value) || 0,
        auxilioNoSalarial: Number(auxilioNoSalarial.value) || 0,
        fechaEfectiva: `${formData.fechaInicio || new Date().toISOString().slice(0,10)}T00:00:00`,
      })
    }

    await anexarContrato({
      contratoId: Number(nuevoContrato.id),
      archivo: archivoContrato.value!,
      razonSocialId: Number(razonSocialSeleccionada.value),
      tieneRecomendacionesMedicas: !!tieneRecomendacionesMedicas.value && !!archivoRecomendacionMedica.value,
      archivoRecomendacionMedica: archivoRecomendacionMedica.value || undefined,
    })

    // Subir afiliaciones pendientes
    try {
      const tipos: AfiliacionTipo[] = ['eps','arl','afp','afc','ccf']
      const uploads: Promise<any>[] = []
      for (const t of tipos) {
        const file = pendingCertsByTipo.value[t]
        if (!file) continue
        const entidadIdPersistida = pendingEntidadIdByTipo.value[t]
        const entidadIdVigente = getEntidadIdByTipo(t)
        const entidadFinal = entidadIdPersistida ?? entidadIdVigente
        if (!entidadFinal) {
          notify(`No se pudo subir ${t.toUpperCase()}: falta entidad seleccionada.`, 'error')
          continue
        }
        uploads.push((subirArchivoAfiliacion as any)(Number(nuevoContrato.id), t, file, entidadFinal))
      }
      if (uploads.length) await Promise.all(uploads)
    } catch (e:any) {
      notify(e?.message || 'Algunas afiliaciones no pudieron subirse.', 'error')
    }

    // Crear pasos base
    try {
      const { crearPasoContrato } = await import('@/services/contratosPasosService')
      const creates = pasosContrato.value.map(p => {
        const fd = new FormData()
        fd.append('fase', p.fase)
        fd.append('nombrePaso', p.nombre)
        if (p.orden != null) fd.append('orden', String(p.orden))
        fd.append('completado', p.completado ? 'true' : 'false')
        if (p.observacion) fd.append('observacion', p.observacion)
        if (p.fechaCompletado) fd.append('fecha', p.fechaCompletado)
        if (p.archivoFile) fd.append('archivo', p.archivoFile, p.archivoFile.name)
        return crearPasoContrato(Number(nuevoContrato.id), fd)
      })
      await Promise.all(creates)
    } catch {}

    notify('Contrato creado y archivos anexados.', 'success')
    await resetParaSiguienteEnMismaRazon()
  } catch (e:any) {
    showAlert('Error', e?.message || 'No fue posible crear el contrato.')
  } finally { isSaving.value = false }
}

/* ======= Edición ======= */
const contratoEditArchivoUrl = ref<string | null>(null)
const contratoEditNombreArchivo = ref<string>('')
const contratoEditTieneArchivo = computed(() => !!contratoEditArchivoUrl.value)

async function editarContrato(c: ContratoRow) {
  isEditing.value = true
  contratoEditId.value = c.id
  let src:any = c
  try { src = await obtenerContratoPorId(c.id) } catch {}

  tipoContratoSeleccionado.value = src.tipoContrato ?? c.tipoContrato
  identificacion.value = src.identificacion ?? ''
  sedeId.value = src.sede?.id ?? src.sedeId ?? null
  cargoId.value = src.cargo?.id ?? src.cargoId ?? null
  funcionesCargo.value = src.funcionesCargo ?? ''
  fechaInicio.value = (src.fechaInicio || '').slice(0,10)
  fechaTerminacion.value = src.fechaTerminacion ? String(src.fechaTerminacion).slice(0,10) : ''
  terminoContrato.value = src.terminoContrato ?? null
  centroCosto.value = src.centroCosto ?? ''

  epsId.value = src.epsId ?? null; arlId.value = src.arlId ?? null; afpId.value = src.afpId ?? null; afcId.value = src.afcId ?? null; ccfId.value = src.ccfId ?? null

  salarioBasico.value = String(
    (src.salarioBasico as number | undefined)
    ?? (Array.isArray(src.salarios) ? src.salarios[0]?.salarioBasico : undefined)
    ?? 0
  )
  bonoSalarial.value = String((src.bonoSalarial ?? (Array.isArray(src.salarios) ? src.salarios[0]?.bonoSalarial : '')) ?? '')
  auxilioTransporte.value = String((src.auxilioTransporte ?? (Array.isArray(src.salarios) ? src.salarios[0]?.auxilioTransporte : '')) ?? '')
  auxilioNoSalarial.value = String((src.auxilioNoSalarial ?? (Array.isArray(src.salarios) ? src.salarios[0]?.auxilioNoSalarial : '')) ?? '')

  contratoEditArchivoUrl.value = src.rutaArchivoContratoFisico || null
  contratoEditNombreArchivo.value = contratoEditArchivoUrl.value?.split('/')?.pop() || 'Contrato actual'

  // Recomendación meta (primera pasada por src)
  recMetaCache.value = {
    url: src.rutaArchivoRecomendacionMedica || null,
    nombre: (src.rutaArchivoRecomendacionMedica?.split('/')?.pop() || null)
  }
  // 🔹 Marca el check si el contrato ya trae archivo/flag
  syncTieneRecFlagFromMeta(src.tieneRecomendacionesMedicas)

  // Luego consulta meta real y re-sincroniza
  try {
    const meta = await obtenerRecomendacionMedicaMeta(Number(c.id))
    if (meta?.data) {
      recMetaCache.value = {
        url: meta.data.url || recMetaCache.value?.url || null,
        nombre: meta.data.nombreOriginal || recMetaCache.value?.nombre || null
      }
    }
    // 🔹 Re-sincroniza con lo real del backend
    syncTieneRecFlagFromMeta(src.tieneRecomendacionesMedicas)
  } catch {}
  recUiTick.value++

  // Chulos de afiliaciones
  await Promise.all(['eps','arl','afp','afc','ccf'].map(async (t:any)=>{
    try {
      const meta = await obtenerArchivoAfiliacionMeta(Number(c.id), t as AfiliacionTipo)
      setCertState(t, tieneArchivoAfiliacion(meta), meta)
    } catch { setCertState(t, false, null) }
  }))

  // Pasos reales
  try { await cargarPasosDesdeBackend(Number(c.id)) } catch {}

  archivoContrato.value = null
  archivoRecomendacionMedica.value = null
  await nextTick(); window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function guardarCambiosContrato() {
  if (isSaving.value) return
  isSaving.value = true
  try {
    if (!contratoEditId.value) return
    const { valid } = await validate()
    if (!valid) { showAlert('Error de Validación', 'Revisa los campos obligatorios.'); return }

    // 🔒 Validaciones de término en edición también
    const tipo = tipoContratoSeleccionado.value
    const termino = terminoContrato.value as string | null
    if (tipo === 'prestacion' && !termino) {
      showAlert('Falta el término', 'Selecciona el Término de Contrato (Fijo u Obra o labor determinada).')
      return
    }
    if (tipo === 'laboral' && !termino) {
      showAlert('Falta el término', 'En contrato laboral selecciona Fijo, Obra o labor determinada o Indefinido.')
      return
    }

    if (isFechaTerminacionRequired.value && !fechaTerminacion.value) {
      showAlert('Advertencia', 'La fecha de terminación es obligatoria para este tipo de contrato.')
      return
    }

    if (archivoContrato.value) {
      const msg = validateFileOrMsg(archivoContrato.value, { allowedMime: ALLOWED_CONTRATO_MIME, maxMB: MAX_UPLOAD_MB })
      if (msg) { showAlert('Archivo de contrato inválido', msg); return }
    }
    if (tieneRecomendacionesMedicas.value && archivoRecomendacionMedica.value) {
      const msg = validateFileOrMsg(archivoRecomendacionMedica.value, { allowedExt: ALLOWED_REC_EXT, maxMB: MAX_UPLOAD_MB })
      if (msg) { showAlert('Archivo de recomendación inválido', msg); return }
    }

    // 🔧 Normalización de término en edición
    const terminoNormalizado = (() => {
      const tipo = tipoContratoSeleccionado.value
      const valor = terminoContrato.value as string | null
      if (tipo === 'temporal') return 'obra_o_labor_determinada'
      if (tipo === 'aprendizaje') return 'fijo'
      return valor || null
    })()

    const fechaTerminacionNormalizada =
      isFechaTerminacionRequired.value ? (fechaTerminacion.value || null) : null

    const payload:any = {
      tipoContrato: tipoContratoSeleccionado.value,
      terminoContrato: terminoNormalizado,
      identificacion: (identificacion.value || '').trim(),
      sedeId: sedeId.value ? Number(sedeId.value) : null,
      cargoId: cargoId.value ? Number(cargoId.value) : null,
      funcionesCargo: (funcionesCargo.value || '').trim() || null,
      fechaInicio: fechaInicio.value || null,
      fechaTerminacion: fechaTerminacionNormalizada,
      centroCosto: (centroCosto.value || '').trim() || null,
      epsId: epsId.value ?? null, arlId: arlId.value ?? null, afpId: afpId.value ?? null, afcId: afcId.value ?? null, ccfId: ccfId.value ?? null,
      tieneRecomendacionesMedicas: !!tieneRecomendacionesMedicas.value,
      salarioBasico: salarioBasico.value !== '' ? Number(salarioBasico.value) : undefined,
      bonoSalarial: bonoSalarial.value !== '' ? Number(bonoSalarial.value) : undefined,
      auxilioTransporte: auxilioTransporte.value !== '' ? Number(auxilioTransporte.value) : undefined,
      auxilioNoSalarial: auxilioNoSalarial.value !== '' ? Number(auxilioNoSalarial.value) : undefined,
    }
    await actualizarContrato(Number(contratoEditId.value), payload)

    if (archivoContrato.value && razonSocialSeleccionada.value != null) {
      await anexarContrato({
        contratoId: Number(contratoEditId.value),
        archivo: archivoContrato.value,
        razonSocialId: Number(razonSocialSeleccionada.value),
        tieneRecomendacionesMedicas: false,
      } as any)
    }
    if (tieneRecomendacionesMedicas.value && archivoRecomendacionMedica.value) {
      await subirRecomendacionMedica(Number(contratoEditId.value), archivoRecomendacionMedica.value)
    }

    const refreshed = await obtenerContratoPorId(Number(contratoEditId.value))
    contratoEditArchivoUrl.value = refreshed?.rutaArchivoContratoFisico || contratoEditArchivoUrl.value
    contratoEditNombreArchivo.value = (contratoEditArchivoUrl.value?.split('/')?.pop() || contratoEditNombreArchivo.value || 'Contrato actual')

    try {
      const meta = await obtenerRecomendacionMedicaMeta(Number(contratoEditId.value))
      recMetaCache.value = { url: meta?.data?.url || null, nombre: meta?.data?.nombreOriginal || null }
    } catch {
      recMetaCache.value = {
        url: refreshed?.rutaArchivoRecomendacionMedica || recMetaCache.value?.url || null,
        nombre: (refreshed?.rutaArchivoRecomendacionMedica?.split('/')?.pop() || recMetaCache.value?.nombre || null),
      }
    }
    recUiTick.value++
    // 🔹 Asegura que el switch refleje lo que quedó en backend
    syncTieneRecFlagFromMeta(refreshed?.tieneRecomendacionesMedicas)

    notify('Contrato actualizado correctamente.', 'success')
    await resetParaSiguienteEnMismaRazon()
  } catch (e:any) {
    showAlert('Error', e?.message || 'No fue posible actualizar el contrato.')
  } finally { isSaving.value = false }
}
function cancelarEdicion() {
  isEditing.value = false
  contratoEditId.value = null
  limpiarFormulario()
}

/* ======= Modal de pasos ======= */
const modalPaso = ref({
  mostrar:false,
  paso: null as Paso | null,
  form: { observacion:'', archivo: null as File | null },
  loading: false,
})
function abrirModalPaso(paso: Paso, ev?: MouseEvent){
  ev?.stopPropagation()
  ev?.preventDefault()
  modalPaso.value.paso = paso
  modalPaso.value.form = { observacion: paso.observacion || '', archivo: null }
  nextTick(() => { modalPaso.value.mostrar = true })
}
function cerrarModalPaso(){
  modalPaso.value = { mostrar:false, paso:null, form:{ observacion:'', archivo:null }, loading:false }
}
function onFilePasoChange(){}
function verArchivoPaso() {
  const raw = modalPaso.value.paso?.archivoUrl
  if (!raw) return notify('No hay archivo para ver.', 'error')
  const url = toAbsoluteApiUrl(raw)
  window.open(url, '_blank', 'noopener')
}
const descargarArchivoPaso = verArchivoPaso
async function eliminarArchivoPaso() {
  const p = modalPaso.value.paso
  if (!isEditing.value || !contratoEditId.value || !p?.id) return

  try {
    const fd = new FormData()
    fd.append('clearArchivo', 'true')
    const resp = await fetch(`/api/contratos/${contratoEditId.value}/pasos/${p.id}`, {
      method: 'PUT',
      credentials: 'include',
      body: fd
    })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    await cargarPasosDesdeBackend(Number(contratoEditId.value))
    notify('Archivo eliminado.', 'success')
    if (modalPaso.value.paso) { modalPaso.value.paso.archivoUrl = undefined; modalPaso.value.paso.nombreArchivo = undefined }
  } catch (e:any) {
    notify(e?.message || 'No fue posible eliminar el archivo del paso.', 'error')
  }
}
async function completarPasoConfirmado() {
  const p = modalPaso.value.paso
  const obs = (modalPaso.value.form.observacion || '').trim()
  const file = modalPaso.value.form.archivo

  if (file) {
    const msg = validateFileOrMsg(file, { allowedExt: ALLOWED_PASO_EXT, maxMB: MAX_UPLOAD_MB })
    if (msg) { notify(msg, 'error'); return }
  }

  if (!isEditing.value) {
    if (p) {
      p.completado = true
      p.observacion = obs || p.observacion
      p.archivoFile = file || p.archivoFile
      p.fechaCompletado = new Date().toISOString()
    }
    cerrarModalPaso()
    notify('Paso preparado. Se enviará al crear el contrato.', 'success')
    return
  }

  if (!contratoEditId.value || !p) { notify('No hay contrato en edición.', 'error'); return }
  try {
    modalPaso.value.loading = true
    const fd = new FormData()
    if (typeof p.fase === 'string') fd.append('fase', p.fase)
    if (p.nombre) fd.append('nombrePaso', p.nombre)
    if (p.orden != null) fd.append('orden', String(p.orden))
    fd.append('completado', 'true')
    if (obs) fd.append('observacion', obs)
    fd.append('fecha', new Date().toISOString())
    if (file) fd.append('archivo', file, file.name)

    const method = p.id ? 'PUT' : 'POST'
    const url = p.id
      ? `/api/contratos/${contratoEditId.value}/pasos/${p.id}`
      : `/api/contratos/${contratoEditId.value}/pasos`

    const resp = await fetch(url, { method, credentials:'include', body: fd })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    await cargarPasosDesdeBackend(Number(contratoEditId.value))
    notify(p.id ? 'Paso actualizado.' : 'Paso creado.', 'success')
    cerrarModalPaso()
  } catch (e:any) {
    notify(e?.message || 'No fue posible guardar el paso.', 'error')
  } finally {
    modalPaso.value.loading = false
  }
}

/* ======= Clip de contrato (input principal) ======= */
function onFileChange(payload: any) {
  const f: File | null =
    Array.isArray(payload) ? (payload[0] || null)
      : (payload?.target?.files?.[0] ?? payload ?? null)
  if (!f) { archivoContrato.value = null; return }
  const msg = validateFileOrMsg(f, { allowedMime: ALLOWED_CONTRATO_MIME, maxMB: MAX_UPLOAD_MB })
  if (msg) {
    showAlert('Archivo de contrato inválido', msg)
    archivoContrato.value = null
    fileInputKey.value++ // reset input
    return
  }
  archivoContrato.value = f
}

/* ======= Cambiar estado contrato ======= */
async function toggleEstadoContrato(c: ContratoRow) {
  const nuevo = c.estado === 'activo' ? 'inactivo' : 'activo'
  try {
    await cambiarEstadoContrato(c.id, nuevo)
    notify(`Contrato ${nuevo}.`, 'success')
    await cargarHistorialContratos()
  } catch (e:any) {
    notify(e?.message || 'No fue posible cambiar el estado.', 'error')
  }
}

/* ======= Resets ======= */
async function resetTotal() {
  resetForm()
  resetPasos()
  archivoContrato.value = null
  archivoRecomendacionMedica.value = null
  fileInputKey.value++

  tipoContratoSeleccionado.value = 'prestacion'
  razonSocialSeleccionada.value = null
  usuarioSeleccionado.value = null
  contratosUsuario.value = []

  certStatusByTipo.value = { eps:false, arl:false, afp:false, afc:false, ccf:false }
  afiliacionMetaByTipo.value = { eps:null, arl:null, afp:null, afc:null, ccf:null }
  pendingCertsByTipo.value = { eps:null, arl:null, afp:null, afc:null, ccf:null }
  pendingEntidadIdByTipo.value = { eps:null, arl:null, afp:null, afc:null, ccf:null }
  certUiTick.value++

  contratoEditArchivoUrl.value = null
  contratoEditNombreArchivo.value = ''
  recMetaCache.value = null
  tieneRecomendacionesMedicas.value = false
  recUiTick.value++

  await nextTick()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
async function resetParaSiguienteEnMismaRazon({ keepTipo = true } = {}) {
  const keepRazon = razonSocialSeleccionada.value
  const keepTipoContrato = tipoContratoSeleccionado.value
  isEditing.value = false
  contratoEditId.value = null
  await resetTotal()
  razonSocialSeleccionada.value = keepRazon
  if (keepTipo) tipoContratoSeleccionado.value = keepTipoContrato
  if (keepRazon != null) await cargarUsuariosPorRazonSocial()
}
function limpiarFormulario() {
  resetForm()
  resetPasos()
  archivoContrato.value = null
  archivoRecomendacionMedica.value = null
  fileInputKey.value++
  tipoContratoSeleccionado.value = 'prestacion'
  pendingCertsByTipo.value = { eps:null, arl:null, afp:null, afc:null, ccf:null }
  pendingEntidadIdByTipo.value = { eps:null, arl:null, afp:null, afc:null, ccf:null }
  certStatusByTipo.value = { eps:false, arl:false, afp:false, afc:false, ccf:false }
  afiliacionMetaByTipo.value = { eps:null, arl:null, afp:null, afc:null, ccf:null }
  certUiTick.value++
  recMetaCache.value = null
  tieneRecomendacionesMedicas.value = false
  recUiTick.value++
}

/* ======= Watchers ======= */
watch([salarioBasico, bonoSalarial, auxilioTransporte, auxilioNoSalarial], () => {
  salarioBasico.value = sanitizeMoney(salarioBasico.value)
  bonoSalarial.value = sanitizeMoney(bonoSalarial.value)
  auxilioTransporte.value = sanitizeMoney(auxilioTransporte.value)
  auxilioNoSalarial.value = sanitizeMoney(auxilioNoSalarial.value)
})
watch(razonSocialSeleccionada, (v)=>{ if (v) cargarUsuariosPorRazonSocial() })
watch(usuarioSeleccionado, async (v)=>{
  certStatusByTipo.value = { eps:false, arl:false, afp:false, afc:false, ccf:false }
  afiliacionMetaByTipo.value = { eps:null, arl:null, afp:null, afc:null, ccf:null }
  pendingCertsByTipo.value = { eps:null, arl:null, afp:null, afc:null, ccf:null }
  pendingEntidadIdByTipo.value = { eps:null, arl:null, afp:null, afc:null, ccf:null }
  certUiTick.value++
  contratosUsuario.value = []
  isEditing.value = false
  contratoEditId.value = null
  contratoEditArchivoUrl.value = null
  contratoEditNombreArchivo.value = ''
  recMetaCache.value = null
  tieneRecomendacionesMedicas.value = false
  recUiTick.value++
  pasosBackend.value = null
  if (!v) return
  await cargarHistorialContratos()
})
/* Si el tipo cambia y el valor actual no está disponible, lo limpiamos */
watch(tipoContratoSeleccionado, () => {
  const allowed = terminosContratoOptions.value.map(o => o.value)
  if (!allowed.includes(terminoContrato.value as any)) terminoContrato.value = null
})

/* ======= Mounted ======= */
onMounted(() => {
  cargarRazonesSociales()
  cargarSedes()
  cargarCargos()
  cargarEntidadesSalud()
})

/* Exponer helpers usados en el template */
defineExpose({ toAbsoluteApiUrl })
</script>
<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.append-icons {
  display: flex;
  align-items: center;
}

.v-table {
  width: 100%;
  border-collapse: collapse;
}

.v-table th,
.v-table td {
  padding: 8px;
  border-bottom: 1px solid #e0e0e0;
}

.v-table th {
  font-weight: bold;
  background-color: #f5f5f5;
}

.v-table tbody tr:hover {
  background-color: #fafafa;
}
</style>
