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
      <v-card-title
        class="text-h6 font-weight-bold bg-blue-grey-lighten-5 d-flex align-center titulo-editar-contrato"
      >
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

            <!-- Término -->
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
                      <template #activator="{ props }">
                        <v-icon v-bind="props" size="18" color="success" class="ml-1">mdi-check-circle</v-icon>
                      </template>
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
                      <template #activator="{ props }">
                        <v-icon v-bind="props" size="18" color="success" class="ml-1">mdi-check-circle</v-icon>
                      </template>
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
                      <template #activator="{ props }">
                        <v-icon v-bind="props" size="18" color="success" class="ml-1">mdi-check-circle</v-icon>
                      </template>
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
                      <template #activator="{ props }">
                        <v-icon v-bind="props" size="18" color="success" class="ml-1">mdi-check-circle</v-icon>
                      </template>
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
                      <template #activator="{ props }">
                        <v-icon v-bind="props" size="18" color="success" class="ml-1">mdi-check-circle</v-icon>
                      </template>
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

          <!-- Anexar/Reemplazar contrato -->
          <v-col :key="fileBlockKey" cols="12" md="6">
            <h4 class="text-h6 mb-2">
              {{ isEditing ? 'Reemplazar Archivo de Contrato (opcional)' : 'Anexar Contrato' }}
            </h4>

            <!-- ⚠️ Aviso cuando hay contrato ya creado pero faltó anexar -->
            <v-alert
              v-if="!isEditing && contratoPendienteAnexoId"
              type="warning"
              variant="tonal"
              class="mb-3"
            >
              Se creó el contrato #{{ contratoPendienteAnexoId }}, pero falló el anexado del PDF.
              Puedes reintentar con el botón de abajo o volviendo a presionar “Reintentar anexar”.
            </v-alert>

            <v-card class="pa-4">
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

              <v-file-input
                :key="fileInputRenderKey"
                label="Subir archivo del contrato físico"
                variant="outlined"
                density="compact"
                show-size
                accept="application/pdf"
                prepend-icon="mdi-file-upload"
                class="mb-1"
                @update:model-value="onFileChange"
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

        <!-- 🔘 Acciones (corregido: flujo creación vs edición) -->
        <v-card-actions class="d-flex justify-end pr-4 pb-4 mt-4">
          <!-- MODO EDICIÓN -->
          <template v-if="isEditing">
            <v-btn
              color="grey-darken-1"
              variant="text"
              class="mr-2"
              @click="cancelarEdicion"
            >
              Cancelar edición
            </v-btn>

            <v-btn
              color="warning"
              prepend-icon="mdi-content-save"
              :disabled="!usuarioSeleccionado || isSaving"
              :loading="isSaving"
              @click="guardarCambiosContrato"
            >
              Guardar cambios
            </v-btn>
          </template>

          <!-- MODO CREACIÓN -->
          <template v-else>
            <v-btn
              color="success"
              :prepend-icon="contratoPendienteAnexoId ? 'mdi-reload' : 'mdi-content-save-check'"
              :disabled="!usuarioSeleccionado || !archivoContrato || isSaving"
              :loading="isSaving"
              @click="handleConfirmacion"
            >
              {{ contratoPendienteAnexoId ? 'Reintentar anexar' : 'Crear y Anexar Contrato' }}
            </v-btn>

            <v-btn
              v-if="contratoPendienteAnexoId"
              color="primary"
              prepend-icon="mdi-paperclip"
              variant="tonal"
              class="ml-2"
              :disabled="isSaving || !archivoContrato"
              :loading="isSaving"
              @click="reanexarArchivoContrato"
            >
              Reintentar anexar ahora
            </v-btn>
          </template>
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
  <tr v-for="(c, i) in contratosUsuario" :key="c.id">
    <td>{{ i + 1 }}</td> <!-- ← consecutivo visual -->
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
            <v-alert v-if="certTieneArchivoPersistido" type="success" variant="tonal" class="mb-3">
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

            <div v-if="!certTieneArchivoPersistido && certDialog.file" class="text-caption text-medium-emphasis mb-1">
              Archivo seleccionado: <strong>{{ certDialog.file.name }}</strong> — listo para <em>Subir</em>.
            </div>

            <div class="text-caption text-medium-emphasis">Permitidos: PDF, JPG, PNG, WEBP (máx {{ MAX_UPLOAD_MB }} MB)</div>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" color="grey-darken-1" @click="cerrarCertDialog">Cerrar</v-btn>

          <v-btn v-if="certTieneArchivoPersistido" variant="tonal" prepend-icon="mdi-download" @click="descargarCertificadoSeleccionado">Descargar</v-btn>
          <v-btn v-if="certTieneArchivoPersistido" variant="tonal" color="error" prepend-icon="mdi-delete" @click="eliminarCertificadoSeleccionado">Eliminar</v-btn>

          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-upload"
            :disabled="!certDialog.file || certDialog.loading"
            @click="subirCertificadoSeleccionado"
          >
            {{ certTieneArchivoPersistido ? 'Reemplazar' : 'Subir' }}
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
            <div v-if="!recTieneArchivo && recDialog.file" class="text-caption text-medium-emphasis mb-1">
              Archivo seleccionado: <strong>{{ recDialog.file.name }}</strong> — listo para <em>Subir</em>.
            </div>
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

/* =========================================================
 * Helpers de tipado y normalización
 * ========================================================= */
type Dict = Record<string, unknown>
function isRecord(x: unknown): x is Dict { return typeof x === 'object' && x !== null }
function toArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (isRecord(data)) {
    const d = data['data']; const r = data['rows']; const i = data['items']
    if (Array.isArray(d)) return d as T[]
    if (Array.isArray(r)) return r as T[]
    if (Array.isArray(i)) return i as T[]
  }
  return []
}

/* ======= Constantes / utils ======= */
const MAX_UPLOAD_MB = 10
const BYTES_MB = 1024 * 1024
const ALLOWED_CONTRATO_MIME = ['application/pdf'] as const
const ALLOWED_REC_EXT = ['pdf', 'doc', 'docx'] as const
const ALLOWED_CERT_EXT = ['pdf', 'jpg', 'jpeg', 'png', 'webp'] as const
const ALLOWED_PASO_EXT = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'] as const
const MAX_MONEY = 2_000_000_000

const isSaving = ref(false)

/* =====================================================================
 * URL ABSOLUTA HACIA LA API
 * ===================================================================== */
const API_ORIGIN = (() => {
  const raw =
    import.meta.env.VITE_API_BASE_URL ??
    import.meta.env.VITE_API_URL ??
    'http://localhost:3333'
  try { return new URL(String(raw)).origin } catch { return String(raw).replace(/\/+$/, '') }
})()

function toAbsoluteApiUrl(input?: string | null): string {
  if (!input) return ''
  const raw = String(input).trim()

  // Si ya es absoluta, NO la toques
  if (/^https?:\/\//i.test(raw)) return raw

  // Si es relativa, complétala contra el BACKEND (API_ORIGIN)
  const base = API_ORIGIN.replace(/\/+$/, '')
  const rel = raw.startsWith('/') ? raw : `/${raw}`
  return `${base}${rel}`
}

function extOf(name?: string) {
  if (!name) return ''
  const p = name.split('.')
  return (p[p.length - 1] || '').toLowerCase()
}

function validateFileOrMsg(
  file: File | null,
  opts: { allowedMime?: readonly string[], allowedExt?: readonly string[], maxMB?: number }
): string | null {
  if (!file) return 'Archivo requerido.'
  if (opts.maxMB && file.size > (opts.maxMB * BYTES_MB)) return `El archivo supera ${opts.maxMB} MB.`
  if (opts.allowedMime && !opts.allowedMime.includes(file.type)) return `Tipo no permitido (${file.type || 'desconocido'}).`
  if (opts.allowedExt && !opts.allowedExt.includes(extOf(file.name))) return `Extensión no permitida (.${extOf(file.name)}).`
  return null
}


/* ======= Money typing ======= */
type MoneyInput = number | ''

function sanitizeMoney(v: unknown): MoneyInput {
  if (v === null || v === undefined || v === '') return ''
  const n = Number(String(v).replace(/[^\d.-]/g, ''))
  if (Number.isNaN(n)) return ''
  return Math.min(n, MAX_MONEY)
}

/* ======= Selects / tipos ======= */
const tiposContratoSelectItems = ref([
  { nombre: 'Prestación de Servicios', valor: 'prestacion' as const },
  { nombre: 'Temporal', valor: 'temporal' as const },
  { nombre: 'Laboral', valor: 'laboral' as const },
  { nombre: 'Contrato de Aprendizaje', valor: 'aprendizaje' as const },
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

interface SedeLite { id: number; nombre: string }
interface CargoLite { id: number; nombre: string }
interface EntidadSalud { id: number; nombre: string; tipo: AfiliacionTipo | string }
interface UsuarioLiteOpt { id: number; nombres: string; apellidos: string; nombreCompleto?: string }
interface ContratoRow {
  id: number
  tipoContrato: 'prestacion' | 'temporal' | 'laboral' | 'aprendizaje' | string
  terminoContrato: 'fijo' | 'obra_o_labor_determinada' | 'indefinido' | string | null
  estado: 'activo' | 'inactivo'
  fechaInicio: string
  fechaTerminacion: string | null
  sede?: SedeLite | null
  cargo?: CargoLite | null
  rutaArchivoContratoFisico?: string | null
  rutaArchivoRecomendacionMedica?: string | null
  salarios?: Array<{ salarioBasico:number; bonoSalarial:number; auxilioTransporte:number; auxilioNoSalarial:number }>
  salarioBasico?: number
  bonoSalarial?: number
  auxilioTransporte?: number
  auxilioNoSalarial?: number
  epsId?: number | null; arlId?: number | null; afpId?: number | null; afcId?: number | null; ccfId?: number | null
}

/** Payload mínimo esperado por crearContrato (ajusta a tu backend si hace falta) */
interface CrearContratoPayload {
  usuarioId: number
  razonSocialId: number
  identificacion: string
  sedeId: number | null
  cargoId: number | null
  funcionesCargo: string | null
  fechaInicio: string | null
  fechaTerminacion: string | null
  tipoContrato: 'prestacion' | 'temporal' | 'laboral' | 'aprendizaje'
  terminoContrato: 'fijo' | 'obra_o_labor_determinada' | 'indefinido' | null
  estado: 'activo' | 'inactivo'
  centroCosto: string | null
  epsId: number | null
  arlId: number | null
  afpId: number | null
  afcId: number | null
  ccfId: number | null
  tieneRecomendacionesMedicas: boolean
  salarioBasico: number
  bonoSalarial: number
  auxilioTransporte: number
  auxilioNoSalarial: number
}

/** Respuesta mínima de crearContrato */
interface CrearContratoResponse extends ContratoRow { id: number; salarios?: ContratoRow['salarios'] }

/** Payload para anexarContrato */
interface AnexarContratoPayload {
  contratoId: number
  archivo: File
  razonSocialId: number
  tieneRecomendacionesMedicas?: boolean
  archivoRecomendacionMedica?: File
}

/* ======= Estado base ======= */
const razonSocialSeleccionada = ref<number | null>(null)
const usuarioSeleccionado = ref<number | null>(null)
const tipoContratoSeleccionado = ref<'prestacion' | 'temporal' | 'laboral' | 'aprendizaje'>('prestacion')

const razonesSociales = ref<Array<{ id:number; nombre:string }>>([])
const usuarios = ref<UsuarioLiteOpt[]>([])
const sedes = ref<SedeLite[]>([])
const cargos = ref<CargoLite[]>([])
const entidadesSalud = ref<EntidadSalud[]>([])

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

/** 🔑 Claves para forzar re-render */
const fileBlockKey = ref(0)
const fileInputRenderKey = ref(0)
const fileInputRef = ref<{ reset?: () => void } | null>(null)

const identificacionRef = ref<HTMLInputElement | null>(null)

const tieneRecomendacionesMedicas = ref(false)
const archivoRecomendacionMedica = ref<File | null>(null)

/* ======= Afiliaciones (por contrato) ======= */
const certStatusByTipo = ref<Record<AfiliacionTipo, boolean>>({
  eps:false, arl:false, afp:false, afc:false, ccf:false
})
const afiliacionMetaByTipo = ref<Record<AfiliacionTipo, unknown | null>>({
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
function setCertState(tipo: AfiliacionTipo, has:boolean, meta: unknown | null) {
  certStatusByTipo.value = { ...certStatusByTipo.value, [tipo]: !!has }
  afiliacionMetaByTipo.value = { ...afiliacionMetaByTipo.value, [tipo]: meta }
  certUiTick.value++
}
function hasCert(tipo: AfiliacionTipo) {
  const meta = afiliacionMetaByTipo.value[tipo] as Dict | null
  return !!(certStatusByTipo.value[tipo] ||
            (meta && (meta?.data as Dict | undefined)?.['url']) ||
            (meta && (meta?.data as Dict | undefined)?.['nombreOriginal']) ||
            (meta && meta['url']))
}
function hasCertUI(tipo: AfiliacionTipo) {
  return isEditing.value ? hasCert(tipo) : !!pendingCertsByTipo.value[tipo]
}
function tieneArchivoAfiliacion(meta: unknown) {
  try {
    const m = meta as Dict
    const d = (m?.data ?? {}) as Dict
    return !!(d['url'] || d['nombreOriginal'] || m['url'] || m['nombreOriginal'])
  } catch { return false }
}
function getArchivoNombre(meta: unknown) {
  const t = certDialog.value.tipo as AfiliacionTipo
  const pending = t ? pendingCertsByTipo.value[t] : null
  const m = meta as Dict | null
  const d = (m?.data ?? {}) as Dict
  return (d['nombreOriginal'] as string | undefined)
      || (d['filename'] as string | undefined)
      || (d['name'] as string | undefined)
      || (m?.['nombreOriginal'] as string | undefined)
      || (pending?.name ?? '')
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
function syncTieneRecFlagFromMeta(extraFlag?: unknown) {
  const hasMeta = !!(recMetaCache.value?.url || recMetaCache.value?.nombre)
  const hasPending = !!archivoRecomendacionMedica.value
  tieneRecomendacionesMedicas.value = Boolean(extraFlag || hasMeta || hasPending)
}

/* ======= Validaciones ======= */
const { handleSubmit, resetForm, validate } = useForm()
const required = (v: unknown) => (v !== null && v !== undefined && v !== '') || 'Este campo es obligatorio.'
const onlyDigits = (v: unknown) =>
  (v === '' || v === null || v === undefined || /^\d+$/.test(String(v))) ||
  'Solo se permiten números.'

/** Opciones del término por tipo de contrato */
const terminosContratoOptions = computed(() => {
  const t = tipoContratoSeleccionado.value
  if (t === 'laboral') {
    return [
      { text: 'Fijo', value: 'fijo' },
      { text: 'Obra o labor determinada', value: 'obra_o_labor_determinada' },
      { text: 'Indefinido', value: 'indefinido' },
    ] as const
  }
  if (t === 'temporal') {
    return [{ text:'Obra o labor determinada', value:'obra_o_labor_determinada' }] as const
  }
  if (t === 'prestacion') {
    return [
      { text: 'Fijo', value: 'fijo' },
      { text: 'Obra o labor determinada', value: 'obra_o_labor_determinada' },
    ] as const
  }
  // aprendizaje
  return [{ text:'Fijo', value:'fijo' }] as const
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
  useField<string>(
    'identificacion',
    [
      required,
      onlyDigits,
      (val: string) =>
        (val?.trim()?.length ?? 0) >= 5 || 'Debe tener al menos 5 caracteres.'
    ],
    { initialValue: '' }
  )

const { value: sedeId, errorMessage: sedeIdError } = useField<number | null>('sedeId', [required], { initialValue: null })
const { value: cargoId, errorMessage: cargoIdError } = useField<number | null>('cargoId', [required], { initialValue: null })
const { value: funcionesCargo, errorMessage: funcionesCargoError } = useField<string>('funcionesCargo', [required], { initialValue: '' })

const { value: fechaInicio, errorMessage: fechaInicioError } = useField<string>('fechaInicio', [required], { initialValue: '' })
const { value: fechaTerminacion, errorMessage: fechaTerminacionError } = useField<string>('fechaTerminacion', fechaTerminacionRules, { initialValue: '' })
const { value: terminoContrato, errorMessage: terminoContratoError } = useField<'fijo' | 'obra_o_labor_determinada' | 'indefinido' | null>('terminoContrato', terminoContratoRules, { initialValue: null })

// Afiliaciones obligatorias (AFC opcional)
const { value: epsId, errorMessage: epsIdError } = useField<number | null>('epsId', [required], { initialValue: null })
const { value: arlId, errorMessage: arlIdError } = useField<number | null>('arlId', [required], { initialValue: null })
const { value: afpId, errorMessage: afpIdError } = useField<number | null>('afpId', [required], { initialValue: null })
const { value: afcId } = useField<number | null>('afcId', [], { initialValue: null })
const { value: ccfId, errorMessage: ccfIdError } = useField<number | null>('ccfId', [required], { initialValue: null })

/* Dinero */
const moneyRules = [
  (v: MoneyInput) => (v === '' || Number(v) >= 0) || 'No puede ser negativo.',
  (v: MoneyInput) => (v === '' || Number(v) <= MAX_MONEY) || `No puede superar ${MAX_MONEY.toLocaleString('es-CO')}.`,
]
const requiredMoney = (v: MoneyInput) => (v !== '') || 'Requerido.'

const { value: salarioBasico, errorMessage: salarioBasicoError } =
  useField<MoneyInput>('salarioBasico', [requiredMoney, ...moneyRules], { initialValue: '' })

const { value: bonoSalarial } =
  useField<MoneyInput>('bonoSalarial', moneyRules, { initialValue: '' })

const { value: auxilioTransporte } =
  useField<MoneyInput>('auxilioTransporte', moneyRules, { initialValue: '' })

const { value: auxilioNoSalarial } =
  useField<MoneyInput>('auxilioNoSalarial', moneyRules, { initialValue: '' })

const { value: centroCosto } = useField<string>('centroCosto', [], { initialValue: '' })

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
const filteredEps = computed(() => entidadesSalud.value.filter((e) => e.tipo === 'eps'))
const filteredArl = computed(() => entidadesSalud.value.filter((e) => e.tipo === 'arl'))
const filteredAfp = computed(() => entidadesSalud.value.filter((e) => e.tipo === 'afp'))
const filteredAfc = computed(() => entidadesSalud.value.filter((e) => e.tipo === 'afc'))
const filteredCcf = computed(() => entidadesSalud.value.filter((e) => e.tipo === 'ccf'))

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
function mapPasoAPItoUI(raw: Dict): Paso {
  return {
    id: raw.id as number | undefined,
    nombre: (raw['nombrePaso'] as string) ?? (raw['nombre_paso'] as string) ?? '',
    fase: (raw['fase'] as Paso['fase']) || 'inicio',
    orden: (raw['orden'] as number | undefined),
    completado: Boolean(raw['completado']),
    observacion: (raw['observacion'] as string | undefined),
    fechaCompletado: (raw['fecha'] as string | undefined),
    archivoUrl: (raw['archivoUrl'] as string | undefined) ?? (raw['archivo_url'] as string | undefined),
    nombreArchivo: filenameFromUrl((raw['archivoUrl'] as string | undefined) ?? (raw['archivo_url'] as string | undefined)),
    archivoFile: null,
  }
}
async function cargarPasosDesdeBackend(contratoId: number) {
  loadingPasos.value = true
  try {
    const list = await fetchPasosContratoAPI(contratoId)
    const arr = toArray<Dict>(list).map(mapPasoAPItoUI)
    pasosBackend.value = arr
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
const notify = (text:string, color:'success'|'error'|'warning'|'info'='success') => { snackbar.value = { show:true, text, color, timeout:1800 } }

/* ======= Certificados (por contrato) ======= */
const certDialog = ref({
  open:false,
  tipo: '' as AfiliacionTipo | '',
  entidadId: null as number | null,
  entidadNombre: '',
  file: null as File | null,
  loading: false,
  meta: null as unknown
})
const certTieneArchivoPersistido = computed(() => {
  const t = certDialog.value.tipo as AfiliacionTipo
  if (!t) return false
  if (isEditing.value) {
    const meta = (certDialog.value.meta ?? afiliacionMetaByTipo.value[t])
    return tieneArchivoAfiliacion(meta as unknown)
  }
  return !!pendingCertsByTipo.value[t]
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

  const ent = entidadesSalud.value.find((e) => e.id === id)
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
      setCertState(tipo, tieneArchivoAfiliacion(meta as unknown), meta as unknown)
      certDialog.value.meta = meta as unknown
    } catch {
      setCertState(tipo, false, null)
    } finally {
      certDialog.value.loading = false
    }
  } else {
    const f = pendingCertsByTipo.value[tipo]
    certDialog.value.meta = f ? { data: { nombreOriginal: f.name } } : null
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
    certDialog.value.meta = { data: { nombreOriginal: certDialog.value.file.name } }
    certDialog.value.file = null
    certUiTick.value++
    notify('Archivo preparado. Se subirá al guardar el contrato.', 'success')
    return
  }

  if (!contratoEditId.value) return
  certDialog.value.loading = true
  try {
    await (subirArchivoAfiliacion as unknown as (a:number, b:AfiliacionTipo, c:File, d:number)=>Promise<unknown>)(Number(contratoEditId.value), t, certDialog.value.file, entidadId)
    const meta = await obtenerArchivoAfiliacionMeta(Number(contratoEditId.value), t)
    setCertState(t, true, meta as unknown)
    certDialog.value.meta = meta as unknown
    certDialog.value.file = null
    notify('Archivo de afiliación guardado con éxito', 'success')
  } catch (e) {
    notify((e as Error)?.message || 'No fue posible subir el archivo.', 'error')
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
    certDialog.value.meta = null
    certDialog.value.file = null
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
  } catch (e) {
    notify((e as Error)?.message || 'No fue posible eliminar el archivo.', 'error')
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
  const meta = (certDialog.value.meta ?? (t ? afiliacionMetaByTipo.value[t] : null)) as Dict | null
  const urlRaw = (meta?.data as Dict | undefined)?.['url'] || meta?.['url']
  if (!urlRaw) return notify('No hay archivo para ver.', 'error')
  const url = toAbsoluteApiUrl(String(urlRaw))
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
    const d = (meta as Dict | null)?.['data'] as Dict | undefined
    recMetaCache.value = { url: (d?.['url'] as string | null) || null, nombre: (d?.['nombreOriginal'] as string | null) || null }
    recUiTick.value++
    syncTieneRecFlagFromMeta(true)
    notify('Recomendación médica actualizada.', 'success')
    cerrarRecDialog()
  } catch (e) {
    notify((e as Error)?.message || 'No fue posible subir la recomendación.', 'error')
  } finally {
    recDialog.value.loading = false
  }
}
async function eliminarRecomendacionSeleccionada() {
  if (!isEditing.value) {
    archivoRecomendacionMedica.value = null
    recUiTick.value++
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
  } catch (e) {
    notify((e as Error)?.message || 'No fue posible eliminar la recomendación.', 'error')
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
  if (viejo && !nuevo) {
    if (isEditing.value && recMetaCache.value?.url) {
      dialogEliminarRec.value = true
      tieneRecomendacionesMedicas.value = true
      return
    }
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
  } catch (e) {
    showAlert('Error', (e as Error)?.message || 'No se pudo eliminar la recomendación médica')
  } finally {
    dialogEliminarRec.value = false
  }
}

/* ======= Carga de datos (normalizada a arrays) ======= */
const contratosUsuario = ref<ContratoRow[]>([])
const loadingContratos = ref(false)
async function cargarHistorialContratos() {
  if (!usuarioSeleccionado.value) { contratosUsuario.value = []; return }
  loadingContratos.value = true
  try {
    const raw = await obtenerContratosPorUsuario(Number(usuarioSeleccionado.value))
    contratosUsuario.value = toArray<ContratoRow>(raw)
  } catch { contratosUsuario.value = [] }
  finally { loadingContratos.value = false }
}
async function cargarRazonesSociales(){
  loadingRazonesSociales.value = true
  try {
    const raw = await listarRazonesSociales()
    razonesSociales.value = toArray<{ id:number; nombre:string }>(raw)
  } finally { loadingRazonesSociales.value = false }
}
async function cargarUsuariosPorRazonSocial(){
  loadingUsuarios.value = true
  usuarios.value = []
  usuarioSeleccionado.value = null
  if (razonSocialSeleccionada.value) {
    try {
      const raw = await fetchUsuariosPorRazonSocial(razonSocialSeleccionada.value)
      const arr = toArray<UsuarioLiteOpt>(raw)
      usuarios.value = arr.map(u => ({ ...u, nombreCompleto:`${u.nombres} ${u.apellidos}`.trim() }))
    } finally { loadingUsuarios.value = false }
  } else loadingUsuarios.value = false
}
async function cargarSedes(){
  loadingSedes.value = true
  try {
    const raw = await obtenerSedes()
    sedes.value = toArray<SedeLite>(raw)
  } finally { loadingSedes.value = false }
}
async function cargarCargos(){
  loadingCargos.value = true
  try {
    const raw = await obtenerCargos()
    cargos.value = toArray<CargoLite>(raw)
  } finally { loadingCargos.value = false }
}
async function cargarEntidadesSalud(){
  loadingEntidades.value = true
  try {
    const raw = await obtenerEntidadesSalud()
    entidadesSalud.value = toArray<EntidadSalud>(raw)
  } finally { loadingEntidades.value = false }
}

/* ============
 * Estado de reintento de anexado
 * ============ */
const contratoPendienteAnexoId = ref<number | null>(null)

/* ======= Crear contrato ======= */
const submitForm = handleSubmit(async (values) => { await crearYAnexarContrato(values) })

async function handleConfirmacion() {
  if (isSaving.value) return

  // Si hay contrato creado pero faltó anexar, reintentar anexar directamente
  if (contratoPendienteAnexoId.value) {
    await reanexarArchivoContrato()
    return
  }

  const { valid } = await validate()
  if (!valid) return showAlert('Error de Validación', 'Revisa los campos en rojo.')

  const tipo = tipoContratoSeleccionado.value
  const termino = terminoContrato.value

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

  if (isFechaTerminacionRequired.value && !fechaTerminacion.value) {
    return showAlert('Advertencia', 'La fecha de terminación es obligatoria para este tipo de contrato.')
  }

  const contratoMsg = validateFileOrMsg(archivoContrato.value, { allowedMime: ALLOWED_CONTRATO_MIME, maxMB: MAX_UPLOAD_MB })
  if (contratoMsg) return showAlert('Archivo de contrato inválido', contratoMsg)

  if (tieneRecomendacionesMedicas.value && archivoRecomendacionMedica.value) {
    const recMsg = validateFileOrMsg(archivoRecomendacionMedica.value, { allowedExt: ALLOWED_REC_EXT, maxMB: MAX_UPLOAD_MB })
    if (recMsg) return showAlert('Archivo de recomendación inválido', recMsg)
  }

  await submitForm()
}

async function crearYAnexarContrato(formData: Record<string, unknown>) {
  if (isSaving.value) return
  isSaving.value = true
  try {
    if (!usuarioSeleccionado.value || !archivoContrato.value || !razonSocialSeleccionada.value) {
      showAlert('Error', 'Falta información clave.'); return
    }

    const terminoNormalizado = (() => {
      const tipo = tipoContratoSeleccionado.value
      const valor = terminoContrato.value
      if (tipo === 'temporal') return 'obra_o_labor_determinada' as const
      if (tipo === 'aprendizaje') return 'fijo' as const
      return (valor || null) as CrearContratoPayload['terminoContrato']
    })()

    const fechaTerminacionNormalizada =
      isFechaTerminacionRequired.value ? (formData['fechaTerminacion'] as string | null) || null : null

    const payloadContrato: CrearContratoPayload = {
      usuarioId: Number(usuarioSeleccionado.value),
      razonSocialId: Number(razonSocialSeleccionada.value),
      identificacion: String(identificacion.value || '').trim(),
      sedeId: sedeId.value ? Number(sedeId.value) : null,
      cargoId: cargoId.value ? Number(cargoId.value) : null,
      funcionesCargo: String(funcionesCargo.value || '').trim() || null,
      fechaInicio: (formData['fechaInicio'] as string) || null,
      fechaTerminacion: fechaTerminacionNormalizada,
      tipoContrato: tipoContratoSeleccionado.value,
      terminoContrato: terminoNormalizado,
      estado: 'activo',
      centroCosto: String(centroCosto.value || '').trim() || null,
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

    const nuevoContrato = await crearContrato(payloadContrato) as CrearContratoResponse
    const nc = nuevoContrato

    // Salario (si backend no lo devuelve ya persistido)
    const salarioViene = Array.isArray(nc.salarios) && nc.salarios.length > 0
    if (!salarioViene) {
      await crearContratoSalario({
        contratoId: Number(nc.id),
        salarioBasico: Number(salarioBasico.value) || 0,
        bonoSalarial: Number(bonoSalarial.value) || 0,
        auxilioTransporte: Number(auxilioTransporte.value) || 0,
        auxilioNoSalarial: Number(auxilioNoSalarial.value) || 0,
        fechaEfectiva: `${(formData['fechaInicio'] as string) || new Date().toISOString().slice(0,10)}T00:00:00`,
      })
    }

    // Anexar PDF principal (y recomendación si aplica)
    try {
      const anexarPayload: AnexarContratoPayload = {
        contratoId: Number(nc.id),
        archivo: archivoContrato.value!,
        razonSocialId: Number(razonSocialSeleccionada.value),
        tieneRecomendacionesMedicas: !!tieneRecomendacionesMedicas.value && !!archivoRecomendacionMedica.value,
        archivoRecomendacionMedica: archivoRecomendacionMedica.value || undefined,
      }
      await anexarContrato(anexarPayload)
    } catch (e) {
      // Creación fue OK pero el anexado falló → guardamos el ID para reintento
      contratoPendienteAnexoId.value = Number(nc.id)
      notify('El contrato se creó, pero falló el anexado del PDF. Puedes reintentar.', 'warning')
      await cargarHistorialContratos()
      // No reseteamos formulario para permitir reintento inmediato
      return
    }

    // Subir afiliaciones pendientes (solo si hay)
    try {
      const tipos: AfiliacionTipo[] = ['eps','arl','afp','afc','ccf']
      const uploads: Promise<unknown>[] = []
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
        uploads.push((subirArchivoAfiliacion as unknown as (a:number, b:AfiliacionTipo, c:File, d:number)=>Promise<unknown>)(Number(nc.id), t, file, entidadFinal))
      }
      if (uploads.length) await Promise.all(uploads)
    } catch (e) {
      notify((e as Error)?.message || 'Algunas afiliaciones no pudieron subirse.', 'error')
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
        return crearPasoContrato(Number(nc.id), fd)
      })
      await Promise.all(creates)
    } catch {}

    notify('Contrato creado y archivos anexados.', 'success')
    await resetParaSiguienteEnMismaRazon()
  } catch (e) {
    showAlert('Error', (e as Error)?.message || 'No fue posible crear el contrato.')
  } finally { isSaving.value = false }
}

/** Reintenta anexar el PDF principal cuando crearContrato ya fue exitoso */
async function reanexarArchivoContrato() {
  if (isSaving.value) return
  if (!contratoPendienteAnexoId.value) return
  if (!archivoContrato.value || !razonSocialSeleccionada.value) {
    showAlert('Faltan datos', 'Selecciona un archivo PDF y asegúrate de tener la razón social.')
    return
  }
  const msg = validateFileOrMsg(archivoContrato.value, { allowedMime: ALLOWED_CONTRATO_MIME, maxMB: MAX_UPLOAD_MB })
  if (msg) { showAlert('Archivo inválido', msg); return }

  isSaving.value = true
  try {
    const anexarPayload: AnexarContratoPayload = {
      contratoId: Number(contratoPendienteAnexoId.value),
      archivo: archivoContrato.value,
      razonSocialId: Number(razonSocialSeleccionada.value),
      tieneRecomendacionesMedicas: !!tieneRecomendacionesMedicas.value && !!archivoRecomendacionMedica.value,
      archivoRecomendacionMedica: archivoRecomendacionMedica.value || undefined,
    }
    await anexarContrato(anexarPayload)
    notify('Archivo anexado correctamente al contrato previamente creado.', 'success')
    contratoPendienteAnexoId.value = null
    await cargarHistorialContratos()
    await resetParaSiguienteEnMismaRazon()
  } catch (e) {
    notify((e as Error)?.message || 'Sigue fallando el anexado. Revisa la API o el archivo.', 'error')
  } finally {
    isSaving.value = false
  }
}

/* ======= Edición ======= */
const contratoEditArchivoUrl = ref<string | null>(null)
const contratoEditNombreArchivo = ref<string>('')
const contratoEditTieneArchivo = computed(() => !!contratoEditArchivoUrl.value)

async function editarContrato(c: ContratoRow) {
  isEditing.value = true
  contratoEditId.value = c.id
  let src: Partial<ContratoRow & Dict> = c
  try { src = await obtenerContratoPorId(c.id) as Partial<ContratoRow & Dict> } catch {}

  tipoContratoSeleccionado.value = (src['tipoContrato'] as ContratoRow['tipoContrato']) ?? c.tipoContrato
  identificacion.value = (src['identificacion'] as string) ?? ''
  sedeId.value = (src['sede'] as SedeLite | undefined)?.id ?? (src['sedeId'] as number | null) ?? null
  cargoId.value = (src['cargo'] as CargoLite | undefined)?.id ?? (src['cargoId'] as number | null) ?? null
  funcionesCargo.value = (src['funcionesCargo'] as string) ?? ''
  fechaInicio.value = (String(src['fechaInicio'] || '')).slice(0,10)
  fechaTerminacion.value = src['fechaTerminacion'] ? String(src['fechaTerminacion']).slice(0,10) : ''
  terminoContrato.value = (src['terminoContrato'] as typeof terminoContrato.value) ?? null
  centroCosto.value = (src['centroCosto'] as string) ?? ''

  epsId.value = (src['epsId'] as number | null) ?? null
  arlId.value = (src['arlId'] as number | null) ?? null
  afpId.value = (src['afpId'] as number | null) ?? null
  afcId.value = (src['afcId'] as number | null) ?? null
  ccfId.value = (src['ccfId'] as number | null) ?? null

  const salarios = (Array.isArray(src['salarios']) ? src['salarios'] as Array<{ salarioBasico?:number; bonoSalarial?:number; auxilioTransporte?:number; auxilioNoSalarial?:number }> : [])
  // ⚙️ Money fields (typed as number | '')
  const sb = (src['salarioBasico'] as number | undefined) ?? salarios[0]?.salarioBasico
  const bs = (src['bonoSalarial'] as number | undefined) ?? salarios[0]?.bonoSalarial
  const at = (src['auxilioTransporte'] as number | undefined) ?? salarios[0]?.auxilioTransporte
  const ans = (src['auxilioNoSalarial'] as number | undefined) ?? salarios[0]?.auxilioNoSalarial

  salarioBasico.value = sb != null ? sanitizeMoney(sb) : ''
  bonoSalarial.value = bs != null ? sanitizeMoney(bs) : ''
  auxilioTransporte.value = at != null ? sanitizeMoney(at) : ''
  auxilioNoSalarial.value = ans != null ? sanitizeMoney(ans) : ''

  contratoEditArchivoUrl.value = (src['rutaArchivoContratoFisico'] as string | null) || null
  contratoEditNombreArchivo.value = contratoEditArchivoUrl.value?.split('/')?.pop() || 'Contrato actual'

  recMetaCache.value = {
    url: (src['rutaArchivoRecomendacionMedica'] as string | null) || null,
    nombre: ((src['rutaArchivoRecomendacionMedica'] as string | null)?.split('/')?.pop() || null)
  }
  syncTieneRecFlagFromMeta(src['tieneRecomendacionesMedicas'])

  try {
    const meta = await obtenerRecomendacionMedicaMeta(Number(c.id))
    const d = (meta as Dict | null)?.['data'] as Dict | undefined
    if (d) {
      recMetaCache.value = {
        url: (d['url'] as string | null) || recMetaCache.value?.url || null,
        nombre: (d['nombreOriginal'] as string | null) || recMetaCache.value?.nombre || null
      }
    }
    syncTieneRecFlagFromMeta(src['tieneRecomendacionesMedicas'])
  } catch {}
  recUiTick.value++

  await Promise.all(['eps','arl','afp','afc','ccf'].map(async (t) =>{
    try {
      const meta = await obtenerArchivoAfiliacionMeta(Number(c.id), t as AfiliacionTipo)
      setCertState(t as AfiliacionTipo, tieneArchivoAfiliacion(meta as unknown), meta as unknown)
    } catch { setCertState(t as AfiliacionTipo, false, null) }
  }))

  try { await cargarPasosDesdeBackend(Number(c.id)) } catch {}

  archivoContrato.value = null
  fileInputRenderKey.value++
  fileBlockKey.value++
  await nextTick(); window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function guardarCambiosContrato() {
  if (isSaving.value) return
  isSaving.value = true
  try {
    if (!contratoEditId.value) return
    const { valid } = await validate()
    if (!valid) { showAlert('Error de Validación', 'Revisa los campos obligatorios.'); return }

    const tipo = tipoContratoSeleccionado.value
    const termino = terminoContrato.value
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

    const terminoNormalizado = (() => {
      const t = tipoContratoSeleccionado.value
      const valor = terminoContrato.value
      if (t === 'temporal') return 'obra_o_labor_determinada' as const
      if (t === 'aprendizaje') return 'fijo' as const
      return (valor || null) as CrearContratoPayload['terminoContrato']
    })()

    const fechaTerminacionNormalizada =
      isFechaTerminacionRequired.value ? (fechaTerminacion.value || null) : null

    const payload: Partial<CrearContratoPayload> = {
      tipoContrato: tipoContratoSeleccionado.value,
      terminoContrato: terminoNormalizado,
      identificacion: String(identificacion.value || '').trim(),
      sedeId: sedeId.value ? Number(sedeId.value) : null,
      cargoId: cargoId.value ? Number(cargoId.value) : null,
      funcionesCargo: String(funcionesCargo.value || '').trim() || null,
      fechaInicio: fechaInicio.value || null,
      fechaTerminacion: fechaTerminacionNormalizada,
      centroCosto: String(centroCosto.value || '').trim() || null,
      epsId: epsId.value ?? null, arlId: arlId.value ?? null, afpId: afpId.value ?? null, afcId: afcId.value ?? null, ccfId: ccfId.value ?? null,
      tieneRecomendacionesMedicas: !!tieneRecomendacionesMedicas.value,
      salarioBasico: salarioBasico.value !== '' ? Number(salarioBasico.value) : undefined,
      bonoSalarial: bonoSalarial.value !== '' ? Number(bonoSalarial.value) : undefined,
      auxilioTransporte: auxilioTransporte.value !== '' ? Number(auxilioTransporte.value) : undefined,
      auxilioNoSalarial: auxilioNoSalarial.value !== '' ? Number(auxilioNoSalarial.value) : undefined,
    }
    await actualizarContrato(Number(contratoEditId.value), payload)

    if (archivoContrato.value && razonSocialSeleccionada.value != null) {
      const anexarPayload: AnexarContratoPayload = {
        contratoId: Number(contratoEditId.value),
        archivo: archivoContrato.value,
        razonSocialId: Number(razonSocialSeleccionada.value),
        tieneRecomendacionesMedicas: false,
      }
      await anexarContrato(anexarPayload)
    }
    if (tieneRecomendacionesMedicas.value && archivoRecomendacionMedica.value) {
      await subirRecomendacionMedica(Number(contratoEditId.value), archivoRecomendacionMedica.value)
    }

    const refreshed = await obtenerContratoPorId(Number(contratoEditId.value)) as Dict
    contratoEditArchivoUrl.value = (refreshed['rutaArchivoContratoFisico'] as string | null) || contratoEditArchivoUrl.value
    contratoEditNombreArchivo.value = (contratoEditArchivoUrl.value?.split('/')?.pop() || contratoEditNombreArchivo.value || 'Contrato actual')

    try {
      const meta = await obtenerRecomendacionMedicaMeta(Number(contratoEditId.value))
      const d = (meta as Dict | null)?.['data'] as Dict | undefined
      recMetaCache.value = { url: (d?.['url'] as string | null) || null, nombre: (d?.['nombreOriginal'] as string | null) || null }
    } catch {
      recMetaCache.value = {
        url: (refreshed['rutaArchivoRecomendacionMedica'] as string | null) || recMetaCache.value?.url || null,
        nombre: ((refreshed['rutaArchivoRecomendacionMedica'] as string | null)?.split('/')?.pop() || recMetaCache.value?.nombre || null),
      }
    }
    recUiTick.value++
    syncTieneRecFlagFromMeta(refreshed['tieneRecomendacionesMedicas'])

    notify('Contrato actualizado correctamente.', 'success')
    await resetParaSiguienteEnMismaRazon()
  } catch (e) {
    showAlert('Error', (e as Error)?.message || 'No fue posible actualizar el contrato.')
  } finally { isSaving.value = false }
}

function cancelarEdicion() {
  isEditing.value = false
  contratoEditId.value = null
  limpiarFormulario()
}

/* ======= Modal de pasos ======= */
const modalPaso = ref<{
  mostrar: boolean
  paso: Paso | null
  form: { observacion: string; archivo: File | null }
  loading: boolean
}>({
  mostrar:false,
  paso: null,
  form: { observacion:'', archivo: null },
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
function onFilePasoChange(){/* no-op */ }
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
  } catch (e) {
    notify((e as Error)?.message || 'No fue posible eliminar el archivo del paso.', 'error')
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
  } catch (e) {
    notify((e as Error)?.message || 'No fue posible guardar el paso.', 'error')
  } finally {
    modalPaso.value.loading = false
  }
}

/* ======= Clip de contrato (input principal) ======= */
function onFileChange(value: unknown) {
  let f: File | null = null
  if (Array.isArray(value)) f = value[0] || null
  else if (isRecord(value) && 'target' in value && (value as { target: { files?: FileList } }).target?.files) {
    f = (value as { target: { files?: FileList } }).target.files?.[0] || null
  }
  else if (value instanceof File) f = value
  else f = null

  if (!f) { archivoContrato.value = null; return }

  const msg = validateFileOrMsg(f, { allowedMime: ALLOWED_CONTRATO_MIME, maxMB: MAX_UPLOAD_MB })
  if (msg) {
    showAlert('Archivo de contrato inválido', msg)
    archivoContrato.value = null
    fileInputRenderKey.value++
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
  } catch (e) {
    notify((e as Error)?.message || 'No fue posible cambiar el estado.', 'error')
  }
}

/* ======= Resets ======= */
async function resetTotal() {
  resetForm()
  resetPasos()
  archivoContrato.value = null
  archivoRecomendacionMedica.value = null

  fileInputRenderKey.value++
  fileBlockKey.value++

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

  contratoPendienteAnexoId.value = null

  await nextTick()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function resetParaSiguienteEnMismaRazon({ keepTipo = true }: { keepTipo?: boolean } = {}) {
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

  fileInputRenderKey.value++
  fileBlockKey.value++

  tipoContratoSeleccionado.value = 'prestacion'
  pendingCertsByTipo.value = { eps:null, arl:null, afp:null, afc:null, ccf:null }
  pendingEntidadIdByTipo.value = { eps:null, arl:null, afp:null, afc:null, ccf:null }
  certStatusByTipo.value = { eps:false, arl:false, afp:false, afc:false, ccf:false }
  afiliacionMetaByTipo.value = { eps:null, arl:null, afp:null, afc:null, ccf:null }
  certUiTick.value++
  recMetaCache.value = null
  tieneRecomendacionesMedicas.value = false
  recUiTick.value++
  contratoPendienteAnexoId.value = null
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

  fileInputRenderKey.value++
  fileBlockKey.value++

  contratoPendienteAnexoId.value = null

  if (!v) return
  await cargarHistorialContratos()
})
watch(tipoContratoSeleccionado, () => {
  const allowed = terminosContratoOptions.value.map(o => o.value)
  if (!allowed.some(v => v === terminoContrato.value)) terminoContrato.value = null
})

/* ======= Mounted ======= */
onMounted(() => {
  cargarRazonesSociales()
  cargarSedes()
  cargarCargos()
  cargarEntidadesSalud()
})

/* Exponer helper al template */
defineExpose({ toAbsoluteApiUrl })
</script>


<style scoped>
/* ====== Tono corporativo (suave) ====== */
:root {
  --corp-primary: #0d47a1;
  --corp-accent:  #1976d2;
  --corp-bg:      #f6f8fb;
}

/* ====== Layout de formularios ====== */
.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ====== Encabezados de tarjeta (más espaciado y acento) ====== */
.v-card-title.bg-blue-grey-lighten-5 {
  background: linear-gradient(180deg, #f7f9fc 0%, #eef3f7 100%) !important;
  border-bottom: 1px solid #e6eaf0;
  padding-top: 18px;
  padding-bottom: 18px;
  letter-spacing: .2px;
}
.v-card-title.bg-blue-grey-lighten-5::before {
  content: "";
  display: inline-block;
  width: 4px;
  height: 1.6em;
  margin-right: 10px;
  border-radius: 4px;
  background: var(--corp-accent);
}
.v-card-title.bg-blue-grey-lighten-5 .v-chip {
  margin-left: 8px;
}

/* ====== Íconos de “clip” y estados en selects ====== */
.append-icons { display: flex; align-items: center; gap: 6px; }
.append-icons .v-icon,
.append-icons .v-btn { margin-left: 2px; }
.append-icons .v-btn { min-width: 28px; height: 28px; padding: 0; }

/* Desactivar interacción visual cuando el select esté deshabilitado */
:deep(.v-input--disabled) .append-icons .v-btn,
:deep(.v-input--disabled) .append-icons .v-icon {
  opacity: 0.5;
  pointer-events: none;
}

/* ====== FIX: Quitar el “recuadro azul” que sobresale en el focus ======
   (se reemplaza por un realce interno más sutil y corporativo) */
:deep(.v-btn:focus-visible),
:deep(.v-field__input:focus-visible) {
  outline: none !important;         /* quita el borde azul externo del navegador */
}
:deep(.v-field) { border-radius: 10px; }
:deep(.v-field.v-field--focused) {
  /* halo interno suave que NO se sale del input */
  box-shadow: inset 0 0 0 2px rgba(25, 118, 210, .18);
}
:deep(.v-field.v-field--focused .v-field__outline) {
  --v-field-border-opacity: 1;
  border-color: #1976d2 !important; /* tono corporativo */
}
:deep(.v-field),
:deep(.v-btn) {
  transition: box-shadow .18s ease, border-color .18s ease, background-color .18s ease;
}

/* ====== Tabla de historial ====== */
.v-table { width: 100%; border-collapse: collapse; }
.v-table th, .v-table td {
  padding: 8px;
  border-bottom: 1px solid #e0e6ef;
  vertical-align: middle;
}
.v-table th {
  font-weight: 700;
  background-color: #f5f8fb;
}
.v-table tbody tr:hover { background-color: #fafcff; }

/* ====== Tipografías / utilidades ====== */
.text-capitalize { text-transform: capitalize; }

/* Ajustes de chips y botones pequeños en celdas */
.v-chip { font-weight: 600; }
.v-btn--size-x-small { line-height: 1.1; height: 28px; }

/* ====== Diálogos ====== */
.v-dialog .v-card-title { font-weight: 600; }
.v-dialog .v-card-text  { padding-top: 12px; }

/* ====== Inputs de archivo ====== */
.v-file-input { margin-bottom: 8px; }

/* ====== Timeline ====== */
:deep(.v-timeline-item__dot)  { box-shadow: none; }
:deep(.v-timeline-item__body) { padding-top: 6px; padding-bottom: 6px; }

/* ====== Contenedores con resalte suave ====== */
.v-alert { border-radius: 10px; }

/* ====== Responsive tweaks ====== */
@media (max-width: 600px) {
  .v-table th, .v-table td { padding: 6px; }
  .append-icons { gap: 4px; }
}
</style>
