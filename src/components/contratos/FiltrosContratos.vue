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

        <!-- Usuario con búsqueda por nombre -->
        <v-col cols="12" md="4">
          <v-autocomplete
            :model-value="usuario"
            @update:model-value="(v) => emit('update:usuario', (v ?? null) as number | null)"
            :items="usuariosOrdenados"
            label="Buscar usuario por nombre..."
            item-title="nombreCompleto"
            item-value="id"
            variant="outlined"
            density="compact"
            :disabled="!razonSocial"
            :loading="loadingUsuarios"
            clearable
            no-data-text="No se encontraron usuarios"
            :filter="filtrarUsuario"
          >
            <template #prepend-inner>
              <v-icon size="18" class="text-medium-emphasis">mdi-magnify</v-icon>
            </template>

            <template #item="{ item, props: itemProps }">
              <v-list-item v-bind="itemProps">
                <template #prepend>
                  <v-avatar size="28" color="blue-grey-lighten-4" class="mr-2">
                    <span class="text-caption font-weight-bold">
                      {{ iniciales(item.raw) }}
                    </span>
                  </v-avatar>
                </template>
              </v-list-item>
            </template>
          </v-autocomplete>
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
import { computed } from 'vue'

type TipoContrato = 'prestacion' | 'temporal' | 'laboral' | 'aprendizaje'

interface ItemRS { id: number; nombre: string }
interface ItemUser { id: number; nombres: string; apellidos: string; nombreCompleto?: string }

const props = withDefaults(defineProps<{
  razonSocial: number | null
  usuario: number | null
  tipoContrato: TipoContrato | null | undefined
  razonesSociales: ItemRS[]
  usuarios: ItemUser[]
  tiposContratoSelectItems: Array<{ nombre: string; valor: TipoContrato }>
  loadingRazonesSociales?: boolean
  loadingUsuarios?: boolean
  isEditing?: boolean
}>(), {
  loadingRazonesSociales: false,
  loadingUsuarios: false,
  isEditing: false,
})

const emit = defineEmits<{
  (e: 'update:razonSocial', v: number | null): void
  (e: 'update:usuario', v: number | null): void
  (e: 'update:tipoContrato', v: TipoContrato | null): void
}>()

/** Garantiza que nombreCompleto siempre esté presente y ordena alfabéticamente */
const usuariosOrdenados = computed(() =>
  [...props.usuarios]
    .map(u => ({
      ...u,
      nombreCompleto: u.nombreCompleto || `${u.nombres ?? ''} ${u.apellidos ?? ''}`.trim(),
    }))
    .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, 'es'))
)

/** Filtro personalizado: busca en nombres, apellidos y nombreCompleto */
function filtrarUsuario(item: { raw: ItemUser }, queryText: string): boolean {
  const q = queryText.trim().toLowerCase()
  if (!q) return true
  const u = item.raw
  const full = `${u.nombres ?? ''} ${u.apellidos ?? ''} ${u.nombreCompleto ?? ''}`.toLowerCase()
  return full.includes(q)
}

/** Iniciales para el avatar */
function iniciales(u: ItemUser): string {
  const n = (u.nombres ?? '').trim()
  const a = (u.apellidos ?? '').trim()
  return `${n.charAt(0)}${a.charAt(0)}`.toUpperCase() || '?'
}
</script>
