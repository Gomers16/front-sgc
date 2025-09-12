<template>
  <v-card elevation="2" class="mb-6">
    <v-card-text>
      <v-row>
        <!-- Razón social -->
        <v-col cols="12" md="4">
          <v-select
            :model-value="razonSocial"
            @update:model-value="(v) => emit('update:razonSocial', (v ?? null) as number | null)"
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

        <!-- Usuario -->
        <v-col cols="12" md="4">
          <v-select
            :model-value="usuario"
            @update:model-value="(v) => emit('update:usuario', (v ?? null) as number | null)"
            :items="usuarios"
            label="Seleccione un Usuario"
            item-title="nombreCompleto"
            item-value="id"
            variant="outlined"
            density="compact"
            :disabled="!razonSocial"
            :loading="loadingUsuarios"
            clearable
          />
        </v-col>

        <!-- Tipo de contrato -->
        <v-col cols="12" md="4">
          <v-select
            :model-value="tipoContrato ?? null"
            @update:model-value="(v) => emit('update:tipoContrato', (v ?? null) as TipoContrato | null)"
            :items="tiposContratoSelectItems"
            label="Seleccione un tipo de contrato"
            item-title="nombre"
            item-value="valor"
            variant="outlined"
            density="compact"
            :disabled="!usuario || isEditing"
            clearable
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
type TipoContrato = 'prestacion'|'temporal'|'laboral'|'aprendizaje'
interface ItemRS { id:number; nombre:string }
interface ItemUser { id:number; nombres:string; apellidos:string; nombreCompleto?:string }

/* ✅ Declara props con defaults, sin asignarlas a una variable */
withDefaults(defineProps<{
  // models
  razonSocial: number | null
  usuario: number | null
  tipoContrato: TipoContrato | null | undefined

  // data
  razonesSociales: ItemRS[]
  usuarios: ItemUser[]
  tiposContratoSelectItems: Array<{ nombre:string; valor:TipoContrato }>

  // flags
  loadingRazonesSociales?: boolean
  loadingUsuarios?: boolean
  isEditing?: boolean
}>(), {
  loadingRazonesSociales: false,
  loadingUsuarios: false,
  isEditing: false,
})

const emit = defineEmits<{
  (e:'update:razonSocial', v:number|null): void
  (e:'update:usuario', v:number|null): void
  (e:'update:tipoContrato', v:TipoContrato|null): void  // normalizado, sin undefined
}>()
</script>
