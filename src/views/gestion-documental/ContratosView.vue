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
                inputmode="numeric"
                :max="MAX_MONEY"
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
                :error-messages="auxilioTransporteError"
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
                :error-messages="auxilioNoSalarialError"
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
                  <!-- Definición -->
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

                  <!-- Indicador de estado del certificado -->
                  <v-tooltip :text="certTooltip('eps')" location="top">
                    <template #activator="{ props }">
                      <v-icon
                        v-bind="props"
                        :icon="certIcon('eps')"
                        :color="certColor('eps')"
                        size="18"
                        class="ml-1"
                      />
                    </template>
                  </v-tooltip>

                  <!-- Paperclip + badge si hay certificado -->
                  <v-tooltip :text="hasCert('eps') ? 'Certificado cargado' : 'Subir/Ver certificado EPS'" location="top">
                    <template #activator="{ props }">
                      <v-badge
                        v-if="hasCert('eps')"
                        location="bottom end"
                        :offset-x="2"
                        :offset-y="2"
                        color="success"
                        class="ml-1"
                      >
                        <template #badge>
                          <v-icon size="12">mdi-check</v-icon>
                        </template>
                        <v-btn
                          icon="mdi-paperclip"
                          size="small"
                          variant="text"
                          class="ml-1"
                          :disabled="!epsId"
                          @click.stop="abrirDialogoCertificado('eps')"
                        />
                      </v-badge>

                      <v-btn
                        v-else
                        v-bind="props"
                        icon="mdi-paperclip"
                        size="small"
                        variant="text"
                        class="ml-1"
                        :disabled="!epsId"
                        @click.stop="abrirDialogoCertificado('eps')"
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

                  <!-- Indicador -->
                  <v-tooltip :text="certTooltip('arl')" location="top">
                    <template #activator="{ props }">
                      <v-icon
                        v-bind="props"
                        :icon="certIcon('arl')"
                        :color="certColor('arl')"
                        size="18"
                        class="ml-1"
                      />
                    </template>
                  </v-tooltip>

                  <!-- Paperclip -->
                  <v-tooltip :text="hasCert('arl') ? 'Certificado cargado' : 'Subir/Ver certificado ARL'" location="top">
                    <template #activator="{ props }">
                      <v-badge
                        v-if="hasCert('arl')"
                        location="bottom end"
                        :offset-x="2"
                        :offset-y="2"
                        color="success"
                        class="ml-1"
                      >
                        <template #badge>
                          <v-icon size="12">mdi-check</v-icon>
                        </template>
                        <v-btn
                          icon="mdi-paperclip"
                          size="small"
                          variant="text"
                          class="ml-1"
                          :disabled="!arlId"
                          @click.stop="abrirDialogoCertificado('arl')"
                        />
                      </v-badge>

                      <v-btn
                        v-else
                        v-bind="props"
                        icon="mdi-paperclip"
                        size="small"
                        variant="text"
                        class="ml-1"
                        :disabled="!arlId"
                        @click.stop="abrirDialogoCertificado('arl')"
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

                  <!-- Indicador -->
                  <v-tooltip :text="certTooltip('afp')" location="top">
                    <template #activator="{ props }">
                      <v-icon
                        v-bind="props"
                        :icon="certIcon('afp')"
                        :color="certColor('afp')"
                        size="18"
                        class="ml-1"
                      />
                    </template>
                  </v-tooltip>

                  <!-- Paperclip -->
                  <v-tooltip :text="hasCert('afp') ? 'Certificado cargado' : 'Subir/Ver certificado AFP'" location="top">
                    <template #activator="{ props }">
                      <v-badge
                        v-if="hasCert('afp')"
                        location="bottom end"
                        :offset-x="2"
                        :offset-y="2"
                        color="success"
                        class="ml-1"
                      >
                        <template #badge>
                          <v-icon size="12">mdi-check</v-icon>
                        </template>
                        <v-btn
                          icon="mdi-paperclip"
                          size="small"
                          variant="text"
                          class="ml-1"
                          :disabled="!afpId"
                          @click.stop="abrirDialogoCertificado('afp')"
                        />
                      </v-badge>

                      <v-btn
                        v-else
                        v-bind="props"
                        icon="mdi-paperclip"
                        size="small"
                        variant="text"
                        class="ml-1"
                        :disabled="!afpId"
                        @click.stop="abrirDialogoCertificado('afp')"
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

                  <!-- Indicador -->
                  <v-tooltip :text="certTooltip('afc')" location="top">
                    <template #activator="{ props }">
                      <v-icon
                        v-bind="props"
                        :icon="certIcon('afc')"
                        :color="certColor('afc')"
                        size="18"
                        class="ml-1"
                      />
                    </template>
                  </v-tooltip>

                  <!-- Paperclip -->
                  <v-tooltip :text="hasCert('afc') ? 'Certificado cargado' : 'Subir/Ver certificado AFC'" location="top">
                    <template #activator="{ props }">
                      <v-badge
                        v-if="hasCert('afc')"
                        location="bottom end"
                        :offset-x="2"
                        :offset-y="2"
                        color="success"
                        class="ml-1"
                      >
                        <template #badge>
                          <v-icon size="12">mdi-check</v-icon>
                        </template>
                        <v-btn
                          icon="mdi-paperclip"
                          size="small"
                          variant="text"
                          class="ml-1"
                          :disabled="!afcId"
                          @click.stop="abrirDialogoCertificado('afc')"
                        />
                      </v-badge>

                      <v-btn
                        v-else
                        v-bind="props"
                        icon="mdi-paperclip"
                        size="small"
                        variant="text"
                        class="ml-1"
                        :disabled="!afcId"
                        @click.stop="abrirDialogoCertificado('afc')"
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

                  <!-- Indicador -->
                  <v-tooltip :text="certTooltip('ccf')" location="top">
                    <template #activator="{ props }">
                      <v-icon
                        v-bind="props"
                        :icon="certIcon('ccf')"
                        :color="certColor('ccf')"
                        size="18"
                        class="ml-1"
                      />
                    </template>
                  </v-tooltip>

                  <!-- Paperclip -->
                  <v-tooltip :text="hasCert('ccf') ? 'Certificado cargado' : 'Subir/Ver certificado CCF'" location="top">
                    <template #activator="{ props }">
                      <v-badge
                        v-if="hasCert('ccf')"
                        location="bottom end"
                        :offset-x="2"
                        :offset-y="2"
                        color="success"
                        class="ml-1"
                      >
                        <template #badge>
                          <v-icon size="12">mdi-check</v-icon>
                        </template>
                        <v-btn
                          icon="mdi-paperclip"
                          size="small"
                          variant="text"
                          class="ml-1"
                          :disabled="!ccfId"
                          @click.stop="abrirDialogoCertificado('ccf')"
                        />
                      </v-badge>

                      <v-btn
                        v-else
                        v-bind="props"
                        icon="mdi-paperclip"
                        size="small"
                        variant="text"
                        class="ml-1"
                        :disabled="!ccfId"
                        @click.stop="abrirDialogoCertificado('ccf')"
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
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                variant="outlined"
                density="compact"
                prepend-icon="mdi-file-upload"
                :disabled="!tieneRecomendacionesMedicas"
                :rules="tieneRecomendacionesMedicas ? [(v) => !!v || 'Archivo requerido'] : []"
                clearable
                @change="onFileRecChange"
              />
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
            <h4 class="text-h6 mb-2">{{ isEditing ? 'Reemplazar Archivo de Contrato (opcional)' : 'Anexar Contrato' }}</h4>
            <v-card class="pa-4">
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
              />
              <div class="text-caption text-medium-emphasis mb-3">
                Formato permitido: PDF (máx {{ MAX_UPLOAD_MB }} MB)
              </div>

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
            :disabled="!usuarioSeleccionado || !archivoContrato || isSaving"
            :loading="isSaving"
            @click="handleConfirmacion"
          >Crear y Anexar Contrato</v-btn>

          <v-btn
            v-else
            color="warning"
            prepend-icon="mdi-content-save"
            :disabled="!usuarioSeleccionado || isSaving"
            :loading="isSaving"
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

    <!-- Dialogo de Certificado de Entidad de Salud -->
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
            <v-alert
              v-if="certTieneArchivo"
              type="success"
              variant="tonal"
              class="mb-3"
            >
              <div class="d-flex flex-wrap align-center ga-2">
                <div>
                  <strong>Actual:</strong>
                  {{ certDialog.meta?.certificadoNombreOriginal || 'Archivo cargado' }}
                </div>
                <div v-if="certDialog.meta?.certificadoFechaEmision">
                  • Emisión: {{ formatFechaOrFechaHora(certDialog.meta.certificadoFechaEmision) }}
                </div>
                <div v-if="certDialog.meta?.certificadoFechaExpiracion">
                  • Expira: {{ formatFechaOrFechaHora(certDialog.meta.certificadoFechaExpiracion) }}
                </div>
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
              class="mb-3"
            />

            <v-row dense>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="certDialog.fechaEmision"
                  label="Fecha de Emisión (opcional)"
                  type="date"
                  variant="outlined"
                  density="compact"
                  clearable
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="certDialog.fechaExpiracion"
                  label="Fecha de Expiración (opcional)"
                  type="date"
                  variant="outlined"
                  density="compact"
                  clearable
                />
              </v-col>
            </v-row>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" color="grey-darken-1" @click="cerrarCertDialog">Cerrar</v-btn>

          <v-btn
            v-if="certTieneArchivo"
            variant="tonal"
            prepend-icon="mdi-download"
            @click="descargarCertificadoSeleccionado"
          >Descargar</v-btn>

          <v-btn
            v-if="certTieneArchivo"
            variant="tonal"
            color="error"
            prepend-icon="mdi-delete"
            @click="eliminarCertificadoSeleccionado"
          >Eliminar</v-btn>

          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-upload"
            :disabled="!certDialog.file || certDialog.loading"
            @click="subirCertificadoSeleccionado"
          >{{ certTieneArchivo ? 'Reemplazar' : 'Subir' }}</v-btn>
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

    <!-- Snackbar de confirmación rápida -->
    <v-snackbar v-model="snackbar.show" :timeout="snackbar.timeout" :color="snackbar.color">
      <v-icon class="mr-2">mdi-check-circle</v-icon>{{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useForm, useField } from 'vee-validate'
import { listarRazonesSociales, fetchUsuariosPorRazonSocial } from '@/services/razonSocialService'
import {
  obtenerSedes,
  obtenerCargos,
  obtenerEntidadesSalud,
  obtenerEntidadSaludPorId,
  subirCertificadoEntidadSalud,
  descargarCertificadoEntidadSalud,
  eliminarCertificadoEntidadSalud,
  entidadTieneCertificado,
} from '@/services/UserService'
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

/* ======= Helpers de fecha/hora ======= */
function parseYMDLocal(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((s || '').trim())
  return m ? new Date(+m[1], +m[2] - 1, +m[3], 0, 0, 0) : null
}
function coerceToDate(v: any): Date | null {
  if (!v) return null
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v
  if (typeof v === 'string') {
    return parseYMDLocal(v) ?? (isNaN(new Date(v).getTime()) ? null : new Date(v))
  }
  return null
}
const fmtFecha = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
const fmtFechaHora = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
})
function formatFecha(v: any): string { const d = coerceToDate(v); return d ? fmtFecha.format(d) : '—' }
function formatFechaHora(v: any): string { const d = coerceToDate(v); return d ? fmtFechaHora.format(d).replace(',', '') : '—' }
function formatFechaOrFechaHora(v: any): string {
  const hasTime = typeof v === 'string' && (/[T ]\d{2}:\d{2}/.test(v))
  return hasTime ? formatFechaHora(v) : formatFecha(v)
}

/* ======= Tipos ======= */
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
  tipoContrato: 'prestacion' | 'temporal' | 'laboral' | 'aprendizaje' | string
  terminoContrato: string | null
  estado: 'activo' | 'inactivo' | string
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

type AfiliacionTipo = 'eps' | 'arl' | 'afp' | 'afc' | 'ccf'

/* ======= Constantes de archivos y dinero ======= */
const MAX_UPLOAD_MB = 10
const BYTES_MB = 1024 * 1024
const ALLOWED_CONTRATO_MIME = ['application/pdf']
const ALLOWED_REC_EXT = ['pdf', 'doc', 'docx']
const MAX_MONEY = 2_000_000_000 // 2 mil millones

/* Evita envíos múltiples */
const isSaving = ref(false)

/* Helpers archivos */
function extOf(name?: string) {
  if (!name) return ''
  const p = name.split('.')
  return (p[p.length - 1] || '').toLowerCase()
}
function validateFileOrMsg(file: File | null, opts: { allowedMime?: string[], allowedExt?: string[], maxMB?: number }) {
  if (!file) return 'Archivo requerido.'
  if (opts.maxMB && file.size > (opts.maxMB * BYTES_MB)) return `El archivo supera ${opts.maxMB} MB.`
  if (opts.allowedMime && !opts.allowedMime.includes(file.type)) return `Tipo no permitido (${file.type || 'desconocido'}).`
  if (opts.allowedExt && !opts.allowedExt.includes(extOf(file.name))) return `Extensión no permitida (.${extOf(file.name)}).`
  return null
}

/* Sanitizar dinero (acepta vacíos) */
function sanitizeMoney(v: any) {
  if (v === null || v === undefined || v === '') return ''
  const n = Number(String(v).replace(/[^\d.-]/g, ''))
  if (isNaN(n)) return ''
  return Math.min(n, MAX_MONEY)
}

/* ======= Estado ======= */
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

const isEditing = ref(false)
const contratoEditId = ref<number | null>(null)

const modalPaso = ref({
  mostrar: false,
  paso: null as Paso | null,
  form: { observacion: '', archivo: null as File | null }
})

const archivoContrato = ref<File | null>(null)
/** key para forzar reset visual del v-file-input */
const fileInputKey = ref(0)
const fileInputRef = ref<HTMLInputElement | null>(null)

const tieneRecomendacionesMedicas = ref(false)
const archivoRecomendacionMedica = ref<File | null>(null)

const identificacionRef = ref()

/* Alertas / snackbar */
const showAlertDialog = ref(false)
const alertDialogTitle = ref('')
const alertDialogMessage = ref('')
const showAlert = (title: string, message: string) => {
  alertDialogTitle.value = title
  alertDialogMessage.value = message
  showAlertDialog.value = true
}
const snackbar = ref<{ show: boolean; text: string; color: string; timeout: number }>({
  show: false, text: '', color: 'success', timeout: 1800
})
const notify = (text: string, color = 'success') => {
  snackbar.value.text = text
  snackbar.value.color = color
  snackbar.value.show = true
}

/* vee-validate */
const showConfirmDialog = ref(false)
const { handleSubmit, resetForm, validate } = useForm()

const required = (v: any) => (v !== null && v !== undefined && v !== '') || 'Este campo es obligatorio.'
const optionalNumber = (v: any) => (v == null || v === '') ? true : !isNaN(Number(v)) || 'Debe ser un número válido.'

/* Reglas reforzadas dinero */
const moneyRules = [
  optionalNumber,
  (v: any) => (v === '' || v === null || v === undefined || Number(v) >= 0) || 'No puede ser negativo.',
  (v: any) => (v === '' || Number(v) <= MAX_MONEY) || `No puede superar ${MAX_MONEY.toLocaleString('es-CO')}.`,
]

const { value: identificacion, errorMessage: identificacionError } = useField('identificacion', [required, (val: string) => val.length >= 5 || 'Debe tener al menos 5 caracteres.'])
const { value: sedeId, errorMessage: sedeIdError } = useField<number | null>('sedeId', [required], { initialValue: null })
const { value: cargoId, errorMessage: cargoIdError } = useField<number | null>('cargoId', [required], { initialValue: null })
const { value: funcionesCargo, errorMessage: funcionesCargoError } = useField('funcionesCargo', [required], { initialValue: '' })

const { value: salarioBasico, errorMessage: salarioBasicoError } = useField('salarioBasico', [required, ...moneyRules], { initialValue: '' })
const { value: bonoSalarial, errorMessage: bonoSalarialError } = useField('bonoSalarial', moneyRules, { initialValue: '' })
const { value: auxilioTransporte, errorMessage: auxilioTransporteError } = useField('auxilioTransporte', moneyRules, { initialValue: '' })
const { value: auxilioNoSalarial, errorMessage: auxilioNoSalarialError } = useField('auxilioNoSalarial', moneyRules, { initialValue: '' })

const { value: fechaInicio } = useField('fechaInicio', [required], { initialValue: '' })

const terminoContratoRules = computed(() =>
  (tipoContratoSeleccionado.value !== 'prestacion' && tipoContratoSeleccionado.value !== 'aprendizaje') ? [required] : []
)
const { value: terminoContrato, errorMessage: terminoContratoError } = useField('terminoContrato', terminoContratoRules, { initialValue: null })

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

/* Centro de costo (fijo) */
const centrosCostoOptions = ref<string[]>([
  'ADMINISTRACIÓN','TALENTO HUMANO','CONTABILIDAD','OPERACIÓN','SERVICIO AL CLIENTE','DIRECCIÓN','COMERCIAL',
])

const pasosContrato = computed(() => {
  let current: Paso[] = []
  if (tipoContratoSeleccionado.value === 'prestacion' || tipoContratoSeleccionado.value === 'aprendizaje') current = [...basePasosPrestacion]
  else if (tipoContratoSeleccionado.value === 'temporal') current = [...basePasosTemporal]
  else current = [...basePasosLaboral]
  return current.map((p, i) => ({ ...p, orden: i + 1 })).sort((a, b) => (a.orden || 0) - (b.orden || 0))
})

const filteredEps = computed(() => entidadesSalud.value.filter((e: any) => e.tipo === 'eps'))
const filteredArl = computed(() => entidadesSalud.value.filter((e: any) => e.tipo === 'arl'))
const filteredAfp = computed(() => entidadesSalud.value.filter((e: any) => e.tipo === 'afp'))
const filteredAfc = computed(() => entidadesSalud.value.filter((e: any) => e.tipo === 'afc'))
const filteredCcf = computed(() => entidadesSalud.value.filter((e: any) => e.tipo === 'ccf'))

const salarioTotalCalculado = computed(() => {
  const sb = Number(salarioBasico.value) || 0
  const bs = Number(bonoSalarial.value) || 0
  const at = Number(auxilioTransporte.value) || 0
  const ans = Number(auxilioNoSalarial.value) || 0
  return (sb + bs + at + ans).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })
})

/* ===== Certificados: estado por entidad ===== */
const certStatusMap = ref<Record<number, boolean>>({})
const entidadMetaCache = ref<Record<number, any>>({})

function setCertStatus(entidadId: number, has: boolean) {
  certStatusMap.value = { ...certStatusMap.value, [entidadId]: has }
}
function setEntidadMetaCache(entidadId: number, meta: any | null) {
  const cache = { ...entidadMetaCache.value }
  if (meta) cache[entidadId] = meta
  else delete cache[entidadId]
  entidadMetaCache.value = cache
}

function hasCert(tipo: AfiliacionTipo): boolean {
  const id = ({
    eps: epsId.value,
    arl: arlId.value,
    afp: afpId.value,
    afc: afcId.value,
    ccf: ccfId.value,
  } as Record<AfiliacionTipo, number | null>)[tipo]
  return !!(id && certStatusMap.value[id])
}

/* ===== Estado visual para afiliaciones (icono/color/tooltip) ===== */
function certColor(tipo: AfiliacionTipo) {
  const id = ({ eps: epsId.value, arl: arlId.value, afp: afpId.value, afc: afcId.value, ccf: ccfId.value } as Record<AfiliacionTipo, number | null>)[tipo]
  if (!id) return 'warning'                 // sin entidad -> amarillo
  const has = certStatusMap.value[id]
  return has === true ? 'success' : 'error' // true -> verde, false/undef -> rojo
}
function certIcon(tipo: AfiliacionTipo) {
  const id = ({ eps: epsId.value, arl: arlId.value, afp: afpId.value, afc: afcId.value, ccf: ccfId.value } as Record<AfiliacionTipo, number | null>)[tipo]
  if (!id) return 'mdi-alert-circle-outline'
  const has = certStatusMap.value[id]
  return has === true ? 'mdi-check-circle' : 'mdi-alert-circle-outline'
}
function certTooltip(tipo: AfiliacionTipo) {
  const id = ({ eps: epsId.value, arl: arlId.value, afp: afpId.value, afc: afcId.value, ccf: ccfId.value } as Record<AfiliacionTipo, number | null>)[tipo]
  if (!id) return 'Sin entidad seleccionada'
  const has = certStatusMap.value[id]
  return has === true ? 'Certificado cargado' : 'No hay certificado cargado'
}

/* Forzar/actualizar estado desde backend o caché */
async function refreshCertStatusByEntidadId(entidadId: number) {
  const cached = entidadMetaCache.value[entidadId]
  if (cached !== undefined) {
    try { setCertStatus(entidadId, entidadTieneCertificado(cached)) } catch { setCertStatus(entidadId, false) }
  }
  try {
    const meta = await obtenerEntidadSaludPorId(entidadId)
    setEntidadMetaCache(entidadId, meta)
    setCertStatus(entidadId, entidadTieneCertificado(meta))
  } catch (e) {
    setCertStatus(entidadId, false)
    console.error('No se pudo refrescar estado de entidad', entidadId, e)
  }
}
async function refreshCertStatusByTipo(tipo: AfiliacionTipo) {
  const id = ({ eps: epsId.value, arl: arlId.value, afp: afpId.value, afc: afcId.value, ccf: ccfId.value } as Record<AfiliacionTipo, number | null>)[tipo]
  if (!id) return
  await refreshCertStatusByEntidadId(id)
}

/* ===========================
   Certificados de Entidad de Salud (UI)
   =========================== */
const certDialog = ref<{
  open: boolean
  tipo: AfiliacionTipo | ''
  entidadId: number | null
  entidadNombre: string
  file: File | null
  fechaEmision: string
  fechaExpiracion: string
  loading: boolean
  meta: any
}>({
  open: false,
  tipo: '',
  entidadId: null,
  entidadNombre: '',
  file: null,
  fechaEmision: '',
  fechaExpiracion: '',
  loading: false,
  meta: null,
})

const certTieneArchivo = computed(() => {
  const meta = certDialog.value.meta
  try { return !!meta && entidadTieneCertificado(meta) } catch { return false }
})

function cerrarCertDialog() {
  certDialog.value.open = false
  certDialog.value.tipo = ''
  certDialog.value.entidadId = null
  certDialog.value.entidadNombre = ''
  certDialog.value.file = null
  certDialog.value.fechaEmision = ''
  certDialog.value.fechaExpiracion = ''
  certDialog.value.loading = false
  certDialog.value.meta = null
}

async function abrirDialogoCertificado(tipo: AfiliacionTipo) {
  const idMap: Record<AfiliacionTipo, number | null> = { eps: epsId.value, arl: arlId.value, afp: afpId.value, afc: afcId.value, ccf: ccfId.value }
  const id = idMap[tipo]
  if (!id) return showAlert('Selecciona una entidad', 'Debes elegir una entidad antes de gestionar su certificado.')

  const ent = entidadesSalud.value.find((e: any) => e.id === id)
  certDialog.value.tipo = tipo
  certDialog.value.entidadId = id
  certDialog.value.entidadNombre = ent?.nombre || `Entidad ${id}`
  certDialog.value.open = true

  const cached = entidadMetaCache.value[id]
  if (cached) {
    certDialog.value.meta = cached
    setCertStatus(id, entidadTieneCertificado(cached))
  } else {
    certDialog.value.meta = null
  }

  certDialog.value.loading = true
  try {
    const meta = await obtenerEntidadSaludPorId(id)
    certDialog.value.meta = meta
    setEntidadMetaCache(id, meta)
    setCertStatus(id, entidadTieneCertificado(meta))
  } catch (e) {
    console.error('Error cargando entidad:', e)
  } finally {
    certDialog.value.loading = false
  }
}

async function subirCertificadoSeleccionado() {
  if (!certDialog.value.entidadId || !certDialog.value.file) return
  certDialog.value.loading = true
  try {
    const updated = await subirCertificadoEntidadSalud(
      certDialog.value.entidadId,
      certDialog.value.file,
      {
        fechaEmision: certDialog.value.fechaEmision || undefined,
        fechaExpiracion: certDialog.value.fechaExpiracion || undefined,
      }
    )
    certDialog.value.meta = updated
    setEntidadMetaCache(certDialog.value.entidadId, updated)
    setCertStatus(certDialog.value.entidadId, true)

    notify('Certificado guardado con éxito', 'success')
    setTimeout(() => { cerrarCertDialog() }, 700)
  } catch (e: any) {
    console.error(e)
    notify(e?.message || 'No fue posible subir el certificado.', 'error')
  } finally {
    certDialog.value.loading = false
  }
}

async function descargarCertificadoSeleccionado() {
  if (!certDialog.value.entidadId) return
  try {
    const sugerido = `${certDialog.value.entidadNombre.replace(/\s+/g, '_')}_certificado`
    await descargarCertificadoEntidadSalud(certDialog.value.entidadId, sugerido)
  } catch (e: any) {
    console.error(e)
    notify(e?.message || 'No fue posible descargar el certificado.', 'error')
  }
}

async function eliminarCertificadoSeleccionado() {
  if (!certDialog.value.entidadId) return
  try {
    await eliminarCertificadoEntidadSalud(certDialog.value.entidadId)
    setCertStatus(certDialog.value.entidadId, false)
    setEntidadMetaCache(certDialog.value.entidadId, null)
    certDialog.value.meta = null
    notify('Certificado eliminado', 'success')
    setTimeout(() => { cerrarCertDialog() }, 500)
  } catch (e: any) {
    console.error(e)
    notify(e?.message || 'No fue posible eliminar el certificado.', 'error')
  }
}

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
const submitForm = handleSubmit(async (values) => { await crearYAnexarContrato(values) })

const handleConfirmacion = async () => {
  if (isSaving.value) return
  const { valid } = await validate()
  if (!valid) return showAlert('Error de Validación', 'Revisa los campos en rojo.')
  if (!usuarioSeleccionado.value || !tipoContratoSeleccionado.value) return showAlert('Advertencia', 'Seleccione usuario y tipo de contrato.')
  if (isFechaTerminacionRequired.value && !fechaTerminacion.value) return showAlert('Advertencia', 'La fecha de terminación es obligatoria para este tipo de contrato.')

  const contratoMsg = validateFileOrMsg(archivoContrato.value, { allowedMime: ALLOWED_CONTRATO_MIME, maxMB: MAX_UPLOAD_MB })
  if (contratoMsg) return showAlert('Archivo de contrato inválido', contratoMsg)
  if (tieneRecomendacionesMedicas.value) {
    const recMsg = validateFileOrMsg(archivoRecomendacionMedica.value, { allowedExt: ALLOWED_REC_EXT, maxMB: MAX_UPLOAD_MB })
    if (recMsg) return showAlert('Archivo de recomendación inválido', recMsg)
  }

  await submitForm()
}

async function crearYAnexarContrato(formData: any) {
  if (isSaving.value) return
  isSaving.value = true
  try {
    if (!usuarioSeleccionado.value || !archivoContrato.value || !razonSocialSeleccionada.value) {
      showAlert('Error', 'Falta información clave.')
      return
    }

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

    notify('Contrato creado y archivos anexados.', 'success')
    await cargarHistorialContratos()
    await resetTotal()
  } catch (e: any) {
    console.error(e)
    showAlert('Error', e?.message || 'No fue posible crear el contrato.')
  } finally {
    isSaving.value = false
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

  terminoContrato.value = (src.tipoContrato === 'prestacion' || src.tipoContrato === 'aprendizaje') ? null : (src.terminoContrato ?? c.terminoContrato ?? null)

  epsId.value = src.epsId ?? c.epsId ?? null
  arlId.value = src.arlId ?? c.arlId ?? null
  afpId.value = src.afpId ?? c.afpId ?? null
  afcId.value = src.afcId ?? c.afcId ?? null
  ccfId.value = src.ccfId ?? c.ccfId ?? null

  tieneRecomendacionesMedicas.value = !!(src.tieneRecomendacionesMedicas ?? false)
  archivoRecomendacionMedica.value = null

  const sb = (src.salarioBasico as number | undefined) ?? (Array.isArray(src.salarios) ? src.salarios[0]?.salarioBasico : undefined) ?? (typeof src.salario === 'number' ? src.salario : undefined)
  const bs = (src.bonoSalarial as number | undefined) ?? (Array.isArray(src.salarios) ? src.salarios[0]?.bonoSalarial : undefined)
  const at = (src.auxilioTransporte as number | undefined) ?? (Array.isArray(src.salarios) ? src.salarios[0]?.auxilioTransporte : undefined)
  const ans = (src.auxilioNoSalarial as number | undefined) ?? (Array.isArray(src.salarios) ? src.salarios[0]?.auxilioNoSalarial : undefined)

  if (sb != null) salarioBasico.value = String(sb)
  if (bs != null) bonoSalarial.value = String(bs)
  if (at != null) auxilioTransporte.value = String(at)
  if (ans != null) auxilioNoSalarial.value = String(ans)

  // === NUEVO: sincroniza estado de certificados para cada entidad seleccionada ===
  await Promise.all([
    epsId.value ? refreshCertStatusByEntidadId(epsId.value) : Promise.resolve(),
    arlId.value ? refreshCertStatusByEntidadId(arlId.value) : Promise.resolve(),
    afpId.value ? refreshCertStatusByEntidadId(afpId.value) : Promise.resolve(),
    afcId.value ? refreshCertStatusByEntidadId(afcId.value) : Promise.resolve(),
    ccfId.value ? refreshCertStatusByEntidadId(ccfId.value) : Promise.resolve(),
  ])

  archivoContrato.value = null

  await nextTick()
  window.scrollTo({ top: 0, behavior: 'smooth' })
  ;(identificacionRef.value as any)?.focus?.()
}

async function guardarCambiosContrato() {
  if (isSaving.value) return
  isSaving.value = true
  try {
    if (!contratoEditId.value) return

    const { valid } = await validate()
    if (!valid) { showAlert('Error de Validación', 'Revisa los campos obligatorios.'); return }

    const requiresEndDate = isFechaTerminacionRequired.value
    if (requiresEndDate && !fechaTerminacion.value) {
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

      salarioBasico: salarioBasico.value !== '' ? Number(salarioBasico.value) : undefined,
      bonoSalarial: bonoSalarial.value !== '' ? Number(bonoSalarial.value) : undefined,
      auxilioTransporte: auxilioTransporte.value !== '' ? Number(auxilioTransporte.value) : undefined,
      auxilioNoSalarial: auxilioNoSalarial.value !== '' ? Number(auxilioNoSalarial.value) : undefined,
    }

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

    notify('Contrato actualizado correctamente.', 'success')
    await cargarHistorialContratos()
    cancelarEdicion()
  } catch (e: any) {
    console.error(e)
    showAlert('Error', e?.message || 'No fue posible actualizar el contrato.')
  } finally {
    isSaving.value = false
  }
}

function cancelarEdicion() {
  isEditing.value = false
  contratoEditId.value = null
  limpiarFormulario()
}

/* ===== NUEVO: reset TOTAL ===== */
async function resetTotal() {
  resetForm()
  archivoContrato.value = null
  archivoRecomendacionMedica.value = null
  fileInputKey.value++

  tipoContratoSeleccionado.value = 'prestacion'
  terminoContrato.value = null
  razonSocialSeleccionada.value = null
  usuarioSeleccionado.value = null

  contratosUsuario.value = []
  certStatusMap.value = {}
  entidadMetaCache.value = {}

  await nextTick()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function limpiarFormulario() {
  resetForm()
  archivoContrato.value = null
  archivoRecomendacionMedica.value = null
  tipoContratoSeleccionado.value = 'prestacion'
  terminoContrato.value = null
  fileInputKey.value++
}

/* activar/inactivar */
async function toggleEstadoContrato(c: ContratoRow) {
  const nuevoEstado = c.estado === 'activo' ? 'inactivo' : 'activo'
  try {
    await cambiarEstadoContrato(c.id, nuevoEstado)
    notify(`Contrato ${c.id} ahora está ${nuevoEstado}.`, 'success')
    await cargarHistorialContratos()
    if (isEditing.value && contratoEditId.value === c.id && nuevoEstado === 'inactivo') {
      cancelarEdicion()
    }
  } catch (e: any) {
    console.error(e)
    notify(e?.message || 'No fue posible cambiar el estado.', 'error')
  }
}

/* Modal pasos (UI local) */
const abrirModalPaso = (paso: Paso) => {
  modalPaso.value.paso = paso
  modalPaso.value.form.observacion = paso.observacion || ''
  modalPaso.value.form.archivo = paso.archivoFile || null
  modalPaso.value.mostrar = true
}
const cerrarModalPaso = () => {
  modalPaso.value.mostrar = false
  modalPaso.value.paso = null
  modalPaso.value.form = { observacion: '', archivo: null }
}
const completarPasoConfirmado = async () => {
  if (!modalPaso.value.paso) return
  const paso = modalPaso.value.paso
  if (!modalPaso.value.form.observacion) {
    return showAlert('Error', 'La observación es obligatoria.')
  }
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

/* File handlers */
const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const f = target.files && target.files[0] ? target.files[0] : null
  const msg = validateFileOrMsg(f, { allowedMime: ALLOWED_CONTRATO_MIME, maxMB: MAX_UPLOAD_MB })
  if (msg) {
    archivoContrato.value = null
    showAlert('Archivo de contrato inválido', msg)
    fileInputKey.value++
    return
  }
  archivoContrato.value = f
}
const onFileRecChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const f = target.files && target.files[0] ? target.files[0] : null
  if (!tieneRecomendacionesMedicas.value) { archivoRecomendacionMedica.value = null; return }
  const msg = validateFileOrMsg(f, { allowedExt: ALLOWED_REC_EXT, maxMB: MAX_UPLOAD_MB })
  if (msg) {
    archivoRecomendacionMedica.value = null
    showAlert('Archivo de recomendación inválido', msg)
    return
  }
  archivoRecomendacionMedica.value = f
}
const onFilePasoChange = () => { /* noop, se maneja al confirmar */ }

/* Descargar archivo genérico (usado en la tabla Historial) */
function parseFilenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null
  const match = /filename\*?=(?:UTF-8''|")?([^\";]+)/i.exec(header)
  if (match && match[1]) {
    try { return decodeURIComponent(match[1].replace(/\"/g, '')) }
    catch { return match[1].replace(/\"/g, '') }
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

/* Watchers */
watch([salarioBasico, bonoSalarial, auxilioTransporte, auxilioNoSalarial], () => {
  salarioBasico.value = sanitizeMoney(salarioBasico.value)
  bonoSalarial.value = sanitizeMoney(bonoSalarial.value)
  auxilioTransporte.value = sanitizeMoney(auxilioTransporte.value)
  auxilioNoSalarial.value = sanitizeMoney(auxilioNoSalarial.value)
})
watch(razonSocialSeleccionada, (newVal) => { if (newVal) cargarUsuariosPorRazonSocial() })
watch(usuarioSeleccionado, async (newVal) => {
  if (newVal) {
    resetForm()
    archivoContrato.value = null
    await cargarHistorialContratos()
  } else {
    contratosUsuario.value = []
  }
})
watch(tipoContratoSeleccionado, (newVal) => {
  if (newVal === 'prestacion' || newVal === 'aprendizaje') terminoContrato.value = null
})
watch(tieneRecomendacionesMedicas, (newVal) => {
  if (!newVal) archivoRecomendacionMedica.value = null
})
/* NUEVO: refrescar estado cuando cambian las entidades */
watch(epsId,  (v) => { if (v) refreshCertStatusByEntidadId(v) })
watch(arlId,  (v) => { if (v) refreshCertStatusByEntidadId(v) })
watch(afpId,  (v) => { if (v) refreshCertStatusByEntidadId(v) })
watch(afcId,  (v) => { if (v) refreshCertStatusByEntidadId(v) })
watch(ccfId,  (v) => { if (v) refreshCertStatusByEntidadId(v) })

/* Mount */
onMounted(() => {
  cargarRazonesSociales()
  cargarSedes()
  cargarCargos()
  cargarEntidadesSalud()
})
</script>

<style scoped>
.form .v-col { padding-top: 4px; padding-bottom: 4px; }
.text-medium-emphasis { opacity: .8; }
</style>
