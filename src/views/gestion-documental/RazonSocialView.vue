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

      <!-- Cargos (únicos) en vertical -->
      <template #item.cargo="{ item }">
        <div v-if="cargosDelUsuario(item).length">
          <div v-for="(cargo, index) in cargosDelUsuario(item)" :key="index">
            {{ cargo }}
          </div>
        </div>
        <div v-else>Sin cargo</div>
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
        <v-btn color="info" variant="tonal"
               @click="abrirModalContratos(item.id, `${item.nombres} ${item.apellidos}`)">
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

    <!-- ================== MODAL: VER CONTRATOS ================== -->
    <v-dialog
      v-model="showContratosDialog"
      max-width="1000"
      :retain-focus="false"
    >
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-file-document-outline</v-icon>
          Contratos de {{ modalContratosUsuario.nombreUsuario }}
          <v-spacer />
          <template v-if="selectedContrato">
            <v-btn
              v-if="selectedContrato.rutaArchivoContratoFisico"
              size="small"
              variant="tonal"
              color="primary"
              prepend-icon="mdi-file-download-outline"
              @click="downloadFile(
                selectedContrato.rutaArchivoContratoFisico,
                selectedContrato.nombreArchivoContratoFisico || `Contrato_${selectedContrato.id}`
              )"
              class="mr-2"
            >
              Descargar contrato
            </v-btn>

            <!-- 👉 abre UserProfile con el contrato y pestaña actual -->
            <v-btn
              size="small"
              variant="tonal"
              color="secondary"
              prepend-icon="mdi-account-edit"
              @click="irAContratoEnPerfilDesdeModal()"
            >
              Editar en perfil
            </v-btn>
          </template>
          <v-btn icon @click="showContratosDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text>
          <v-alert v-if="contratoStore.loading" type="info" variant="tonal" class="mb-4">
            Cargando contratos...
          </v-alert>
          <v-alert v-else-if="contratoStore.error" type="error" variant="tonal" class="mb-4">
            Error: {{ contratoStore.error }}
          </v-alert>

          <template v-else>
            <div v-if="contratosDelUsuarioSeleccionado.length">
              <v-select
                class="mb-4"
                v-model="modalContratosUsuario.selectedId"
                :items="contratosDelUsuarioSeleccionado.map(c => ({
                  title: `Contrato #${c.id} — ${c.tipoContrato}`,
                  value: c.id
                }))"
                label="Selecciona un contrato"
                variant="outlined"
                density="comfortable"
                @update:modelValue="modalContratosUsuario.tab = 'inicio'"
              />

              <div v-if="selectedContrato">
                <div class="d-flex align-center mb-2">
                  <v-chip
                    :color="(selectedContrato.estado || '').toLowerCase() === 'activo'
                      ? 'success'
                      : 'error'"
                    class="font-weight-bold mr-2"
                    small
                  >
                    {{ selectedContrato.estado }}
                  </v-chip>
                  <span class="text-caption">Tipo: {{ selectedContrato.tipoContrato }}</span>
                </div>

                <!-- Tabs: Inicio / Desarrollo / Fin / Historial -->
                <v-tabs v-model="modalContratosUsuario.tab" color="primary" align-tabs="center" class="mb-2">
                  <v-tab value="inicio">Inicio</v-tab>
                  <v-tab value="desarrollo">Desarrollo</v-tab>
                  <v-tab value="fin">Fin</v-tab>
                  <v-tab value="historial">Historial</v-tab>
                </v-tabs>

                <v-window v-model="modalContratosUsuario.tab" class="pa-2">
                  <!-- INICIO (Pasos) -->
                  <v-window-item value="inicio">
                    <h4 class="text-h6 font-weight-bold mb-3 text-blue-grey-darken-2">
                      Pasos de Inicio del Contrato
                    </h4>

                    <div v-if="selectedContrato.pasos?.length">
                      <v-timeline side="end" density="compact">
                        <v-timeline-item
                          v-for="paso in selectedContrato.pasos"
                          :key="paso.id"
                          dot-color="success"
                          size="small"
                        >
                          <div class="d-flex justify-space-between align-center mb-1">
                            <span class="font-weight-bold text-subtitle-1">
                              {{ paso.nombrePaso }}
                              <span v-if="paso.fase">({{ paso.fase }})</span>
                            </span>
                            <span class="text-caption text-grey-darken-1">
                              {{ paso.fecha ? new Date(paso.fecha).toLocaleDateString('es-CO') : 'Sin fecha' }}
                            </span>
                          </div>

                          <div class="text-body-2 text-grey-darken-2">
                            {{ paso.observacion || 'Sin observación' }}
                          </div>

                          <div v-if="paso.archivoUrl" class="mt-2 d-flex ga-2">
                            <a
                              :href="absoluteUrl(paso.archivoUrl)"
                              target="_blank"
                              class="text-caption d-flex align-center text-primary"
                            >
                              <v-icon size="small" class="mr-1">mdi-file-eye-outline</v-icon>
                              Ver archivo
                            </a>
                            <v-btn
                              size="small"
                              variant="text"
                              prepend-icon="mdi-download"
                              @click="downloadFile(paso.archivoUrl, guessFileName(paso.archivoUrl, 'paso-archivo'))"
                            >
                              Descargar
                            </v-btn>
                          </div>
                        </v-timeline-item>
                      </v-timeline>
                    </div>
                    <div v-else class="text-center text-subtitle-1 text-grey-darken-1 pa-4">
                      No hay pasos registrados para este contrato.
                    </div>
                  </v-window-item>

                  <!-- DESARROLLO (Eventos) -->
                  <v-window-item value="desarrollo">
                    <h4 class="text-h6 font-weight-bold mb-3 text-blue-grey-darken-2">
                      Eventos durante el Contrato
                    </h4>

                    <div v-if="selectedContrato.eventos?.length">
                      <v-timeline side="end" density="compact">
                        <v-timeline-item
                          v-for="evento in selectedContrato.eventos"
                          :key="evento.id"
                          dot-color="primary"
                          size="small"
                        >
                          <div class="d-flex justify-space-between align-center mb-1">
                            <span class="font-weight-bold text-subtitle-1">{{ evento.tipo }}</span>
                            <span class="text-caption text-grey-darken-1">
                              {{ new Date(evento.createdAt || evento.fechaInicio).toLocaleDateString('es-CO') }}
                            </span>
                          </div>

                          <div class="text-body-2 text-grey-darken-2">
                            {{ evento.descripcion || 'Sin descripción' }}
                          </div>

                          <div class="mt-2 d-flex ga-2">
                            <template v-if="evento.documentoUrl">
                              <a
                                :href="absoluteUrl(evento.documentoUrl)"
                                target="_blank"
                                class="text-caption d-flex align-center text-primary"
                              >
                                <v-icon size="small" class="mr-1">mdi-file-eye-outline</v-icon>
                                Ver
                              </a>
                              <v-btn
                                size="small"
                                variant="text"
                                prepend-icon="mdi-download"
                                @click="downloadFile(
                                  evento.documentoUrl,
                                  guessFileName(evento.documentoUrl, 'evento-documento')
                                )"
                              >
                                Descargar
                              </v-btn>
                            </template>
                          </div>
                        </v-timeline-item>
                      </v-timeline>
                    </div>
                    <div v-else class="text-center text-subtitle-1 text-grey-darken-1 pa-4">
                      No hay eventos registrados para este contrato.
                    </div>
                  </v-window-item>

                  <!-- FIN -->
                  <v-window-item value="fin">
                    <h4 class="text-h6 font-weight-bold mb-3 text-blue-grey-darken-2">
                      Finalización del Contrato
                    </h4>

                    <div v-if="(selectedContrato.estado || '').toLowerCase() === 'inactivo'">
                      <v-alert type="info" variant="tonal" class="mb-4">
                        Este contrato ha sido finalizado.
                      </v-alert>

                      <v-list density="compact">
                        <v-list-item>
                          <v-list-item-title class="font-weight-bold">Fecha de Finalización:</v-list-item-title>
                          <v-list-item-subtitle>
                            {{ selectedContrato.fechaFin ? new Date(selectedContrato.fechaFin).toLocaleDateString('es-CO') : 'N/A' }}
                          </v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item>
                          <v-list-item-title class="font-weight-bold">Motivo de Finalización:</v-list-item-title>
                          <v-list-item-subtitle>{{ selectedContrato.motivoFinalizacion || 'N/A' }}</v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </div>

                    <div v-else class="text-grey-darken-1">
                      Aún no está finalizado este contrato.
                    </div>
                  </v-window-item>

                  <!-- HISTORIAL -->
                  <v-window-item value="historial">
                    <h4 class="text-h6 font-weight-bold mb-3 text-blue-grey-darken-2">
                      Historial del Contrato (estados y cambios)
                    </h4>

                    <div v-if="selectedTimeline.length">
                      <v-timeline side="end" density="compact">
                        <v-timeline-item
                          v-for="item in selectedTimeline"
                          :key="item.kind + '-' + item.id"
                          :dot-color="item.kind === 'estado'
                            ? (item.newEstado === 'activo' ? 'success' : 'error')
                            : 'secondary'"
                          size="small"
                        >
                          <!-- Cambios de estado -->
                          <template v-if="item.kind === 'estado'">
                            <div class="d-flex justify-space-between align-center mb-1">
                              <span class="font-weight-bold text-subtitle-1">
                                Cambio de Estado: {{ getEstadoNombre(item.oldEstado) }} → {{ getEstadoNombre(item.newEstado) }}
                              </span>
                              <span class="text-caption text-grey-darken-1">{{ formatDate(item.fechaCambio) }}</span>
                            </div>

                            <v-list density="compact" class="pl-0">
                              <v-list-item v-if="item.fechaInicioContrato">
                                <v-list-item-title class="text-caption font-weight-bold">Inicio del Contrato:</v-list-item-title>
                                <v-list-item-subtitle class="text-caption">
                                  {{ formatDate(item.fechaInicioContrato) }}
                                </v-list-item-subtitle>
                              </v-list-item>

                              <v-list-item v-if="item.motivo">
                                <v-list-item-title class="text-caption font-weight-bold">Motivo del Cambio:</v-list-item-title>
                                <v-list-item-subtitle class="text-caption">
                                  {{ item.motivo }}
                                </v-list-item-subtitle>
                              </v-list-item>
                            </v-list>
                          </template>

                          <!-- Cambios de campos -->
                          <template v-else>
                            <div class="d-flex justify-space-between align-center mb-1">
                              <span class="font-weight-bold text-subtitle-1 d-flex align-center">
                                {{ labelCampo(item.campo) }}
                              </span>
                              <span class="text-caption text-grey-darken-1">{{ formatDate(item.createdAt) }}</span>
                            </div>

                            <div class="text-body-2 text-grey-darken-2">
                              <div class="mb-1">
                                <strong>De:</strong>
                                <span>{{ renderValor(item.campo, item.oldValue, selectedContrato) }}</span>
                              </div>
                              <div>
                                <strong>A:</strong>
                                <span>{{ renderValor(item.campo, item.newValue, selectedContrato) }}</span>
                              </div>
                            </div>
                          </template>
                        </v-timeline-item>
                      </v-timeline>
                    </div>
                    <div v-else class="text-center text-subtitle-1 text-grey-darken-1 pa-4">
                      No hay historial registrado para este contrato.
                    </div>
                  </v-window-item>
                </v-window>
              </div>

              <div v-else class="text-grey-darken-1 text-center">
                Selecciona un contrato para verlo.
              </div>
            </div>

            <v-alert v-else type="info" variant="tonal">
              No hay contratos registrados para este usuario.
            </v-alert>
          </template>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="showContratosDialog = false">
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

/* ========= Tipos mínimos ========= */
interface ContratoPaso {
  id: number; contratoId: number; fase: string; nombrePaso: string;
  fecha?: string; archivoUrl?: string; observacion?: string;
  orden: number; completado: boolean; createdAt: string; updatedAt: string;
}
interface ContratoEvento {
  id: number; contratoId: number; tipo: string; subtipo?: string;
  fechaInicio: string; fechaFin?: string; descripcion?: string;
  documentoUrl?: string; createdAt: string; updatedAt: string;
}
interface HistEstado {
  id: number; oldEstado: 'activo'|'inactivo'; newEstado: 'activo'|'inactivo';
  fechaCambio: string; motivo?: string; fechaInicioContrato?: string; usuario?: any;
}
interface CambioContrato {
  id: number; contratoId: number; campo: string; oldValue: any; newValue: any; createdAt: string; usuario?: any;
}
interface Contrato {
  id: number; tipoContrato: 'prestacion'|'temporal'|'laboral'|string; estado: string;
  fechaInicio: string; fechaFin?: string; motivoFinalizacion?: string;
  nombreArchivoContratoFisico?: string; rutaArchivoContratoFisico?: string;
  usuarioId: number; pasos?: ContratoPaso[]; eventos?: ContratoEvento[];
  historialEstados?: HistEstado[]; cambios?: CambioContrato[]; cargo?: { nombre: string };
}
interface UsuarioConContratos {
  id: number; nombres: string; apellidos: string; correo: string;
  cargo?: { nombre: string }; rol?: { nombre: string }; contratos?: Contrato[];
  nombreCompleto: string;
}

/* ========= Estado & Router ========= */
const route = useRoute();
const router = useRouter();
const contratoStore = useContratoStore();

const razonSocialId = ref(route.params.id as string);
const razonSocialNombre = ref('');
const loading = ref(true);
const usuarios = ref<UsuarioConContratos[]>([]);

const mostrarModalPerfil = ref(false);
const usuarioIdParaPerfil = ref<number | null>(null);

/* 👉 Booleano simple para abrir/cerrar el diálogo (más robusto) */
const showContratosDialog = ref(false);

const modalContratosUsuario = ref<{
  usuarioId: number | null;
  nombreUsuario: string;
  selectedId: number | null;
  tab: 'inicio' | 'desarrollo' | 'fin' | 'historial';
}>({
  usuarioId: null,
  nombreUsuario: '',
  selectedId: null,
  tab: 'inicio',
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

/* ========= Computados ========= */
const contratosDelUsuarioSeleccionado = computed<Contrato[]>(() => {
  if (modalContratosUsuario.value.usuarioId) {
    const list = contratoStore
      .getContratosByUsuarioId(modalContratosUsuario.value.usuarioId)
      .slice()
      .sort((a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime());
    if (!modalContratosUsuario.value.selectedId && list.length) {
      modalContratosUsuario.value.selectedId = list[0].id;
    }
    return list as Contrato[];
  }
  return [];
});

const selectedContrato = computed<Contrato | null>(() =>
  contratosDelUsuarioSeleccionado.value.find(c => c.id === modalContratosUsuario.value.selectedId) || null
);

const selectedTimeline = computed<any[]>(() =>
  selectedContrato.value ? buildTimeline(selectedContrato.value) : []
);

/* ========= Carga de usuarios ========= */
async function cargarUsuarios() {
  loading.value = true;
  try {
    const data = await fetchUsuariosPorRazonSocial(razonSocialId.value);
    usuarios.value = data.map((u: any) => ({
      ...u,
      nombreCompleto: `${u.nombres} ${u.apellidos}`,
    })) as UsuarioConContratos[];
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
    usuarios.value = [];
  } finally {
    loading.value = false;
  }
}

/* ========= Navegación a perfil ========= */
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

/* ========= Modal Contratos ========= */
async function abrirModalContratos(usuarioId: number, nombreUsuario: string) {
  modalContratosUsuario.value.usuarioId = usuarioId;
  modalContratosUsuario.value.nombreUsuario = nombreUsuario;
  modalContratosUsuario.value.tab = 'inicio';
  modalContratosUsuario.value.selectedId = null;

  /* Abrimos el diálogo primero (aunque falle la carga) */
  showContratosDialog.value = true;

  try {
    await contratoStore.fetchContratosPorUsuario(usuarioId);
    const list = contratoStore.getContratosByUsuarioId(usuarioId) as Contrato[];
    if (list?.length) modalContratosUsuario.value.selectedId = list[0].id;
  } catch (error) {
    console.error('Error al cargar contratos para el usuario:', error);
  }
}

function irAContratoEnPerfilDesdeModal() {
  const c = selectedContrato.value;
  const uid = modalContratosUsuario.value.usuarioId;
  if (!c || !uid) return;

  // Mapeo modal → perfil
  let tab: 'detalles' | 'eventos' | 'fin' | 'historial' = 'eventos';
  let subtab: 'inicio' | 'desarrollo' | undefined = 'inicio';
  switch (modalContratosUsuario.value.tab) {
    case 'inicio': tab = 'eventos'; subtab = 'inicio'; break;
    case 'desarrollo': tab = 'eventos'; subtab = 'desarrollo'; break;
    case 'fin': tab = 'fin'; subtab = undefined; break;
    case 'historial': tab = 'historial'; subtab = undefined; break;
  }
  const query: Record<string, string> = { contratoId: String(c.id), tab };
  if (subtab) query.subtab = subtab;

  router.push({ name: 'UserProfile', params: { id: String(uid) }, query });
  showContratosDialog.value = false;
}

/* ========= Descargas / URLs ========= */
const API_BASE = 'http://localhost:3333';
const absoluteUrl = (pathOrUrl?: string | null): string => {
  if (!pathOrUrl) return '';
  return /^https?:\/\//i.test(pathOrUrl) ? pathOrUrl : `${API_BASE}${pathOrUrl}`;
};
const guessFileName = (pathOrUrl?: string | null, fallback = 'archivo'): string => {
  const url = absoluteUrl(pathOrUrl || '');
  try {
    const name = new URL(url).pathname.split('/').pop();
    return name && name.trim() ? name : fallback;
  } catch {
    const parts = url.split('/');
    return (parts[parts.length - 1] || fallback);
  }
};
async function downloadFile(pathOrUrl?: string | null, suggestedName?: string) {
  try {
    const url = absoluteUrl(pathOrUrl || '');
    if (!url) return;
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const a = document.createElement('a');
    const blobUrl = URL.createObjectURL(blob);
    a.href = blobUrl;
    a.download = suggestedName || guessFileName(url, 'archivo');
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  } catch (e) {
    console.error('Fallo al descargar, abriendo en nueva pestaña...', e);
    window.open(absoluteUrl(pathOrUrl || ''), '_blank');
  }
}

/* ========= Timeline / Render helpers ========= */
const CAMPO_LABELS: Record<string, string> = {
  razonSocialId: 'Empresa', sedeId: 'Sede', cargoId: 'Cargo', funcionesCargo: 'Funciones',
  tipoContrato: 'Tipo de Contrato', terminoContrato: 'Término',
  fechaInicio: 'Fecha de Inicio', fechaFin: 'Fecha de Finalización', fechaTerminacion: 'Fecha de Finalización',
  periodoPrueba: 'Periodo de Prueba', horarioTrabajo: 'Horario de Trabajo', centroCosto: 'Centro de Costo',
  epsId: 'EPS', arlId: 'ARL', afpId: 'AFP', afcId: 'AFC', ccfId: 'CCF',
  estado: 'Estado', motivoFinalizacion: 'Motivo de Finalización',
  tieneRecomendacionesMedicas: 'Recomendaciones médicas',
  salarioBasico: 'Salario básico', bonoSalarial: 'Bono salarial',
  auxilioTransporte: 'Auxilio transporte', auxilioNoSalarial: 'Auxilio no salarial', creacion: 'Creación',
};
const labelCampo = (campo: string) => CAMPO_LABELS[campo] || campo;

const formatDate = (d: any) => {
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt && !isNaN(dt.getTime?.() || NaN) ? dt.toLocaleDateString('es-CO') : '—';
};
const parseMaybeJson = (v: any) => {
  if (v === null || v === undefined) return v;
  if (typeof v === 'string') { try { return JSON.parse(v); } catch { return v; } }
  return v;
};
const isNamedRel = (val: any): val is { id?: number|string; nombre?: string } =>
  !!val && typeof val === 'object' && ('nombre' in val || 'id' in val);
const toNumberLoose = (v: any): number | null => {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') { const s = v.replace(/\./g,'').replace(/,/g,'.').trim(); const n = Number(s); return Number.isFinite(n) ? n : null; }
  return null;
};
const toBoolLoose = (v: any): boolean | null => {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') {
    const s = v.toLowerCase().trim();
    if (s === 'true' || s === '1' || s === 'si' || s === 'sí') return true;
    if (s === 'false' || s === '0' || s === 'no') return false;
  }
  return null;
};
const equalForField = (campo: string, a: any, b: any): boolean => {
  const va = parseMaybeJson(a); const vb = parseMaybeJson(b);
  if (campo === 'tieneRecomendacionesMedicas') { const ba = toBoolLoose(va); const bb = toBoolLoose(vb); return ba === bb; }
  if (['salarioBasico','bonoSalarial','auxilioTransporte','auxilioNoSalarial'].includes(campo)) {
    const na = toNumberLoose(va); const nb = toNumberLoose(vb); return na === nb;
  }
  if (campo.endsWith('Id')) {
    const idA = isNamedRel(va) ? Number(va.id) : Number(va);
    const idB = isNamedRel(vb) ? Number(vb.id) : Number(vb);
    if (!Number.isNaN(idA) && !Number.isNaN(idB)) return idA === idB;
    return JSON.stringify(va) === JSON.stringify(vb);
  }
  return (va ?? null) === (vb ?? null);
};
const renderValor = (campo: string, raw: any) => {
  const v = parseMaybeJson(raw);
  if (v === null || v === undefined || v === '') return 'N/A';
  if (campo.endsWith('Id') && isNamedRel(v)) return v.nombre ?? `#${v.id ?? ''}`;
  if (campo.startsWith('fecha')) return formatDate(v);
  if (campo === 'estado') return v === 'activo' ? 'Activo' : (v === 'inactivo' ? 'Inactivo' : String(v));
  if (typeof v === 'boolean') return v ? 'Sí' : 'No';
  if (typeof v === 'number') return new Intl.NumberFormat('es-CO').format(v);
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

/* Une historialEstados + cambios, y ordena desc */
function buildTimeline(c: Contrato): any[] {
  const items: any[] = [];
  (c.historialEstados || []).forEach((h: any) => items.push({ ...h, kind: 'estado' }));
  (c.cambios || [])
    .filter((chg: any) => !equalForField(chg.campo, chg.oldValue, chg.newValue))
    .forEach((chg: any) => items.push({
      ...chg,
      oldValue: parseMaybeJson(chg.oldValue),
      newValue: parseMaybeJson(chg.newValue),
      kind: 'cambio'
    }));
  return items.sort((a, b) => {
    const da = new Date(a.kind === 'estado' ? a.fechaCambio : a.createdAt).getTime();
    const db = new Date(b.kind === 'estado' ? b.fechaCambio : b.createdAt).getTime();
    return db - da;
  });
}
const getEstadoNombre = (estado: 'activo'|'inactivo') => estado === 'activo' ? 'Activo' : 'Inactivo';

/* ========= Utils ========= */
function cargosDelUsuario(user: UsuarioConContratos): string[] {
  const contratos = user.contratos || [];
  if (!contratos.length) return user.cargo?.nombre ? [user.cargo.nombre] : [];
  const cargosContratos = contratos.map(c => c.cargo?.nombre).filter((n): n is string => !!n && n.trim() !== '');
  return cargosContratos.length ? [...new Set(cargosContratos)] : (user.cargo?.nombre ? [user.cargo.nombre] : []);
}

/* ========= Lifecycle ========= */
onMounted(() => {
  razonSocialNombre.value = mapNombres[razonSocialId.value] || 'Razón Social';
  if (razonSocialId.value) cargarUsuarios();
});
watch(
  () => route.params.id,
  (newId) => {
    razonSocialId.value = newId as string;
    razonSocialNombre.value = mapNombres[newId as string] || 'Razón Social';
    if (razonSocialId.value) cargarUsuarios();
  }
);
</script>

<style scoped>
.text-success { color: green; font-weight: bold; }
.text-grey { color: gray; }
.bg-green-lighten-5 { background-color: #e8f5e9; }
.bg-grey-lighten-4 { background-color: #f5f5f5; }
</style>
