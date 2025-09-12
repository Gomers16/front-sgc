<template>
  <v-card elevation="2" class="mt-6">
    <v-card-title class="text-h6 font-weight-bold bg-blue-grey-lighten-5">
      Historial de Contratos del Usuario
    </v-card-title>

    <v-card-text>
      <v-alert v-if="loading" type="info" variant="tonal" class="mb-4">
        Cargando historial de contratos...
      </v-alert>

      <v-alert
        v-else-if="!loading && (!contratos || contratos.length === 0)"
        type="warning"
        variant="tonal"
        class="mb-4"
      >
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
          <tr v-for="(c, i) in contratos" :key="c.id">
            <td>{{ i + 1 }}</td>
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
                  :href="toAbsolute(c.rutaArchivoContratoFisico)"
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
                @click="emit('editar', c)"
              >Editar</v-btn>

              <v-btn
                size="x-small"
                :color="c.estado === 'activo' ? 'error' : 'success'"
                variant="tonal"
                :prepend-icon="c.estado === 'activo' ? 'mdi-cancel' : 'mdi-check-circle'"
                @click="emit('toggleEstado', c)"
              >{{ c.estado === 'activo' ? 'Inactivar' : 'Activar' }}</v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
type SedeLite = { id:number; nombre:string } | null | undefined
type CargoLite = { id:number; nombre:string } | null | undefined

type ContratoRow = {
  id: number
  tipoContrato: string
  terminoContrato: string | null
  estado: 'activo' | 'inactivo'
  fechaInicio: string
  fechaTerminacion: string | null
  sede?: SedeLite
  cargo?: CargoLite
  rutaArchivoContratoFisico?: string | null
}

const props = defineProps<{
  contratos: ContratoRow[]
  loading: boolean
  toAbsoluteApiUrl: (path?: string) => string
}>()

const emit = defineEmits<{
  (e:'editar', c:ContratoRow): void
  (e:'toggleEstado', c:ContratoRow): void
}>()

function toAbsolute(path?: string | null) {
  return path ? props.toAbsoluteApiUrl(path) : ''
}
</script>

<style scoped>
.v-table th, .v-table td { vertical-align: middle; }
.text-capitalize { text-transform: capitalize; }
</style>
