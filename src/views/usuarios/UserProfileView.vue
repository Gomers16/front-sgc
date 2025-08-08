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
                  :src="user.fotoPerfil ? 'http://localhost:3333' + user.fotoPerfil : 'https://i.imgur.com/I8iJ8sX.png'"
                  alt="Foto de perfil"
                  cover
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

            <v-col cols="12" md="6">
              <v-card class="elevation-4 rounded-lg mt-6 h-100">
                <v-card-title class="text-h6 font-weight-bold text-white bg-blue-grey-darken-2 pa-4">
                  <v-icon left>mdi-security</v-icon>
                  Información de Seguridad Social
                </v-card-title>
                <v-row class="pa-4">
                  <v-col cols="12" sm="6" v-if="user.eps">
                    <v-list-item prepend-icon="mdi-hospital-building">
                      <v-list-item-title class="font-weight-bold">EPS:</v-list-item-title>
                      <v-list-item-subtitle>{{ user.eps?.nombre }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-col>
                  <v-col cols="12" sm="6" v-if="user.arl">
                    <v-list-item prepend-icon="mdi-account-injury">
                      <v-list-item-title class="font-weight-bold">ARL:</v-list-item-title>
                      <v-list-item-subtitle>{{ user.arl?.nombre }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-col>
                  <v-col cols="12" sm="6" v-if="user.afp">
                    <v-list-item prepend-icon="mdi-piggy-bank">
                      <v-list-item-title class="font-weight-bold">AFP:</v-list-item-title>
                      <v-list-item-subtitle>{{ user.afp?.nombre }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-col>
                  <v-col cols="12" sm="6" v-if="user.afc">
                    <v-list-item prepend-icon="mdi-bank-transfer">
                      <v-list-item-title class="font-weight-bold">AFC:</v-list-item-title>
                      <v-list-item-subtitle>{{ user.afc?.nombre }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-col>
                  <v-col cols="12" sm="6" v-if="user.ccf">
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
            <v-col cols="12" md="6">
              <v-card class="elevation-4 rounded-lg mt-6 h-100">
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

        <v-divider class="my-6"></v-divider>
        <v-card-title class="text-h5 font-weight-bold text-blue-grey-darken-3 mb-4">
          <v-icon left>mdi-file-document-outline</v-icon>
          Información de Contratos
        </v-card-title>

        <v-card-text>
          <div v-if="user.contratos && user.contratos.length > 0">
            <v-expansion-panels variant="accordion">
              <v-expansion-panel
                v-for="contrato in user.contratos"
                :key="contrato.id"
                class="rounded-lg mb-4 elevation-2"
              >
                <v-expansion-panel-title>
                  Contrato #{{ contrato.id }} - Tipo: {{ contrato.tipoContrato }}
                  <v-spacer></v-spacer>
                  <v-chip :color="contrato.estado === 'activo' ? 'success' : 'error'" class="font-weight-bold" small>
                    {{ contrato.estado }}
                  </v-chip>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-tabs v-model="contrato.activeTab" color="primary" align-tabs="center">
                    <v-tab value="detalles">Detalles</v-tab>
                    <v-tab value="eventos">Eventos</v-tab>
                  </v-tabs>
                  <v-window v-model="contrato.activeTab" class="pa-4">
                    <v-window-item value="detalles">
                      <v-list dense>
                        <v-list-item prepend-icon="mdi-calendar-start" class="mb-2">
                          <v-list-item-title class="font-weight-bold">Fecha de Inicio:</v-list-item-title>
                          <v-list-item-subtitle>{{ formatDate(contrato.fechaInicio) }}</v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item prepend-icon="mdi-calendar-end" class="mb-2" v-if="contrato.fechaFin">
                          <v-list-item-title class="font-weight-bold">Fecha de Finalización:</v-list-item-title>
                          <v-list-item-subtitle>{{ formatDate(contrato.fechaFin) }}</v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item prepend-icon="mdi-city" class="mb-2">
                          <v-list-item-title class="font-weight-bold">Sede:</v-list-item-title>
                          <v-list-item-subtitle>{{ user.sede?.nombre || 'N/A' }}</v-list-item-subtitle>
                        </v-list-item>
                        <v-list-item prepend-icon="mdi-file-download" class="mb-2" v-if="contrato.rutaArchivoContratoFisico">
                            <v-list-item-title class="font-weight-bold">Contrato Físico:</v-list-item-title>
                            <v-list-item-subtitle>
                                <a :href="`http://localhost:3333${contrato.rutaArchivoContratoFisico}`" target="_blank">
                                    {{ contrato.nombreArchivoContratoFisico }}
                                </a>
                            </v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                      <v-card-actions class="pa-0 mt-4">
                        <v-btn
                          v-if="contrato.estado === 'activo'"
                          color="error"
                          variant="outlined"
                          size="small"
                          prepend-icon="mdi-power-off"
                          @click="confirmarCambioEstadoContrato(contrato.id, 'inactivo')"
                        >
                          Desactivar Contrato
                        </v-btn>
                        <v-btn
                          v-else
                          color="success"
                          variant="outlined"
                          size="small"
                          prepend-icon="mdi-power-on"
                          @click="confirmarCambioEstadoContrato(contrato.id, 'activo')"
                        >
                          Activar Contrato
                        </v-btn>
                      </v-card-actions>
                    </v-window-item>
                    <v-window-item value="eventos">
                      <v-tabs v-model="contrato.activeSubTab" color="secondary" align-tabs="center" class="mb-4">
                        <v-tab value="inicio">Inicio</v-tab>
                        <v-tab value="desarrollo">Desarrollo</v-tab>
                        <v-tab value="fin">Fin</v-tab>
                        <v-tab value="historial">Historial</v-tab> <!-- Nueva pestaña para historial -->
                      </v-tabs>

                      <v-window v-model="contrato.activeSubTab" class="pa-2">
                        <v-window-item value="inicio">
                          <h4 class="text-h6 font-weight-bold mb-3 text-blue-grey-darken-2">Pasos de Inicio del Contrato</h4>
                          <div v-if="contrato.pasos && contrato.pasos.length > 0">
                            <v-timeline side="end" density="compact">
                              <v-timeline-item
                                v-for="paso in contrato.pasos"
                                :key="paso.id"
                                dot-color="success"
                                size="small"
                              >
                                <div class="d-flex justify-space-between align-center mb-1">
                                  <span class="font-weight-bold text-subtitle-1">{{ paso.nombrePaso }} ({{ paso.fase }})</span>
                                  <span class="text-caption text-grey-darken-1">{{ paso.fecha ? formatDate(paso.fecha) : 'Sin fecha' }}</span>
                                </div>
                                <div class="text-body-2 text-grey-darken-2">
                                  {{ paso.observacion || 'Sin observación' }}
                                </div>
                                <div v-if="paso.archivoUrl" class="mt-2">
                                  <a :href="`http://localhost:3333${paso.archivoUrl}`" target="_blank" class="text-caption d-flex align-center text-primary">
                                    <v-icon size="small" class="mr-1">mdi-file-eye-outline</v-icon>
                                    Ver archivo
                                  </a>
                                </div>
                              </v-timeline-item>
                            </v-timeline>
                          </div>
                          <div v-else class="text-center text-subtitle-1 text-grey-darken-1 pa-4">
                            No hay pasos de inicio registrados para este contrato.
                          </div>
                        </v-window-item>

                        <v-window-item value="desarrollo">
                          <h4 class="text-h6 font-weight-bold mb-3 text-blue-grey-darken-2">Eventos durante el Contrato</h4>
                          <v-card-actions class="justify-end pa-0 mb-4">
                            <v-btn color="primary" variant="flat" size="small" prepend-icon="mdi-plus" @click="showAddEventDialog(contrato.id)">
                              Agregar Evento
                            </v-btn>
                          </v-card-actions>
                          <div v-if="contrato.eventos && contrato.eventos.length > 0">
                            <v-timeline side="end" density="compact">
                              <v-timeline-item
                                v-for="evento in contrato.eventos"
                                :key="evento.id"
                                dot-color="primary"
                                size="small"
                              >
                                <div class="d-flex justify-space-between align-center mb-1">
                                  <span class="font-weight-bold text-subtitle-1">{{ evento.tipo }}</span>
                                  <v-spacer></v-spacer>
                                  <span class="text-caption text-grey-darken-1">{{ formatDate(evento.createdAt) }}</span>
                                </div>
                                <div class="text-body-2 text-grey-darken-2">
                                  {{ evento.descripcion || 'Sin descripción' }}
                                </div>
                                <div class="mt-2 d-flex justify-end">
                                    <v-btn 
                                        icon="mdi-eye" 
                                        variant="text" 
                                        size="small" 
                                        color="info" 
                                        @click="viewEventDetails(evento)"
                                        class="mr-2"
                                    >
                                    </v-btn>
                                    <v-btn
                                        v-if="evento.documentoUrl"
                                        :href="`http://localhost:3333${evento.documentoUrl}`"
                                        target="_blank"
                                        color="primary"
                                        variant="outlined"
                                        size="small"
                                        prepend-icon="mdi-file-download-outline"
                                    >
                                        Descargar Documento
                                    </v-btn>
                                </div>
                              </v-timeline-item>
                            </v-timeline>
                          </div>
                          <div v-else class="text-center text-subtitle-1 text-grey-darken-1 pa-4">
                            No hay eventos registrados para este contrato.
                          </div>
                        </v-window-item>

                        <v-window-item value="fin">
                          <h4 class="text-h6 font-weight-bold mb-3 text-blue-grey-darken-2">Finalización del Contrato</h4>
                          <div v-if="contrato.estado === 'inactivo'">
                            <v-alert type="info" variant="tonal" class="mb-4">
                              Este contrato ha sido finalizado.
                            </v-alert>
                            <v-list dense>
                              <v-list-item>
                                <v-list-item-title class="font-weight-bold">Fecha de Finalización:</v-list-item-title>
                                <v-list-item-subtitle>{{ contrato.fechaFin ? formatDate(contrato.fechaFin) : 'N/A' }}</v-list-item-subtitle>
                              </v-list-item>
                              <v-list-item>
                                <v-list-item-title class="font-weight-bold">Motivo de Finalización:</v-list-item-title>
                                <v-list-item-subtitle>{{ contrato.motivoFinalizacion || 'N/A' }}</v-list-item-subtitle>
                              </v-list-item>
                            </v-list>
                          </div>
                          <v-form ref="finalizationForm" v-else>
                            <v-row>
                              <v-col cols="12" md="6">
                                <v-text-field
                                  v-model="finalizationDate"
                                  label="Fecha de Finalización"
                                  type="date"
                                  variant="outlined"
                                  :rules="[v => !!v || 'La fecha de finalización es obligatoria']"
                                  required
                                ></v-text-field>
                              </v-col>
                              <v-col cols="12">
                                <v-textarea
                                  v-model="finalizationReason"
                                  label="Motivo de Finalización"
                                  variant="outlined"
                                  :rules="[v => !!v || 'El motivo de finalización es obligatorio']"
                                  required
                                ></v-textarea>
                              </v-col>
                            </v-row>
                            <v-card-actions class="justify-end pa-0 mt-4">
                              <v-btn 
                                color="error" 
                                variant="elevated" 
                                prepend-icon="mdi-flag-checkered" 
                                @click="confirmFinalizeContract(contrato.id)"
                                :loading="isLoadingAction"
                              >
                                Finalizar Contrato
                              </v-btn>
                            </v-card-actions>
                          </v-form>
                        </v-window-item>

                        <!-- Nueva pestaña para el Historial de Estados -->
                        <v-window-item value="historial">
  <h4 class="text-h6 font-weight-bold mb-3 text-blue-grey-darken-2">Historial de Estados del Contrato</h4>
  <div v-if="contrato.historialEstados && contrato.historialEstados.length > 0">
    <v-timeline side="end" density="compact">
      <v-timeline-item
        v-for="registro in contrato.historialEstados"
        :key="registro.id"
        :dot-color="registro.newEstado === 'activo' ? 'success' : 'error'"
        size="small"
      >
        <div class="d-flex justify-space-between align-center mb-1">
          <span class="font-weight-bold text-subtitle-1">
            Cambio de Estado: {{ getEstadoNombre(registro.oldEstado) }} → {{ getEstadoNombre(registro.newEstado) }}
          </span>
          <span class="text-caption text-grey-darken-1">
            {{ formatDate(registro.fechaCambio) }}
          </span>
        </div>

        <v-list density="compact" class="pl-0">
          <v-list-item v-if="registro.fechaInicioContrato">
            <v-list-item-title class="text-caption font-weight-bold">Inicio del Contrato:</v-list-item-title>
            <v-list-item-subtitle class="text-caption">
              {{ formatDate(registro.fechaInicioContrato) }}
            </v-list-item-subtitle>
          </v-list-item>

          <v-list-item v-if="registro.motivo">
            <v-list-item-title class="text-caption font-weight-bold">Motivo del Cambio:</v-list-item-title>
            <v-list-item-subtitle class="text-caption">
              {{ registro.motivo }}
            </v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
  <v-list-item-title class="text-caption font-weight-bold" style="visibility: hidden">Realizado por:</v-list-item-title>
  <v-list-item-subtitle class="text-caption" style="visibility: hidden">
    Texto oculto
  </v-list-item-subtitle>
</v-list-item>

        </v-list>
      </v-timeline-item>
    </v-timeline>
  </div>
  <div v-else class="text-center text-subtitle-1 text-grey-darken-1 pa-4">
    No hay historial de estados registrado para este contrato.
  </div>
</v-window-item>

                      </v-window>
                    </v-window-item>
                  </v-window>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>
          <div v-else class="text-center text-subtitle-1 text-grey-darken-1 pa-4">
            Este usuario no tiene contratos registrados.
          </div>
        </v-card-text>

        <v-card-actions class="justify-end pt-8">
          <v-btn color="blue-grey-darken-2" @click="goBack" class="mr-4 text-white rounded-pill" size="large" elevation="4">
            <v-icon left>mdi-arrow-left</v-icon>
            Volver
          </v-btn>
          <v-btn color="primary" @click="openEditUserDialog" class="rounded-pill" size="large" elevation="4">
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
              :loading="isLoadingAction"
            ></v-file-input>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="blue-grey-darken-2" variant="text" @click="closePhotoDialog" :disabled="isLoadingAction">
              Cancelar
            </v-btn>
            <v-btn
              color="primary"
              variant="elevated"
              @click="uploadProfilePhoto"
              :disabled="isLoadingAction"
            >
              Subir Foto
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="showEditUserDialog" max-width="800px">
        <v-card>
          <v-card-title class="text-h5 bg-primary text-white">
            <v-icon left>mdi-pencil</v-icon>
            Editar Perfil
          </v-card-title>
          <v-card-text class="py-4">
            <v-form ref="userForm">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="editedUser.nombres"
                    label="Nombres"
                    variant="outlined"
                    :rules="[v => !!v || 'El nombre es obligatorio']"
                    required
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="editedUser.apellidos"
                    label="Apellidos"
                    variant="outlined"
                    :rules="[v => !!v || 'El apellido es obligatorio']"
                    required
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="editedUser.celularPersonal"
                    label="Celular Personal"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="editedUser.celularCorporativo"
                    label="Celular Corporativo"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="editedUser.direccion"
                    label="Dirección"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-checkbox v-model="editedUser.recomendaciones" label="Recibir recomendaciones"></v-checkbox>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="blue-grey-darken-2" variant="text" @click="closeEditUserDialog" :disabled="isLoadingAction">
              Cancelar
            </v-btn>
            <v-btn color="primary" variant="elevated" @click="submitEditUser" :loading="isLoadingAction">
              Guardar Cambios
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="showAddEventDialogForContrato" max-width="600px">
        <v-card>
          <v-card-title class="text-h5 bg-primary text-white">
            <v-icon left>mdi-plus-circle</v-icon>
            Agregar Evento a Contrato #{{ contratoIdForNewEvent }}
          </v-card-title>
          <v-card-text class="py-4">
            <v-form ref="eventForm">
              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="newEvent.tipo"
                    :items="tiposEvento"
                    label="Tipo de Evento"
                    variant="outlined"
                    :rules="[v => !!v || 'El tipo de evento es obligatorio']"
                    required
                  ></v-select>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="newEvent.subtipo"
                    label="Subtipo (opcional)"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="newEvent.fechaInicio"
                    label="Fecha de Inicio"
                    type="date"
                    variant="outlined"
                    :rules="[v => !!v || 'La fecha de inicio es obligatoria']"
                    required
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="newEvent.fechaFin"
                    label="Fecha de Fin (opcional)"
                    type="date"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="newEvent.descripcion"
                    label="Descripción (opcional)"
                    variant="outlined"
                  ></v-textarea>
                </v-col>
                <v-col cols="12">
                  <v-file-input
                    ref="eventFileRef"
                    label="Documento adjunto (PDF, JPG, PNG)"
                    prepend-icon="mdi-paperclip"
                    accept=".pdf,image/jpeg,image/png"
                    variant="outlined"
                  ></v-file-input>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="blue-grey-darken-2" variant="text" @click="closeAddEventDialog" :disabled="isLoadingAction">
              Cancelar
            </v-btn>
            <v-btn color="primary" variant="elevated" @click="submitNewEvent" :loading="isLoadingAction">
              Guardar Evento
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Diálogo de Detalles del Evento -->
      <v-dialog v-model="showEventDetailsDialog" max-width="500px">
        <v-card v-if="selectedEvent">
          <v-card-title class="text-h5 bg-primary text-white">
            <v-icon left>mdi-information-outline</v-icon>
            Detalles del Evento: {{ selectedEvent.tipo }}
          </v-card-title>
          <v-card-text class="py-4">
            <v-list dense>
              <v-list-item>
                <v-list-item-title class="font-weight-bold">Tipo:</v-list-item-title>
                <v-list-item-subtitle>{{ selectedEvent.tipo }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item v-if="selectedEvent.subtipo">
                <v-list-item-title class="font-weight-bold">Subtipo:</v-list-item-title>
                <v-list-item-subtitle>{{ selectedEvent.subtipo }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title class="font-weight-bold">Fecha de Inicio:</v-list-item-title>
                <v-list-item-subtitle>{{ formatDate(selectedEvent.fechaInicio) }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item v-if="selectedEvent.fechaFin">
                <v-list-item-title class="font-weight-bold">Fecha de Fin:</v-list-item-title>
                <v-list-item-subtitle>{{ formatDate(selectedEvent.fechaFin) }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item v-if="selectedEvent.descripcion">
                <v-list-item-title class="font-weight-bold">Descripción:</v-list-item-title>
                <v-list-item-subtitle>{{ selectedEvent.descripcion }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item v-if="selectedEvent.documentoUrl">
                <v-list-item-title class="font-weight-bold">Documento:</v-list-item-title>
                <v-list-item-subtitle>
                  <a :href="`http://localhost:3333${selectedEvent.documentoUrl}`" target="_blank">Ver Documento</a>
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title class="font-weight-bold">Creado el:</v-list-item-title>
                <v-list-item-subtitle>{{ formatDate(selectedEvent.createdAt) }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="blue-grey-darken-2" variant="text" @click="showEventDetailsDialog = false">Cerrar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Diálogo de Alerta Personalizado -->
      <v-dialog v-model="showAlertDialog" max-width="400px">
        <v-card>
          <v-card-title class="text-h6 bg-primary text-white">{{ alertDialogTitle }}</v-card-title>
          <v-card-text class="py-4">{{ alertDialogMessage }}</v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="showAlertDialog = false">Aceptar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Diálogo de Confirmación Personalizado -->
      <v-dialog v-model="showConfirmDialog" max-width="400px">
        <v-card>
          <v-card-title class="text-h6 bg-warning text-white">{{ confirmDialogTitle }}</v-card-title>
          <v-card-text class="py-4">{{ confirmDialogMessage }}</v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="blue-grey-darken-2" variant="text" @click="confirmDialogCallback(false)">Cancelar</v-btn>
            <v-btn color="primary" @click="confirmDialogCallback(true)">Confirmar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  obtenerUsuarioPorId,
  uploadProfilePicture,
  actualizarUsuario,
  type User,
  type Contrato
} from '@/services/userService';
import { actualizarContrato } from '@/services/contratoService';
import {
  crearEventoDeContrato,
  type ContratoEvento
} from '@/services/contratoEventosService';
import type { ContratoPaso } from '@/services/contratoPasosService';
import type { ContratoHistorialEstado } from '@/services/contratoHistorialEstadosService'; // Importa el tipo para el historial

// Interfaces de tipado
interface ContratoWithTabs extends Contrato {
  activeTab?: string;
  activeSubTab?: string;
  eventos?: ContratoEvento[];
  pasos?: ContratoPaso[];
  historialEstados?: ContratoHistorialEstado[]; // ✅ Añadido: Propiedad para el historial de estados
  fechaFinalizacion?: string;
  motivoFinalizacion?: string;
}

interface UserProfile extends User {
  contratos?: ContratoWithTabs[];
}

interface UserEditForm {
  nombres: string;
  apellidos: string;
  celularPersonal?: string;
  celularCorporativo?: string;
  direccion?: string;
  recomendaciones?: boolean;
}

const router = useRouter();
const route = useRoute();

const user = ref<UserProfile | null>(null);
const isLoadingUser = ref(true);
const error = ref<string | null>(null);
const isLoadingAction = ref(false);

// Diálogo para foto de perfil
const showPhotoDialog = ref(false);
const fileInputRef = ref<any>(null);

// Diálogo para edición de usuario
const showEditUserDialog = ref(false);
const editedUser = ref<Partial<UserEditForm>>({});
const userForm = ref<any>(null);

// Diálogo para agregar evento
const showAddEventDialogForContrato = ref(false);
const contratoIdForNewEvent = ref<number | null>(null);
const newEvent = ref<Partial<ContratoEvento>>({});
const eventFileRef = ref<any>(null);
const eventForm = ref<any>(null);
const tiposEvento = ['incapacidad', 'suspension', 'licencia', 'permiso', 'vacaciones', 'cesantias', 'disciplinario', 'terminacion'];

// Diálogos personalizados de alerta/confirmación
const showAlertDialog = ref(false);
const alertDialogTitle = ref('');
const alertDialogMessage = ref('');

const showConfirmDialog = ref(false);
const confirmDialogTitle = ref('');
const confirmDialogMessage = ref('');
const confirmDialogCallback = ref((confirmed: boolean) => {});

// Nuevo estado para el diálogo de detalles del evento
const showEventDetailsDialog = ref(false);
const selectedEvent = ref<ContratoEvento | null>(null);

// Nuevos estados para el formulario de finalización de contrato
const finalizationDate = ref<string | null>(null);
const finalizationReason = ref<string | null>(null);
const finalizationForm = ref<any>(null);


// Helper para mostrar alertas personalizadas
const showAlert = (title: string, message: string) => {
  alertDialogTitle.value = title;
  alertDialogMessage.value = message;
  showAlertDialog.value = true;
};

// Helper para mostrar confirmaciones personalizadas
const showConfirm = (title: string, message: string): Promise<boolean> => {
  confirmDialogTitle.value = title;
  confirmDialogMessage.value = message;
  showConfirmDialog.value = true;
  return new Promise((resolve) => {
    confirmDialogCallback.value = (confirmed: boolean) => {
      showConfirmDialog.value = false;
      resolve(confirmed);
    };
  });
};

// Lógica de carga de datos
const loadUser = async () => {
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
    const fetchedUser = await obtenerUsuarioPorId(userIdFromRoute) as UserProfile;
    if (fetchedUser) {
      if (fetchedUser.contratos) {
        fetchedUser.contratos = fetchedUser.contratos.map(contrato => ({
          ...contrato,
          activeTab: 'detalles',
          activeSubTab: 'inicio', // Initialize sub-tab
          eventos: contrato.eventos || [],
          pasos: contrato.pasos || [],
          historialEstados: contrato.historialEstados || [], // ✅ Inicializa historialEstados
          fechaFinalizacion: contrato.fechaFin ? contrato.fechaFin.split('T')[0] : null,
          motivoFinalizacion: (contrato as ContratoWithTabs).motivoFinalizacion || null,
        }));
      }
      user.value = fetchedUser;
    } else {
      error.value = 'No se encontraron datos del usuario.';
    }
  } catch (err: any) {
    console.error('Error al cargar datos del usuario:', err);
    error.value = `Error al cargar el usuario: ${err.message || 'error desconocido'}.`;
  } finally {
    isLoadingUser.value = false;
  }
};

// Funciones de ayuda
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
};

const getEstadoNombre = (estado: 'activo' | 'inactivo') => {
  return estado === 'activo' ? 'Activo' : 'Inactivo';
};

// Lógica para abrir diálogos
const openEditUserDialog = () => {
  if (user.value) {
    editedUser.value = {
      nombres: user.value.nombres,
      apellidos: user.value.apellidos,
      celularPersonal: user.value.celularPersonal,
      celularCorporativo: user.value.celularCorporativo,
      direccion: user.value.direccion,
      recomendaciones: user.value.recomendaciones,
    };
  }
  showEditUserDialog.value = true;
};

const showAddEventDialog = (contratoId: number) => {
  contratoIdForNewEvent.value = contratoId;
  newEvent.value = {};
  showAddEventDialogForContrato.value = true;
};

// Lógica de edición de usuario
const closeEditUserDialog = () => {
  showEditUserDialog.value = false;
  userForm.value?.reset();
};

const submitEditUser = async () => {
  if (!user.value?.id) return;

  const { valid } = await userForm.value.validate();
  if (!valid) return;

  isLoadingAction.value = true;
  try {
    const updatedUser = await actualizarUsuario(user.value.id, editedUser.value);
    user.value = updatedUser as UserProfile;
    showAlert('Éxito', 'Perfil actualizado correctamente.');
    closeEditUserDialog();
  } catch (err: any) {
    console.error('Error al actualizar el perfil:', err);
    showAlert('Error', `Error al actualizar el perfil: ${err.message || 'error desconocido'}.`);
  } finally {
    isLoadingAction.value = false;
  }
};

// Lógica de foto de perfil
const closePhotoDialog = () => {
  showPhotoDialog.value = false;
  fileInputRef.value?.reset();
};

const uploadProfilePhoto = async () => {
  if (!user.value?.id) {
    showAlert('Error', 'No se pudo obtener el ID del usuario.');
    return;
  }
  const fileToUpload = fileInputRef.value?.files[0];

  if (!fileToUpload) {
    showAlert('Advertencia', 'Debe seleccionar una imagen para subir.');
    return;
  }

  isLoadingAction.value = true;
  try {
    const updatedUser = await uploadProfilePicture(user.value.id, fileToUpload);
    user.value = updatedUser as UserProfile;
    showAlert('Éxito', 'Foto de perfil actualizada correctamente.');
    closePhotoDialog();
  } catch (err: any) {
    console.error('Error al subir la foto de perfil:', err);
    showAlert('Error', `Ocurrió un error al subir la foto: ${err.message || 'error desconocido'}.`);
  } finally {
    isLoadingAction.value = false;
  }
};

// Lógica de contratos
const confirmarCambioEstadoContrato = async (contratoId: number, nuevoEstado: 'activo' | 'inactivo') => {
  const confirmMessage = nuevoEstado === 'activo'
    ? '¿Estás seguro de que deseas activar este contrato?'
    : '¿Estás seguro de que deseas desactivar este contrato?';

  const confirmed = await showConfirm('Confirmar Cambio de Estado', confirmMessage);

  if (confirmed) {
    isLoadingAction.value = true;
    try {
      await actualizarContrato(contratoId, { estado: nuevoEstado });
      const successMessage = nuevoEstado === 'activo'
        ? 'Contrato activado correctamente.'
        : 'Contrato desactivado correctamente.';
      showAlert('Éxito', successMessage);
      await loadUser(); // Recargar para asegurar que el estado se actualice en la vista
    } catch (err: any) {
      console.error('Error al cambiar el estado del contrato:', err);
      showAlert('Error', `Error al cambiar el estado del contrato: ${err.message || 'error desconocido'}.`);
    } finally {
      isLoadingAction.value = false;
    }
  }
};

// Lógica de eventos
const closeAddEventDialog = () => {
  showAddEventDialogForContrato.value = false;
  eventForm.value?.reset();
  eventFileRef.value?.reset();
};

const submitNewEvent = async () => {
  if (!contratoIdForNewEvent.value) return;

  const { valid } = await eventForm.value.validate();
  if (!valid) return;

  isLoadingAction.value = true;
  const fileToUpload = eventFileRef.value?.files[0];
  const payload = new FormData();
  
  if (newEvent.value.tipo) payload.append('tipo', newEvent.value.tipo);
  if (newEvent.value.subtipo) payload.append('subtipo', newEvent.value.subtipo);
  if (newEvent.value.fechaInicio) payload.append('fechaInicio', newEvent.value.fechaInicio);
  if (newEvent.value.fechaFin) payload.append('fechaFin', newEvent.value.fechaFin);
  if (newEvent.value.descripcion) payload.append('descripcion', newEvent.value.descripcion);
  if (fileToUpload) payload.append('documento', fileToUpload);

  try {
    const createdEvent = await crearEventoDeContrato(contratoIdForNewEvent.value, payload);
    showAlert('Éxito', 'Evento creado correctamente.');
    closeAddEventDialog();

    // --- LÓGICA PARA ACTUALIZAR EL ESTADO LOCAL ---
    const targetContrato = user.value?.contratos?.find(
      (c) => c.id === contratoIdForNewEvent.value
    );

    if (targetContrato) {
      if (!targetContrato.eventos) {
        targetContrato.eventos = [];
      }
      targetContrato.eventos.push(createdEvent);
    }
    // --- FIN DE LA LÓGICA ---

  } catch (err: any) {
    console.error('Error al crear el evento:', err);
    showAlert('Error', `Error al crear el evento: ${err.message || 'error desconocido'}.`);
  } finally {
    isLoadingAction.value = false;
  }
};

// Nueva función para ver detalles del evento
const viewEventDetails = (event: ContratoEvento) => {
  selectedEvent.value = event;
  showEventDetailsDialog.value = true;
};

// Lógica para finalizar contrato
const confirmFinalizeContract = async (contratoId: number) => {
  const confirmed = await showConfirm(
    'Confirmar Finalización',
    '¿Estás seguro de que deseas finalizar este contrato? Esta acción no se puede deshacer.'
  );

  if (confirmed) {
    await submitContractFinalization(contratoId);
  }
};

const submitContractFinalization = async (contratoId: number) => {
  if (!finalizationDate.value || !finalizationReason.value) {
    showAlert('Advertencia', 'Por favor, complete la fecha y el motivo de finalización.');
    return;
  }

  isLoadingAction.value = true;
  try {
    await actualizarContrato(contratoId, { 
      estado: 'inactivo', 
      fechaFin: finalizationDate.value, 
      motivoFinalizacion: finalizationReason.value 
    });

    showAlert('Éxito', 'Contrato finalizado correctamente.');
    await loadUser(); // Recargar para mostrar los cambios y deshabilitar el formulario
  } catch (err: any) {
    console.error('Error al finalizar el contrato:', err);
    showAlert('Error', `Error al finalizar el contrato: ${err.message || 'error desconocido'}.`);
  } finally {
    isLoadingAction.value = false;
  }
};


const goBack = () => {
  router.go(-1);
};

onMounted(() => {
  loadUser();
});
</script>

<style scoped>
.v-container { max-width: 1200px; }
.avatar-container { position: relative; display: inline-block; }
.edit-avatar-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  transform: translate(25%, 25%);
  z-index: 10;
  border: 3px solid white;
}
.v-card-title, .v-card-subtitle { white-space: normal; word-wrap: break-word; }
.v-list-item-title, .v-list-item-subtitle { word-break: break-word; }
</style>
