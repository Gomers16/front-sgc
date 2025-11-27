<template>
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
            :href="contratoEditArchivoUrl ? toAbsoluteApiUrl(contratoEditArchivoUrl) : undefined"
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
        @update:model-value="(v) => emit('update:archivoContrato', v)"
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
        Formato permitido: PDF (máx {{ maxUploadMb }} MB)
      </div>

      <v-alert
  v-if="!archivoContrato && !(isEditing && contratoEditTieneArchivo)"
  type="info"
  variant="tonal"
>
  {{
    isEditing
      ? 'Si no cargas archivo, se mantiene el actual.'
      : (esAsesorConvenio
          ? 'El archivo es opcional para ASESOR CONVENIO.'
          : 'Adjunte el archivo del contrato para anexarlo al usuario.')
  }}
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

    <!-- 🔘 Acciones de anexado/creación -->
    <v-card-actions class="d-flex justify-end pr-0 pb-0 mt-4">
      <!-- MODO EDICIÓN: el botón de guardar cambios está en la vista padre -->
      <template v-if="isEditing">
        <!-- sin acciones aquí -->
      </template>

      <!-- MODO CREACIÓN -->
      <template v-else>
       <v-btn
  color="success"
  :prepend-icon="contratoPendienteAnexoId ? 'mdi-reload' : 'mdi-content-save-check'"
  :disabled="!usuarioSeleccionado || (!esAsesorConvenio && !archivoContrato) || isSaving"
  :loading="isSaving"
  @click="emit('crearYAnexar')"
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
          @click="emit('reanexar')"
        >
          Reintentar anexar ahora
        </v-btn>
      </template>
    </v-card-actions>
  </v-col>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  // estado global relevante
  isEditing: boolean
  isSaving: boolean
  usuarioSeleccionado: number | null

  // archivo en memoria
  archivoContrato: File | null

  // render keys
  fileBlockKey: number
  fileInputRenderKey: number

  // info contrato edit
  contratoEditTieneArchivo: boolean
  contratoEditArchivoUrl: string | null
  contratoEditNombreArchivo: string

  // reintentos
  contratoPendienteAnexoId: number | null

 // límites
  maxUploadMb: number

  // helper url
  toAbsoluteApiUrl: (path?: string) => string

  // ✅ NUEVO
  esAsesorConvenio?: boolean
}>()
const emit = defineEmits<{
  (e:'update:archivoContrato', v: File | File[] | null): void
  (e:'crearYAnexar'): void
  (e:'reanexar'): void
}>()

const fileInputRef = ref<{ reset?: () => void } | null>(null)
</script>

<style scoped>
/* nada extra por ahora */
</style>
