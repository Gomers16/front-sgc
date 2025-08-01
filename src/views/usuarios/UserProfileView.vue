<template>
  <v-container class="py-8">
    <v-card class="elevation-12 rounded-xl pa-8">
      <div v-if="isLoadingUser" class="d-flex justify-center align-center" style="min-height: 400px;">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <div class="ml-4 text-h6 text-grey-darken-1">Cargando perfil...</div>
      </div>

      <div v-else-if="error" class="text-center py-10">
        <v-icon size="80" color="error">mdi-alert-circle-outline</v-icon>
        <h3 class="text-h5 font-weight-bold mt-4 text-error">Error al cargar el perfil</h3>
        <p class="mt-2">{{ error }}</p>
        <p class="mt-4 font-weight-bold text-caption text-grey-darken-1">
          Por favor, revisa la consola para más detalles.
        </p>
        <v-btn color="primary" class="mt-4" @click="loadUser">Reintentar</v-btn>
      </div>

      <div v-else-if="user">
        <v-row align="center" justify="center" class="mb-8">
          <v-col cols="12" md="auto" class="d-flex justify-center">
            <div class="avatar-container">
              <v-avatar size="180" class="elevation-8 border-lg border-white">
                <v-img
                  :src="user.fotoPerfil ? 'http://localhost:3333' + user.fotoPerfil : ''"
                  alt="Foto de perfil"
                ></v-img>
              </v-avatar>
              <v-btn
                icon
                class="edit-avatar-btn"
                color="primary"
                size="small"
                @click="showPhotoDialog = true"
              >
                <v-icon>mdi-camera</v-icon>
              </v-btn>
            </div>
          </v-col>
          <v-col cols="12" md="auto" class="text-center text-md-left">
            <v-card-title class="text-h2 font-weight-black text-blue-grey-darken-3 mb-1">
              {{ user.nombres }} {{ user.apellidos }}
            </v-card-title>
            <v-card-subtitle class="text-h5 text-blue-grey-darken-1">
              <v-icon left>mdi-briefcase-account</v-icon>
              {{ user.cargo?.nombre || 'Sin Cargo' }}
            </v-card-subtitle>
          </v-col>
        </v-row>

        <v-divider class="my-6"></v-divider>

        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-card class="elevation-4 rounded-lg h-100">
                <v-card-title class="text-h6 font-weight-bold text-white bg-blue-grey-darken-2 pa-4">
                  <v-icon left>mdi-account-details</v-icon>
                  Información de Contacto
                </v-card-title>
                <v-list dense class="pa-4">
                  <v-list-item prepend-icon="mdi-email" class="mb-2">
                    <v-list-item-title class="font-weight-bold">Correo Electrónico:</v-list-item-title>
                    <v-list-item-subtitle>{{ user.correo }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-phone" class="mb-2">
                    <v-list-item-title class="font-weight-bold">Celular Personal:</v-list-item-title>
                    <v-list-item-subtitle>{{ user.celularPersonal || 'N/A' }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-phone-classic" class="mb-2">
                    <v-list-item-title class="font-weight-bold">Celular Corporativo:</v-list-item-title>
                    <v-list-item-subtitle>{{ user.celularCorporativo || 'N/A' }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-map-marker" class="mb-2">
                    <v-list-item-title class="font-weight-bold">Dirección:</v-list-item-title>
                    <v-list-item-subtitle>{{ user.direccion || 'N/A' }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>
            <v-col cols="12" md="6">
              <v-card class="elevation-4 rounded-lg h-100">
                <v-card-title class="text-h6 font-weight-bold text-white bg-blue-grey-darken-2 pa-4">
                  <v-icon left>mdi-briefcase</v-icon>
                  Detalles de Empleo
                </v-card-title>
                <v-list dense class="pa-4">
                  <v-list-item prepend-icon="mdi-account-star-outline" class="mb-2">
                    <v-list-item-title class="font-weight-bold">Rol:</v-list-item-title>
                    <v-list-item-subtitle>{{ user.rol?.nombre || 'N/A' }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-domain" class="mb-2">
                    <v-list-item-title class="font-weight-bold">Empresa:</v-list-item-title>
                    <v-list-item-subtitle>{{ user.razonSocial?.nombre || 'N/A' }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-city" class="mb-2">
                    <v-list-item-title class="font-weight-bold">Sede:</v-list-item-title>
                    <v-list-item-subtitle>{{ user.sede?.nombre || 'N/A' }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-cash-multiple" class="mb-2">
                    <v-list-item-title class="font-weight-bold">Centro de Costo:</v-list-item-title>
                    <v-list-item-subtitle>{{ user.centroCosto || 'N/A' }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>
            <v-col cols="12">
              <v-card class="elevation-4 rounded-lg mt-6">
                <v-card-title class="text-h6 font-weight-bold text-white bg-blue-grey-darken-2 pa-4">
                  <v-icon left>mdi-security</v-icon>
                  Información de Seguridad Social
                </v-card-title>
                <v-row class="pa-4">
                  <v-col cols="12" sm="6" md="4" v-if="user.eps">
                    <v-list-item prepend-icon="mdi-hospital-building">
                      <v-list-item-title class="font-weight-bold">EPS:</v-list-item-title>
                      <v-list-item-subtitle>{{ user.eps?.nombre }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-col>
                  <v-col cols="12" sm="6" md="4" v-if="user.arl">
                    <v-list-item prepend-icon="mdi-account-injury">
                      <v-list-item-title class="font-weight-bold">ARL:</v-list-item-title>
                      <v-list-item-subtitle>{{ user.arl?.nombre }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-col>
                  <v-col cols="12" sm="6" md="4" v-if="user.afp">
                    <v-list-item prepend-icon="mdi-piggy-bank">
                      <v-list-item-title class="font-weight-bold">AFP:</v-list-item-title>
                      <v-list-item-subtitle>{{ user.afp?.nombre }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-col>
                  <v-col cols="12" sm="6" md="4" v-if="user.afc">
                    <v-list-item prepend-icon="mdi-bank-transfer">
                      <v-list-item-title class="font-weight-bold">AFC:</v-list-item-title>
                      <v-list-item-subtitle>{{ user.afc?.nombre }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-col>
                  <v-col cols="12" sm="6" md="4" v-if="user.ccf">
                    <v-list-item prepend-icon="mdi-family-tree">
                      <v-list-item-title class="font-weight-bold">CCF:</v-list-item-title>
                      <v-list-item-subtitle>{{ user.ccf?.nombre }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-col>
                  <v-col cols="12" v-if="!user.eps && !user.arl && !user.afp && !user.afc && !user.ccf">
                    <div class="text-center text-subtitle-1 text-grey-darken-1">
                      No hay información de seguridad social disponible.
                    </div>
                  </v-col>
                </v-row>
              </v-card>
            </v-col>
            <v-col cols="12" md="6" class="mt-6">
              <v-card class="elevation-4 rounded-lg h-100">
                <v-card-title class="text-h6 font-weight-bold text-white bg-blue-grey-darken-2 pa-4">
                  <v-icon left>mdi-account-cog</v-icon>
                  Configuraciones
                </v-card-title>
                <v-row class="pa-4">
                  <v-col cols="12" sm="6">
                    <v-list-item :prepend-icon="user.estado === 'activo' ? 'mdi-account-check' : 'mdi-account-off'">
                      <v-list-item-title class="font-weight-bold">Estado:</v-list-item-title>
                      <v-list-item-subtitle>
                        <v-chip :color="user.estado === 'activo' ? 'success' : 'error'" class="font-weight-bold" label small>
                          {{ user.estado }}
                        </v-chip>
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-list-item :prepend-icon="user.recomendaciones ? 'mdi-lightbulb-on-outline' : 'mdi-lightbulb-off-outline'">
                      <v-list-item-title class="font-weight-bold">Recibe Recomendaciones:</v-list-item-title>
                      <v-list-item-subtitle>
                        <v-chip :color="user.recomendaciones ? 'success' : 'warning'" class="font-weight-bold" label small>
                          {{ user.recomendaciones ? 'Sí' : 'No' }}
                        </v-chip>
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-col>
                </v-row>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="justify-end pt-8">
          <v-btn color="blue-grey-darken-2" @click="goBack" class="mr-4 text-white rounded-pill" size="large" elevation="4">
            <v-icon left>mdi-arrow-left</v-icon>
            Volver
          </v-btn>
          <v-btn color="primary" @click="editProfile" class="rounded-pill" size="large" elevation="4">
            <v-icon left>mdi-pencil</v-icon>
            Editar Perfil
          </v-btn>
        </v-card-actions>
      </div>

      <v-dialog v-model="showPhotoDialog" max-width="500px">
        <v-card>
          <v-card-title class="text-h5 bg-primary text-white">
            <v-icon left>mdi-camera</v-icon>
            Cambiar Foto de Perfil
          </v-card-title>
          <v-card-text class="py-4">
            <v-file-input
              ref="fileInputRef"
              label="Seleccionar nueva foto"
              prepend-icon="mdi-camera"
              accept="image/*"
              variant="outlined"
              :clearable="true"
              :rules="[v => (v && v.length > 0) || 'Debe seleccionar una imagen.']"
              :loading="isLoading"
            ></v-file-input>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="blue-grey-darken-2" variant="text" @click="closePhotoDialog" :disabled="isLoading">
              Cancelar
            </v-btn>
            <v-btn
              color="primary"
              variant="elevated"
              @click="uploadProfilePhoto"
              :disabled="isLoading"
            >
              Subir Foto
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { obtenerUsuarioPorId, uploadProfilePicture, type User } from '@/services/userService';

const router = useRouter();
const route = useRoute();

const user = ref<User | null>(null);
const isLoadingUser = ref(true);
const error = ref<string | null>(null);
const showPhotoDialog = ref(false);
const isLoading = ref(false);
const fileInputRef = ref<any>(null);

async function loadUser() {
  isLoadingUser.value = true;
  error.value = null;
  user.value = null;

  const userIdFromRoute = Number(route.params.id);
  if (isNaN(userIdFromRoute)) {
    error.value = 'ID de usuario inválido en la URL.';
    isLoadingUser.value = false;
    return;
  }

  try {
    const fetchedUser = await obtenerUsuarioPorId(userIdFromRoute);
    if (fetchedUser) {
      user.value = fetchedUser;
    } else {
      error.value = 'No se encontraron datos del usuario.';
    }
  } catch (err: unknown) {
    console.error('Error al cargar datos del usuario:', err);
    if (err instanceof Error) {
      error.value = `Error al cargar el usuario: ${err.message}.`;
    } else {
      error.value = 'Error al cargar el usuario: error desconocido.';
    }
  } finally {
    isLoadingUser.value = false;
  }
}

async function uploadProfilePhoto() {
  if (!user.value?.id) {
    alert('No se pudo obtener el ID del usuario.');
    return;
  }

  const files = fileInputRef.value?.files || [];
  const fileToUpload = files.length > 0 ? files[0] : null;

  if (!fileToUpload) {
    alert('Debe seleccionar una imagen para subir.');
    return;
  }

  isLoading.value = true;
  try {
    const updatedUser = await uploadProfilePicture(user.value.id, fileToUpload);
    user.value = updatedUser;
    alert('Foto de perfil actualizada correctamente.');
    closePhotoDialog();
  } catch (err: unknown) {
    console.error('Error al subir la foto de perfil:', err);
    if (err instanceof Error) {
      alert(`Ocurrió un error al subir la foto: ${err.message}.`);
    } else {
      alert('Ocurrió un error al subir la foto: error desconocido.');
    }
  } finally {
    isLoading.value = false;
  }
}

function closePhotoDialog() {
  showPhotoDialog.value = false;
  if (fileInputRef.value) {
    fileInputRef.value.reset();
  }
}

function editProfile() {
  if (user.value) {
    router.push({ name: 'Usuarios', query: { editId: user.value.id.toString() } });
  }
}

function goBack() {
  router.go(-1);
}

onMounted(() => {
  loadUser();
});
</script>

<style scoped>
.v-container {
  max-width: 1200px;
}

.avatar-container {
  position: relative;
  display: inline-block;
}

.edit-avatar-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  transform: translate(25%, 25%);
  z-index: 10;
  border: 3px solid white;
}

.v-card-title, .v-card-subtitle {
  white-space: normal;
  word-wrap: break-word;
}

.v-list-item-title, .v-list-item-subtitle {
  word-break: break-word;
}
</style>
