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

      <template #item.cargo="{ item }">
        {{ item.cargo?.nombre || 'Sin cargo' }}
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
        <v-btn color="info" variant="tonal" @click="confirmarVerContrato(item.id)">
          Ver contrato
        </v-btn>
      </template>
    </v-data-table>

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

    <v-dialog v-model="mostrarModalContrato" max-width="500">
      <v-card>
        <v-card-title class="text-h6">Confirmar Navegación</v-card-title>
        <v-card-text>¿Estás seguro de que quieres ver los contratos de este usuario?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="mostrarModalContrato = false">
            Cancelar
          </v-btn>
          <v-btn color="primary" variant="flat" @click="verContratoConfirmado">
            Confirmar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchUsuariosPorRazonSocial } from '@/services/razonSocialService';

// Interfaces (asegúrate de que estas coincidan exactamente con la estructura de tu API)
interface Contrato {
  id: number;
  tipoContrato: string;
  estado: string;
  // Agrega más propiedades si tu backend las envía
}

interface UsuarioConContratos {
  id: number;
  nombres: string;
  apellidos: string;
  cargo?: {
    nombre: string;
    // Agrega más propiedades si tu backend las envía
  };
  contratos?: Contrato[]; // Hacemos 'contratos' opcional y tipado con la interfaz Contrato
}

const route = useRoute();
const router = useRouter();

// Estado de la data
const razonSocialId = ref(route.params.id as string);
const razonSocialNombre = ref('');
const loading = ref(true);
const usuarios = ref<UsuarioConContratos[]>([]);

// Estado de los modales
const mostrarModalPerfil = ref(false);
const usuarioIdParaPerfil = ref<number | null>(null); // Para guardar el ID del usuario seleccionado

const mostrarModalContrato = ref(false);
const usuarioIdParaContrato = ref<number | null>(null); // Para guardar el ID del usuario seleccionado

// Mapeo de nombres de razón social (considera obtenerlo dinámicamente si es posible)
const mapNombres: Record<string, string> = {
  '1': 'CDA del Centro',
  '2': 'Activautos',
  '3': 'JEF & CO',
  '4': 'Activa Marketing',
};

// Encabezados de la tabla
const headers = [
  { title: 'Nombre', value: 'nombres' },
  { title: 'Cargo', value: 'cargo' },
  { title: 'Contratos', value: 'contratos' },
  { title: 'Acciones', value: 'acciones', sortable: false },
];

// --- Métodos para cargar datos ---
async function cargarUsuarios() {
  loading.value = true;
  try {
    // Asegúrate de que el servicio esté retornando un array de UsuarioConContratos
    const data: UsuarioConContratos[] = await fetchUsuariosPorRazonSocial(razonSocialId.value);
    usuarios.value = data;
    console.log('Usuarios cargados:', data);
  } catch (error: unknown) {
    // Manejo de errores más específico, podrías usar un snackbar aquí
    console.error('Error al cargar usuarios:', error instanceof Error ? error.message : error);
    usuarios.value = [];
  } finally {
    loading.value = false;
  }
}

// --- Métodos para los modales y navegación ---

// Perfil
function confirmarVerPerfil(usuarioId: number) {
  usuarioIdParaPerfil.value = usuarioId;
  mostrarModalPerfil.value = true;
}

function verPerfilConfirmado() {
  if (usuarioIdParaPerfil.value !== null) {
    router.push(`/usuarios/${usuarioIdParaPerfil.value}`);
  }
  mostrarModalPerfil.value = false;
  usuarioIdParaPerfil.value = null; // Limpiar después de usar
}

// Contrato
function confirmarVerContrato(usuarioId: number) {
  usuarioIdParaContrato.value = usuarioId;
  mostrarModalContrato.value = true;
}

function verContratoConfirmado() {
  if (usuarioIdParaContrato.value !== null) {
    router.push(`/gestion-documental/contrato/${usuarioIdParaContrato.value}`);
  }
  mostrarModalContrato.value = false;
  usuarioIdParaContrato.value = null; // Limpiar después de usar
}

// --- Ciclo de vida y watchers ---
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
</style>
