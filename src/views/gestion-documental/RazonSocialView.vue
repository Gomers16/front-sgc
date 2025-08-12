<template>
  <v-container class="py-6">
    <v-card elevation="4" class="mb-6">
      <v-card-title class="text-h5 font-weight-bold">
        Usuarios - Razón Social: {{ razonSocialNombre }}
      </v-card-title>
    </v-card>

    <v-skeleton-loader v-if="loading" type="table" />

    <v-data-table
      v-else
      :headers="headers"
      :items="usuarios"
      item-value="id"
      class="elevation-1"
      :items-per-page="10"
      no-data-text="No hay usuarios disponibles para esta razón social"
    >
      <template #item.nombres="{ item }">
        <v-btn variant="text" color="primary" @click="confirmarVerPerfil(item.id)">
          {{ item.nombres }} {{ item.apellidos }}
        </v-btn>
      </template>

      <!-- 👇 Ahora muestra TODOS los cargos (únicos) en vertical -->
      <template #item.cargo="{ item }">
        <div v-if="cargosDelUsuario(item).length">
          <div v-for="(cargo, index) in cargosDelUsuario(item)" :key="index">
            {{ cargo }}
          </div>
        </div>
        <div v-else>
          Sin cargo
        </div>
      </template>

      <template #item.contratos="{ item }">
        <div v-if="item.contratos && item.contratos.length">
          <div
            v-for="contrato in item.contratos"
            :key="contrato.id"
            :class="{
              'text-success': contrato.estado === 'activo',
              'text-grey': contrato.estado !== 'activo'
            }"
          >
            {{ contrato.tipoContrato }}
          </div>
        </div>
        <div v-else class="text-grey">Sin contratos</div>
      </template>

      <template #item.acciones="{ item }">
        <v-btn color="info" variant="tonal" @click="abrirModalContratos(item.id, `${item.nombres} ${item.apellidos}`)">
          Ver Contratos
        </v-btn>
      </template>
    </v-data-table>

    <!-- Modal confirmación perfil -->
    <v-dialog v-model="mostrarModalPerfil" max-width="500">
      <v-card>
        <v-card-title class="text-h6">Confirmar Navegación</v-card-title>
        <v-card-text>¿Estás seguro de que quieres ver el perfil de este usuario?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="mostrarModalPerfil = false">
            Cancelar
          </v-btn>
          <v-btn color="primary" variant="flat" @click="verPerfilConfirmado">
            Confirmar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal contratos -->
    <v-dialog v-model="modalContratosUsuario.mostrar" max-width="800">
      <v-card>
        <v-card-title class="text-h6">
          Contratos de {{ modalContratosUsuario.nombreUsuario }}
        </v-card-title>
        <v-card-text>
          <v-alert v-if="contratoStore.loading" type="info" variant="tonal" class="mb-4">
            Cargando contratos...
          </v-alert>
          <v-alert v-else-if="contratoStore.error" type="error" variant="tonal" class="mb-4">
            Error: {{ contratoStore.error }}
          </v-alert>
          <v-list v-else-if="contratosDelUsuarioSeleccionado.length">
            <v-list-item
              v-for="contrato in contratosDelUsuarioSeleccionado"
              :key="contrato.id"
              class="mb-4"
              :class="{
                'bg-green-lighten-5': contrato.estado === 'activo',
                'bg-grey-lighten-4': contrato.estado !== 'activo'
              }"
            >
              <v-list-item-title class="font-weight-bold">
                Tipo: {{ contrato.tipoContrato }} ({{ contrato.estado === 'activo' ? 'Activo' : 'Inactivo' }})
              </v-list-item-title>
              <v-list-item-subtitle>
                Inicio: {{ new Date(contrato.fechaInicio).toLocaleDateString() }}
                <span v-if="contrato.fechaFin"> - Fin: {{ new Date(contrato.fechaFin).toLocaleDateString() }}</span>
              </v-list-item-subtitle>

              <v-list-item-subtitle v-if="contrato.cargo?.nombre">
                Cargo: <strong>{{ contrato.cargo.nombre }}</strong>
              </v-list-item-subtitle>

              <v-list-item-subtitle v-if="contrato.nombreArchivoContratoFisico">
                Archivo:
                <a :href="contrato.rutaArchivoContratoFisico" target="_blank" class="text-primary">
                  {{ contrato.nombreArchivoContratoFisico }}
                  <v-icon size="small" class="ml-1">mdi-file-document</v-icon>
                </a>
              </v-list-item-subtitle>
              <v-list-item-subtitle v-else class="text-red-lighten-1">
                (Sin archivo físico adjunto)
              </v-list-item-subtitle>

              <v-divider class="my-2"></v-divider>

              <!-- Trazabilidad -->
              <h4 class="text-subtitle-1 mt-2 mb-1">Trazabilidad del Contrato:</h4>
              <div v-for="stageName in ['Inicio', 'Desarrollo', 'Fin']" :key="stageName" class="mb-2">
                <h5 class="text-subtitle-2 font-weight-medium ml-2">{{ stageName }}:</h5>

                <template v-if="getPasosByStage(contrato.pasos, stageName).length > 0">
                  <v-list-item
                    v-for="paso in getPasosByStage(contrato.pasos, stageName)"
                    :key="`paso-${paso.id}`"
                    density="compact"
                    class="ml-4"
                  >
                    <v-list-item-title>
                      <v-icon :color="paso.completado ? 'success' : 'grey'" size="small" class="mr-2">
                        {{ paso.completado ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                      </v-icon>
                      {{ paso.nombrePaso }}
                    </v-list-item-title>
                    <v-list-item-subtitle v-if="paso.observacion">
                      Observación: {{ paso.observacion }}
                    </v-list-item-subtitle>
                    <v-list-item-subtitle v-if="paso.archivoUrl">
                      Adjunto:
                      <a :href="paso.archivoUrl" target="_blank" class="text-primary">
                        Ver archivo
                        <v-icon size="x-small" class="ml-1">mdi-file-document</v-icon>
                      </a>
                    </v-list-item-subtitle>
                    <v-list-item-subtitle v-if="paso.fecha">
                      Completado: {{ new Date(paso.fecha).toLocaleDateString() }}
                    </v-list-item-subtitle>
                  </v-list-item>
                </template>

                <template v-if="getEventsByStage(contrato.eventos, stageName).length > 0">
                  <v-list-item
                    v-for="evento in getEventsByStage(contrato.eventos, stageName)"
                    :key="`evento-${evento.id}`"
                    density="compact"
                    class="ml-4"
                  >
                    <v-list-item-title class="font-weight-medium">
                      <v-icon size="small" class="mr-2">mdi-calendar-alert</v-icon>
                      Evento: {{ evento.tipo }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      Inicio: {{ new Date(evento.fechaInicio).toLocaleDateString() }}
                      <span v-if="evento.fechaFin"> - Fin: {{ new Date(evento.fechaFin).toLocaleDateString() }}</span>
                    </v-list-item-subtitle>
                    <v-list-item-subtitle v-if="evento.descripcion">
                      Descripción: {{ evento.descripcion }}
                    </v-list-item-subtitle>
                    <v-list-item-subtitle v-if="evento.documentoUrl">
                      Documento:
                      <a :href="evento.documentoUrl" target="_blank" class="text-primary">
                        Ver Documento
                        <v-icon size="x-small" class="ml-1">mdi-file-document</v-icon>
                      </a>
                    </v-list-item-subtitle>
                  </v-list-item>
                </template>

                <template v-if="stageName === 'Fin' && contrato.estado === 'inactivo'">
                  <v-list-item density="compact" class="ml-4">
                    <v-list-item-title class="font-weight-medium text-error">
                      <v-icon size="small" class="mr-2 text-error">mdi-close-circle</v-icon>
                      Contrato finalizado
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      Fecha de finalización: {{ new Date(contrato.fechaFin!).toLocaleDateString() }}
                    </v-list-item-subtitle>
                    <v-list-item-subtitle>
                      Motivo: {{ contrato.motivoFinalizacion || 'No especificado' }}
                    </v-list-item-subtitle>
                  </v-list-item>
                </template>

                <v-list-item
                  v-if="
                    getPasosByStage(contrato.pasos, stageName).length === 0 &&
                    getEventsByStage(contrato.eventos, stageName).length === 0 &&
                    !(stageName === 'Fin' && contrato.estado === 'inactivo')
                  "
                  density="compact"
                  class="ml-4 text-grey"
                >
                  Sin ítems para esta etapa.
                </v-list-item>
              </div>

              <v-btn
                color="primary"
                variant="tonal"
                size="small"
                class="mt-4"
                prepend-icon="mdi-pencil"
                @click="irAEditarPasos(contrato.id)"
              >
                Editar Pasos
              </v-btn>
            </v-list-item>
          </v-list>
          <v-alert v-else type="info" variant="tonal">
            No hay contratos registrados para este usuario.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="modalContratosUsuario.mostrar = false">
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchUsuariosPorRazonSocial } from '@/services/razonSocialService';
import { useContratoStore } from '@/stores/contrato';

interface ContratoPaso {
  id: number;
  contratoId: number;
  fase: string;
  nombrePaso: string;
  fecha?: string;
  archivoUrl?: string;
  observacion?: string;
  orden: number;
  completado: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ContratoEvento {
  id: number;
  contratoId: number;
  tipo: string;
  subtipo?: string;
  fechaInicio: string;
  fechaFin?: string;
  descripcion?: string;
  documentoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface Contrato {
  id: number;
  tipoContrato: 'prestacion' | 'temporal' | 'laboral';
  estado: string;
  fechaInicio: string;
  fechaFin?: string;
  motivoFinalizacion?: string;
  nombreArchivoContratoFisico?: string;
  rutaArchivoContratoFisico?: string;
  usuarioId: number;
  pasos?: ContratoPaso[];
  eventos?: ContratoEvento[];
  cargo?: {
    nombre: string;
  };
}

interface UsuarioConContratos {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  cargo?: { nombre: string };
  rol?: { nombre: string };
  contratos?: Contrato[];
  nombreCompleto: string;
}

const route = useRoute();
const router = useRouter();
const contratoStore = useContratoStore();

const razonSocialId = ref(route.params.id as string);
const razonSocialNombre = ref('');
const loading = ref(true);
const usuarios = ref<UsuarioConContratos[]>([]);

const mostrarModalPerfil = ref(false);
const usuarioIdParaPerfil = ref<number | null>(null);

const modalContratosUsuario = ref({
  mostrar: false,
  usuarioId: null as number | null,
  nombreUsuario: '' as string,
});

const mapNombres: Record<string, string> = {
  '1': 'CDA del Centro',
  '2': 'Activautos',
  '3': 'JEF & CO',
  '4': 'Activa Marketing',
};

const headers = [
  { title: 'Nombre', value: 'nombres' },
  { title: 'Cargo', value: 'cargo' },
  { title: 'Contratos', value: 'contratos' },
  { title: 'Acciones', value: 'acciones', sortable: false },
];

const contratosDelUsuarioSeleccionado = computed(() => {
  if (modalContratosUsuario.value.usuarioId) {
    return contratoStore
      .getContratosByUsuarioId(modalContratosUsuario.value.usuarioId)
      .sort((a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime());
  }
  return [];
});

function getPasosByStage(pasos: ContratoPaso[] | undefined, stage: string): ContratoPaso[] {
  if (!pasos) return [];
  return pasos.filter((paso) => paso.fase.toLowerCase() === stage.toLowerCase());
}

function getEventsByStage(eventos: ContratoEvento[] | undefined, stage: string): ContratoEvento[] {
  if (!eventos) return [];
  if (stage.toLowerCase() === 'desarrollo') {
    const desarrolloEventos = ['incapacidad', 'suspension', 'licencia', 'permiso', 'vacaciones', 'cesantias', 'disciplinario'];
    return eventos.filter((evento) => desarrolloEventos.includes(evento.tipo));
  }
  if (stage.toLowerCase() === 'fin') {
    return eventos.filter((evento) => evento.tipo === 'terminacion');
  }
  return [];
}

async function cargarUsuarios() {
  loading.value = true;
  try {
    const data = await fetchUsuariosPorRazonSocial(razonSocialId.value);
    usuarios.value = data.map((u: any) => ({
      ...u,
      nombreCompleto: `${u.nombres} ${u.apellidos}`,
    })) as UsuarioConContratos[];
  } catch (error: unknown) {
    console.error('Error al cargar usuarios:', error instanceof Error ? error.message : error);
    usuarios.value = [];
  } finally {
    loading.value = false;
  }
}

function confirmarVerPerfil(usuarioId: number) {
  usuarioIdParaPerfil.value = usuarioId;
  mostrarModalPerfil.value = true;
}

function verPerfilConfirmado() {
  if (usuarioIdParaPerfil.value !== null) {
    router.push({ name: 'UserProfile', params: { id: usuarioIdParaPerfil.value.toString() } });
  }
  mostrarModalPerfil.value = false;
  usuarioIdParaPerfil.value = null;
}

async function abrirModalContratos(usuarioId: number, nombreUsuario: string) {
  modalContratosUsuario.value.usuarioId = usuarioId;
  modalContratosUsuario.value.nombreUsuario = nombreUsuario;
  modalContratosUsuario.value.mostrar = true;

  try {
    await contratoStore.fetchContratosPorUsuario(usuarioId);
  } catch (error) {
    console.error('Error al cargar contratos para el usuario:', error);
  }
}

function irAEditarPasos(contratoId: number) {
  router.push(`/gestion-documental/contrato/${contratoId}/editar-pasos`);
  modalContratosUsuario.value.mostrar = false;
}

/**
 * Devuelve todos los cargos únicos en un arreglo para mostrarlos en vertical.
 */
function cargosDelUsuario(user: UsuarioConContratos): string[] {
  const contratos = user.contratos || [];
  if (!contratos.length) {
    return user.cargo?.nombre ? [user.cargo.nombre] : [];
  }

  const cargosContratos = contratos
    .map((c) => c.cargo?.nombre)
    .filter((nombre): nombre is string => !!nombre && nombre.trim() !== '');

  if (cargosContratos.length > 0) {
    return [...new Set(cargosContratos)];
  }

  return user.cargo?.nombre ? [user.cargo.nombre] : [];
}

onMounted(() => {
  razonSocialNombre.value = mapNombres[razonSocialId.value] || 'Razón Social';
  if (razonSocialId.value) {
    cargarUsuarios();
  }
});

watch(
  () => route.params.id,
  (newId) => {
    razonSocialId.value = newId as string;
    razonSocialNombre.value = mapNombres[newId as string] || 'Razón Social';
    if (razonSocialId.value) {
      cargarUsuarios();
    }
  }
);
</script>

<style scoped>
.text-success {
  color: green;
  font-weight: bold;
}
.text-grey {
  color: gray;
}
.bg-green-lighten-5 {
  background-color: #e8f5e9;
}
.bg-grey-lighten-4 {
  background-color: #f5f5f5;
}
</style>
