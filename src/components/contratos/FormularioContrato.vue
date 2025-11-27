<template>
  <!-- NO envolvemos con v-card: la vista ya tiene el card y el título -->
  <v-form class="form" @submit.prevent>
    <v-row dense>
      <!-- Identificación -->
      <v-col cols="12" md="6">
        <v-text-field
          label="Número de Identificación (Número de cédula)"
          v-model="identificacion"
          :error-messages="errors?.identificacion || ''"
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
          :error-messages="errors?.terminoContrato || ''"
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
          :error-messages="errors?.sedeId || ''"
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
          :error-messages="errors?.cargoId || ''"
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
          :error-messages="errors?.salarioBasico || ''"
          type="number"
          inputmode="numeric"
          :max="maxMoney"
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
          :max="maxMoney"
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
          :max="maxMoney"
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
          :max="maxMoney"
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
          :error-messages="errors?.fechaInicio || ''"
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
          :error-messages="errors?.fechaTerminacion || ''"
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
          :error-messages="errors?.funcionesCargo || ''"
          rows="2"
          variant="outlined"
          clearable
          density="compact"
        />
      </v-col>

    <!-- Afiliaciones (ocultar para asesor convenio) -->
<template v-if="!esAsesorConvenio">
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
      :error-messages="errors?.epsId || ''"
      variant="outlined"
      clearable
      density="compact"
      :loading="loadingEntidades"
    >
      <template #append-inner>
        <div :key="certStatusKey?.('eps')" class="append-icons">
          <v-tooltip text="ENTIDAD PRESTADORA DE SERVICIOS DE SALUD" location="top">
            <template #activator="{ props }">
              <v-icon v-bind="props" icon="mdi-help-circle-outline" size="18" class="ml-1 text-medium-emphasis" />
            </template>
          </v-tooltip>

          <v-tooltip v-if="hasCertUI?.('eps')" text="Archivo cargado" location="top">
            <template #activator="{ props }">
              <v-icon v-bind="props" size="18" color="success" class="ml-1">mdi-check-circle</v-icon>
            </template>
          </v-tooltip>

          <v-tooltip :text="hasCertUI?.('eps') ? 'Ver/Reemplazar certificado EPS' : 'Subir certificado EPS'" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="mdi-paperclip" size="small" variant="text" class="ml-1" :disabled="!epsId" :ripple="false" @click.stop="emit('openCert','eps',$event)" />
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
      :error-messages="errors?.arlId || ''"
      variant="outlined"
      clearable
      density="compact"
      :loading="loadingEntidades"
    >
      <template #append-inner>
        <div :key="certStatusKey?.('arl')" class="append-icons">
          <v-tooltip text="ADMINISTRADORA DE RIESGOS LABORALES" location="top">
            <template #activator="{ props }">
              <v-icon v-bind="props" icon="mdi-help-circle-outline" size="18" class="ml-1 text-medium-emphasis" />
            </template>
          </v-tooltip>

          <v-tooltip v-if="hasCertUI?.('arl')" text="Archivo cargado" location="top">
            <template #activator="{ props }">
              <v-icon v-bind="props" size="18" color="success" class="ml-1">mdi-check-circle</v-icon>
            </template>
          </v-tooltip>

          <v-tooltip :text="hasCertUI?.('arl') ? 'Ver/Reemplazar certificado ARL' : 'Subir certificado ARL'" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="mdi-paperclip" size="small" variant="text" class="ml-1" :disabled="!arlId" :ripple="false" @click.stop="emit('openCert','arl',$event)" />
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
      :error-messages="errors?.afpId || ''"
      variant="outlined"
      clearable
      density="compact"
      :loading="loadingEntidades"
    >
      <template #append-inner>
        <div :key="certStatusKey?.('afp')" class="append-icons">
          <v-tooltip text="ADMINISTRADORA DE FONDO DE PENSIONES" location="top">
            <template #activator="{ props }">
              <v-icon v-bind="props" icon="mdi-help-circle-outline" size="18" class="ml-1 text-medium-emphasis" />
            </template>
          </v-tooltip>

          <v-tooltip v-if="hasCertUI?.('afp')" text="Archivo cargado" location="top">
            <template #activator="{ props }">
              <v-icon v-bind="props" size="18" color="success" class="ml-1">mdi-check-circle</v-icon>
            </template>
          </v-tooltip>

          <v-tooltip :text="hasCertUI?.('afp') ? 'Ver/Reemplazar certificado AFP' : 'Subir certificado AFP'" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="mdi-paperclip" size="small" variant="text" class="ml-1" :disabled="!afpId" :ripple="false" @click.stop="emit('openCert','afp',$event)" />
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
        <div :key="certStatusKey?.('afc')" class="append-icons">
          <v-tooltip text="ADMINISTRADORA DE FONDO DE CESANTÍAS" location="top">
            <template #activator="{ props }">
              <v-icon v-bind="props" icon="mdi-help-circle-outline" size="18" class="ml-1 text-medium-emphasis" />
            </template>
          </v-tooltip>

          <v-tooltip v-if="hasCertUI?.('afc')" text="Archivo cargado" location="top">
            <template #activator="{ props }">
              <v-icon v-bind="props" size="18" color="success" class="ml-1">mdi-check-circle</v-icon>
            </template>
          </v-tooltip>

          <v-tooltip :text="hasCertUI?.('afc') ? 'Ver/Reemplazar certificado AFC' : 'Subir certificado AFC'" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="mdi-paperclip" size="small" variant="text" class="ml-1" :disabled="!afcId" :ripple="false" @click.stop="emit('openCert','afc',$event)" />
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
      :error-messages="errors?.ccfId || ''"
      variant="outlined"
      clearable
      density="compact"
      :loading="loadingEntidades"
    >
      <template #append-inner>
        <div :key="certStatusKey?.('ccf')" class="append-icons">
          <v-tooltip text="CAJA DE COMPENSACIÓN FAMILIAR" location="top">
            <template #activator="{ props }">
              <v-icon v-bind="props" icon="mdi-help-circle-outline" size="18" class="ml-1 text-medium-emphasis" />
            </template>
          </v-tooltip>

          <v-tooltip v-if="hasCertUI?.('ccf')" text="Archivo cargado" location="top">
            <template #activator="{ props }">
              <v-icon v-bind="props" size="18" color="success" class="ml-1">mdi-check-circle</v-icon>
            </template>
          </v-tooltip>

          <v-tooltip :text="hasCertUI?.('ccf') ? 'Ver/Reemplazar certificado CCF' : 'Subir certificado CCF'" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="mdi-paperclip" size="small" variant="text" class="ml-1" :disabled="!ccfId" :ripple="false" @click.stop="emit('openCert','ccf',$event)" />
            </template>
          </v-tooltip>
        </div>
      </template>
    </v-select>
  </v-col>
</template>
       <!-- Recomendaciones Médicas (ocultar para asesor convenio) -->
  <template v-if="!esAsesorConvenio">
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
              <template #activator="{ props }">
                <v-icon v-bind="props" size="18" color="success" class="ml-1">
                  mdi-check-circle
                </v-icon>
              </template>
            </v-tooltip>

            <v-tooltip
              :text="recTieneArchivo ? 'Ver/Reemplazar Recomendación Médica' : 'Subir Recomendación Médica'"
              location="top"
            >
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-paperclip"
                  size="small"
                  variant="text"
                  class="ml-1"
                  :disabled="!tieneRecomendacionesMedicas"
                  :ripple="false"
                  @click.stop="emit('openRec')"
                />
              </template>
            </v-tooltip>
          </div>
        </template>
      </v-text-field>

      <div
        class="text-caption text-medium-emphasis mb-3"
        v-if="tieneRecomendacionesMedicas"
      >
        Formatos permitidos: PDF, DOC, DOCX (máx {{ maxUploadMb }} MB)
      </div>
    </v-col>
  </template>
</v-row>
</v-form>
</template>


<script setup lang="ts">
/* Models (v-model:* desde el padre) */
const identificacion             = defineModel<string>('identificacion')
const terminoContrato            = defineModel<'fijo'|'obra_o_labor_determinada'|'indefinido'|null>('terminoContrato')
const sedeId                     = defineModel<number|null>('sedeId')
const cargoId                    = defineModel<number|null>('cargoId')
const salarioBasico              = defineModel<number | ''>('salarioBasico')
const bonoSalarial               = defineModel<number | ''>('bonoSalarial')
const auxilioTransporte          = defineModel<number | ''>('auxilioTransporte')
const auxilioNoSalarial          = defineModel<number | ''>('auxilioNoSalarial')
const fechaInicio                = defineModel<string>('fechaInicio')
const fechaTerminacion           = defineModel<string>('fechaTerminacion')
const centroCosto                = defineModel<string>('centroCosto')
const funcionesCargo             = defineModel<string>('funcionesCargo')
const epsId                      = defineModel<number|null>('epsId')
const arlId                      = defineModel<number|null>('arlId')
const afpId                      = defineModel<number|null>('afpId')
const afcId                      = defineModel<number|null>('afcId')
const ccfId                      = defineModel<number|null>('ccfId')
const tieneRecomendacionesMedicas= defineModel<boolean>('tieneRecomendacionesMedicas')

/* Props de solo lectura y helpers */
const props = defineProps<{
terminosContratoOptions: ReadonlyArray<{ text: string; value: string }>
  sedes: Array<{ id:number; nombre:string }>
  cargos: Array<{ id:number; nombre:string }>
  filteredEps: Array<{ id:number; nombre:string }>
  filteredArl: Array<{ id:number; nombre:string }>
  filteredAfp: Array<{ id:number; nombre:string }>
  filteredAfc: Array<{ id:number; nombre:string }>
  filteredCcf: Array<{ id:number; nombre:string }>
  centrosCostoOptions: string[]
  loadingSedes: boolean
  loadingCargos: boolean
  loadingEntidades: boolean
  isFechaTerminacionVisible: boolean
  isFechaTerminacionRequired: boolean
  salarioTotalCalculado: string
  maxUploadMb: number
  maxMoney: number
  recTieneArchivo: boolean
  recNombreActual: string
  recUiKey: string | number
  hasCertUI?: (t:'eps'|'arl'|'afp'|'afc'|'ccf') => boolean
  certStatusKey?: (t:'eps'|'arl'|'afp'|'afc'|'ccf') => string
  esAsesorConvenio?: boolean
  errors?: Partial<Record<
    'identificacion'|'terminoContrato'|'sedeId'|'cargoId'|'fechaInicio'|'fechaTerminacion'|'funcionesCargo'|'epsId'|'arlId'|'afpId'|'ccfId'|'salarioBasico',
    string | string[]
  >>
}>()

const emit = defineEmits<{
  (e:'openCert', t:'eps'|'arl'|'afp'|'afc'|'ccf', ev?: MouseEvent): void
  (e:'openRec'): void
}>()
</script>

<style scoped>
.form { display:flex; flex-direction:column; gap:16px; }
.append-icons { display:flex; align-items:center; gap:6px; }
</style>
