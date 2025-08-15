<template>
  <v-container class="py-8">
    <v-card class="elevation-12 rounded-xl pa-8">
      <!-- Loading -->
      <div
        v-if="isLoadingUser"
        class="d-flex justify-center align-center"
        style="min-height: 400px;"
      >
        <v-progress-circular indeterminate color="primary" size="64" />
        <div class="ml-4 text-h6 text-grey-darken-1">Cargando perfil...</div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="text-center py-10">
        <v-icon size="80" color="error">mdi-alert-circle-outline</v-icon>
        <h3 class="text-h5 font-weight-bold mt-4 text-error">Error al cargar el perfil</h3>
        <p class="mt-2">{{ error }}</p>
        <p class="mt-4 font-weight-bold text-caption text-grey-darken-1">
          Por favor, revisa la consola para más detalles.
        </p>
        <v-btn color="primary" class="mt-4" @click="loadUser">Reintentar</v-btn>
      </div>

      <!-- Content -->
      <div v-else-if="user">
        <!-- Header -->
        <v-row align="center" justify="center" class="mb-8">
          <v-col cols="12" md="auto" class="d-flex justify-center">
            <div class="avatar-container">
              <v-avatar size="180" class="elevation-8 border-lg border-white">
                <v-img
                  :src="user.fotoPerfil ? 'http://localhost:3333' + user.fotoPerfil : 'https://i.imgur.com/I8iJ8sX.png'"
                  alt="Foto de perfil"
                  cover
                />
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
            <v-card-subtitle class="text-h5 text-blue-grey-darken-1 d-flex align-center">
              <v-icon class="mr-1">mdi-briefcase-account</v-icon>
              {{ primaryContrato?.cargo?.nombre || user.cargo?.nombre || 'Sin Cargo' }}
            </v-card-subtitle>
          </v-col>
        </v-row>

        <v-divider class="my-6" />

        <v-card-text>
          <v-row>
            <!-- Información de Contacto -->
            <v-col cols="12" md="6">
              <v-card class="elevation-4 rounded-lg h-100">
                <v-card-title class="text-h6 font-weight-bold text-white bg-blue-grey-darken-2 pa-4">
                  <v-icon class="mr-1">mdi-account-details</v-icon>
                  Información de Contacto
                </v-card-title>
                <v-list dense class="pa-4">
                  <!-- NUEVO: Cédula en tarjeta de contacto -->
                  <v-list-item prepend-icon="mdi-card-account-details-outline" class="mb-2">
                    <v-list-item-title class="font-weight-bold">Número de Cédula:</v-list-item-title>
                    <v-list-item-subtitle>{{ primaryContrato?.identificacion || 'N/A' }}</v-list-item-subtitle>
                  </v-list-item>

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

            <!-- Detalles de Empleo -->
            <v-col cols="12" md="6">
              <v-card class="elevation-4 rounded-lg h-100">
                <v-card-title class="text-h6 font-weight-bold text-white bg-blue-grey-darken-2 pa-4">
                  <v-icon class="mr-1">mdi-briefcase</v-icon>
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
                    <v-list-item-subtitle>{{ primaryContrato?.sede?.nombre || user.sede?.nombre || 'N/A' }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-cash-multiple" class="mb-2">
                    <v-list-item-title class="font-weight-bold">Centro de Costo:</v-list-item-title>
                    <v-list-item-subtitle>{{ primaryContrato?.centroCosto || user.centroCosto || 'N/A' }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>

            <!-- Seguridad Social (con tooltips) -->
            <v-col cols="12" md="6">
              <v-card class="elevation-4 rounded-lg mt-6 h-100">
                <v-card-title class="text-h6 font-weight-bold text-white bg-blue-grey-darken-2 pa-4">
                  <v-icon class="mr-1">mdi-security</v-icon>
                  Información de Seguridad Social
                </v-card-title>
                <v-row class="pa-4">
                  <!-- EPS -->
                  <v-col cols="12" sm="6" v-if="primaryContrato?.eps || user.eps">
                    <v-list-item prepend-icon="mdi-hospital-building">
                      <v-list-item-title class="font-weight-bold d-flex align-center">
                        EPS
                        <v-tooltip text="ENTIDAD PRESTADORA DE SERVICIOS DE SALUD" location="top">
                          <template #activator="{ props }">
                            <v-icon
                              v-bind="props"
                              icon="mdi-help-circle-outline"
                              size="16"
                              class="ml-1 text-medium-emphasis"
                              aria-label="¿Qué es EPS?"
                            />
                          </template>
                        </v-tooltip>:
                      </v-list-item-title>
                      <v-list-item-subtitle>{{ primaryContrato?.eps?.nombre || user.eps?.nombre }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-col>

                  <!-- ARL -->
                  <v-col cols="12" sm="6" v-if="primaryContrato?.arl || user.arl">
                    <v-list-item prepend-icon="mdi-account-injury">
                      <v-list-item-title class="font-weight-bold d-flex align-center">
                        ARL
                        <v-tooltip text="ADMINISTRADORA DE RIESGOS LABORALES" location="top">
                          <template #activator="{ props }">
                            <v-icon
                              v-bind="props"
                              icon="mdi-help-circle-outline"
                              size="16"
                              class="ml-1 text-medium-emphasis"
                              aria-label="¿Qué es ARL?"
                            />
                          </template>
                        </v-tooltip>:
                      </v-list-item-title>
                      <v-list-item-subtitle>{{ primaryContrato?.arl?.nombre || user.arl?.nombre }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-col>

                  <!-- AFP -->
                  <v-col cols="12" sm="6" v-if="primaryContrato?.afp || user.afp">
                    <v-list-item prepend-icon="mdi-piggy-bank">
                      <v-list-item-title class="font-weight-bold d-flex align-center">
                        AFP
                        <v-tooltip text="ADMINISTRADORA DE FONDO DE PENSIONES" location="top">
                          <template #activator="{ props }">
                            <v-icon
                              v-bind="props"
                              icon="mdi-help-circle-outline"
                              size="16"
                              class="ml-1 text-medium-emphasis"
                              aria-label="¿Qué es AFP?"
                            />
                          </template>
                        </v-tooltip>:
                      </v-list-item-title>
                      <v-list-item-subtitle>{{ primaryContrato?.afp?.nombre || user.afp?.nombre }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-col>

                  <!-- AFC -->
                  <v-col cols="12" sm="6" v-if="primaryContrato?.afc || user.afc">
                    <v-list-item prepend-icon="mdi-bank-transfer">
                      <v-list-item-title class="font-weight-bold d-flex align-center">
                        AFC
                        <v-tooltip text="ADMINISTRADORA DE FONDO DE CESANTÍAS" location="top">
                          <template #activator="{ props }">
                            <v-icon
                              v-bind="props"
                              icon="mdi-help-circle-outline"
                              size="16"
                              class="ml-1 text-medium-emphasis"
                              aria-label="¿Qué es AFC?"
                            />
                          </template>
                        </v-tooltip>:
                      </v-list-item-title>
                      <v-list-item-subtitle>{{ primaryContrato?.afc?.nombre || user.afc?.nombre }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-col>

                  <!-- CCF -->
                  <v-col cols="12" sm="6" v-if="primaryContrato?.ccf || user.ccf">
                    <v-list-item prepend-icon="mdi-family-tree">
                      <v-list-item-title class="font-weight-bold d-flex align-center">
                        CCF
                        <v-tooltip text="CAJA DE COMPENSACIÓN FAMILIAR" location="top">
                          <template #activator="{ props }">
                            <v-icon
                              v-bind="props"
                              icon="mdi-help-circle-outline"
                              size="16"
                              class="ml-1 text-medium-emphasis"
                              aria-label="¿Qué es CCF?"
                            />
                          </template>
                        </v-tooltip>:
                      </v-list-item-title>
                      <v-list-item-subtitle>{{ primaryContrato?.ccf?.nombre || user.ccf?.nombre }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-col>

                  <v-col cols="12" v-if="!primaryContrato && !user.eps && !user.arl && !user.afp && !user.afc && !user.ccf">
                    <div class="text-center text-subtitle-1 text-grey-darken-1">
                      No hay información de seguridad social disponible.
                    </div>
                  </v-col>
                </v-row>
              </v-card>
            </v-col>

            <!-- Configuraciones -->
            <v-col cols="12" md="6">
              <v-card class="elevation-4 rounded-lg mt-6 h-100">
                <v-card-title class="text-h6 font-weight-bold text-white bg-blue-grey-darken-2 pa-4">
                  <v-icon class="mr-1">mdi-account-cog</v-icon>
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

        <v-divider class="my-6" />

        <!-- Contratos -->
        <v-card-title class="text-h5 font-weight-bold text-blue-grey-darken-3 mb-4 d-flex align-center">
          <v-icon class="mr-1">mdi-file-document-outline</v-icon>
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
                  <v-spacer />
                  <v-chip
                    :color="(contrato.estado || '').toLowerCase() === 'activo' ? 'success' : 'error'"
                    class="font-weight-bold"
                    small
                  >
                    {{ contrato.estado }}
                  </v-chip>
                </v-expansion-panel-title>

                <v-expansion-panel-text>
                  <v-tabs v-model="contrato.activeTab" color="primary" align-tabs="center">
                    <v-tab value="detalles">Detalles</v-tab>
                    <v-tab value="eventos">Eventos</v-tab>
                    <v-tab value="fin">Fin</v-tab>
                    <v-tab value="historial">Historial</v-tab>
                  </v-tabs>

                  <v-window v-model="contrato.activeTab" class="pa-4">
                    <!-- Detalles -->
                    <v-window-item value="detalles">
                      <v-list dense>
                        <v-list-item prepend-icon="mdi-calendar-start" class="mb-2">
                          <v-list-item-title class="font-weight-bold">Fecha de Inicio:</v-list-item-title>
                          <v-list-item-subtitle>{{ formatDate(contrato.fechaInicio) }}</v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item prepend-icon="mdi-calendar-end" class="mb-2" v-if="contrato.fechaTerminacion">
                          <v-list-item-title class="font-weight-bold">Fecha de Finalización:</v-list-item-title>
                          <v-list-item-subtitle>{{ formatDate(contrato.fechaTerminacion) }}</v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item prepend-icon="mdi-city" class="mb-2">
                          <v-list-item-title class="font-weight-bold">Sede:</v-list-item-title>
                          <v-list-item-subtitle>{{ contrato.sede?.nombre || 'N/A' }}</v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item prepend-icon="mdi-briefcase-outline" class="mb-2" v-if="contrato.cargo?.nombre">
                          <v-list-item-title class="font-weight-bold">Cargo del Contrato:</v-list-item-title>
                          <v-list-item-subtitle>{{ contrato.cargo?.nombre }}</v-list-item-subtitle>
                        </v-list-item>

                        <!-- Número de Cédula (identificación) en Detalles -->
                        <v-list-item prepend-icon="mdi-card-account-details-outline" class="mb-2">
                          <v-list-item-title class="font-weight-bold">Número de Cédula:</v-list-item-title>
                          <v-list-item-subtitle>{{ contrato.identificacion || 'N/A' }}</v-list-item-subtitle>
                        </v-list-item>

                        <v-list-item prepend-icon="mdi-file-download" class="mb-2" v-if="contrato.rutaArchivoContratoFisico">
                          <v-list-item-title class="font-weight-bold">Contrato Físico:</v-list-item-title>
                          <v-list-item-subtitle>
                            <a
                              :href="`http://localhost:3333${contrato.rutaArchivoContratoFisico}`"
                              target="_blank"
                              class="contrato-link"
                            >
                              {{ contrato.nombreArchivoContratoFisico }}
                            </a>
                          </v-list-item-subtitle>
                        </v-list-item>
                      </v-list>

                      <v-card-actions class="pa-0 mt-4">
                        <v-btn
                          v-if="(contrato.estado || '').toLowerCase() === 'activo'"
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

                    <!-- Eventos -->
                    <v-window-item value="eventos">
                      <v-tabs v-model="contrato.activeSubTab" color="secondary" align-tabs="center" class="mb-4">
                        <v-tab value="inicio">Inicio</v-tab>
                        <v-tab value="desarrollo">Desarrollo</v-tab>
                      </v-tabs>

                      <v-window v-model="contrato.activeSubTab" class="pa-2">
                        <!-- Inicio -->
                        <v-window-item value="inicio">
                          <h4 class="text-h6 font-weight-bold mb-3 text-blue-grey-darken-2">
                            Pasos de Inicio del Contrato
                          </h4>

                          <div v-if="contrato.pasos && contrato.pasos.length > 0">
                            <v-timeline side="end" density="compact">
                              <v-timeline-item
                                v-for="paso in contrato.pasos"
                                :key="paso.id"
                                dot-color="success"
                                size="small"
                              >
                                <div class="d-flex justify-space-between align-center mb-1">
                                  <span class="font-weight-bold text-subtitle-1">
                                    {{ paso.nombrePaso }} ({{ paso.fase }})
                                  </span>
                                  <span class="text-caption text-grey-darken-1">
                                    {{ paso.fecha ? formatDate(paso.fecha) : 'Sin fecha' }}
                                  </span>
                                </div>

                                <div class="text-body-2 text-grey-darken-2">
                                  {{ paso.observacion || 'Sin observación' }}
                                </div>

                                <!-- 👇 Por: quién lo realizó -->
                                <div class="mt-1 text-caption text-grey-darken-1">
                                  Por:
                                  <v-chip v-if="paso.usuario" size="x-small" color="primary" label>
                                    {{ fullName(paso.usuario) }}
                                  </v-chip>
                                  <span v-else>Sistema</span>
                                </div>

                                <div v-if="paso.archivoUrl" class="mt-2">
                                  <a
                                    :href="paso.archivoUrl.startsWith('http') ? paso.archivoUrl : `http://localhost:3333${paso.archivoUrl}`"
                                    target="_blank"
                                    class="text-caption d-flex align-center text-primary"
                                  >
                                    <v-icon size="small" class="mr-1">mdi-file-eye-outline</v-icon>
                                    Ver archivo
                                  </a>
                                </div>

                                <div class="mt-2 d-flex justify-end">
                                  <v-btn
                                    v-if="paso.archivoUrl"
                                    :href="paso.archivoUrl.startsWith('http') ? paso.archivoUrl : `http://localhost:3333${paso.archivoUrl}`"
                                    target="_blank"
                                    icon="mdi-download"
                                    variant="text"
                                    size="small"
                                    color="primary"
                                    class="mr-2"
                                  />
                                  <v-btn
                                    icon="mdi-pencil"
                                    variant="text"
                                    size="small"
                                    color="info"
                                    @click="openEditPasoDialog(contrato.id, paso)"
                                  />
                                </div>
                              </v-timeline-item>
                            </v-timeline>
                          </div>

                          <div v-else class="text-center text-subtitle-1 text-grey-darken-1 pa-4">
                            No hay pasos de inicio registrados para este contrato.
                          </div>
                        </v-window-item>

                        <!-- Desarrollo -->
                        <v-window-item value="desarrollo">
                          <h4 class="text-h6 font-weight-bold mb-3 text-blue-grey-darken-2">
                            Eventos durante el Contrato
                          </h4>

                          <v-card-actions class="justify-end pa-0 mb-4">
                            <v-btn
                              color="primary"
                              variant="flat"
                              size="small"
                              prepend-icon="mdi-plus"
                              @click="showAddEventDialog(contrato.id)"
                            >
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
                                  <v-spacer />
                                  <span class="text-caption text-grey-darken-1">{{ formatDate(evento.createdAt) }}</span>
                                </div>

                                <div class="text-body-2 text-grey-darken-2">
                                  {{ evento.descripcion || 'Sin descripción' }}
                                </div>

                                <!-- 👇 Por: quién creó el evento -->
                                <div class="mt-1 text-caption text-grey-darken-1">
                                  Por:
                                  <v-chip v-if="evento.usuario" size="x-small" color="primary" label>
                                    {{ fullName(evento.usuario) }}
                                  </v-chip>
                                  <span v-else>Sistema</span>
                                </div>

                                <div class="mt-2 d-flex justify-end">
                                  <v-btn
                                    icon="mdi-eye"
                                    variant="text"
                                    size="small"
                                    color="info"
                                    @click="viewEventDetails(evento)"
                                    class="mr-2"
                                  />
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
                      </v-window>
                    </v-window-item>

                    <!-- Fin -->
                    <v-window-item value="fin">
                      <h4 class="text-h6 font-weight-bold mb-3 text-blue-grey-darken-2">
                        Finalización del Contrato
                      </h4>

                      <div v-if="(contrato.estado || '').toLowerCase() === 'inactivo'">
                        <v-alert type="info" variant="tonal" class="mb-4">
                          Este contrato ha sido finalizado.
                        </v-alert>

                        <v-list dense>
                          <v-list-item>
                            <v-list-item-title class="font-weight-bold">Fecha de Finalización:</v-list-item-title>
                            <v-list-item-subtitle>{{ contrato.fechaTerminacion ? formatDate(contrato.fechaTerminacion) : 'N/A' }}</v-list-item-subtitle>
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
                            />
                          </v-col>
                          <v-col cols="12">
                            <v-textarea
                              v-model="finalizationReason"
                              label="Motivo de Finalización"
                              variant="outlined"
                              :rules="[v => !!v || 'El motivo de finalización es obligatorio']"
                              required
                            />
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

                    <!-- Historial (estados + cambios) -->
                    <v-window-item value="historial">
                      <h4 class="text-h6 font-weight-bold mb-3 text-blue-grey-darken-2">
                        Historial del Contrato (estados y cambios)
                      </h4>

                      <div v-if="contrato.timeline?.length">
                        <v-timeline side="end" density="compact">
                          <v-timeline-item
                            v-for="item in contrato.timeline"
                            :key="item.kind + '-' + item.id"
                            :dot-color="item.kind === 'estado'
                              ? (item.newEstado === 'activo' ? 'success' : 'error')
                              : 'secondary'"
                            size="small"
                          >
                            <!-- ITEM: CAMBIO DE ESTADO -->
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

                                <v-list-item>
                                  <v-list-item-title class="text-caption font-weight-bold">Realizado por:</v-list-item-title>
                                  <v-list-item-subtitle class="text-caption">
                                    <v-chip v-if="item.usuario" size="x-small" color="primary" label>
                                      {{ fullName(item.usuario) }}
                                    </v-chip>
                                    <span v-else>Sistema</span>
                                  </v-list-item-subtitle>
                                </v-list-item>
                              </v-list>
                            </template>

                            <!-- ITEM: CAMBIO DE CAMPO -->
                            <template v-else>
                              <div class="d-flex justify-space-between align-center mb-1">
                                <span class="font-weight-bold text-subtitle-1 d-flex align-center">
                                  {{ labelCampo(item.campo) }}
                                  <v-tooltip
                                    v-if="ABBREV_TOOLTIPS[item.campo]"
                                    :text="ABBREV_TOOLTIPS[item.campo]"
                                    location="top"
                                  >
                                    <template #activator="{ props }">
                                      <v-icon
                                        v-bind="props"
                                        icon="mdi-help-circle-outline"
                                        size="16"
                                        class="ml-1 text-medium-emphasis"
                                        :aria-label="`¿Qué es ${labelCampo(item.campo)}?`"
                                      />
                                    </template>
                                  </v-tooltip>
                                </span>
                                <span class="text-caption text-grey-darken-1">{{ formatDate(item.createdAt) }}</span>
                              </div>

                              <div class="text-body-2 text-grey-darken-2">
                                <div class="mb-1">
                                  <strong>De:</strong>
                                  <span>{{ renderValor(item.campo, item.oldValue, contrato) }}</span>
                                </div>
                                <div>
                                  <strong>A:</strong>
                                  <span>{{ renderValor(item.campo, item.newValue, contrato) }}</span>
                                </div>
                              </div>

                              <div class="mt-2">
                                <small class="text-grey-darken-1">
                                  Por:
                                  <v-chip v-if="item.usuario" size="x-small" color="primary" label>
                                    {{ fullName(item.usuario) }}
                                  </v-chip>
                                  <span v-else>Sistema</span>
                                </small>
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
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>

          <div v-else class="text-center text-subtitle-1 text-grey-darken-1 pa-4">
            Este usuario no tiene contratos registrados.
          </div>
        </v-card-text>

        <v-card-actions class="justify-end pt-8">
          <v-btn
            color="blue-grey-darken-2"
            @click="goBack"
            class="mr-4 text-white rounded-pill"
            size="large"
            elevation="4"
          >
            <v-icon class="mr-1">mdi-arrow-left</v-icon>
            Volver
          </v-btn>
          <v-btn
            color="primary"
            @click="openEditUserDialog"
            class="rounded-pill"
            size="large"
            elevation="4"
          >
            <v-icon class="mr-1">mdi-pencil</v-icon>
            Editar Perfil
          </v-btn>
        </v-card-actions>
      </div>

      <!-- Diálogo Foto -->
      <v-dialog v-model="showPhotoDialog" max-width="500px">
        <v-card>
          <v-card-title class="text-h5 bg-primary text-white">
            <v-icon class="mr-1">mdi-camera</v-icon>
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
            />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="blue-grey-darken-2" variant="text" @click="closePhotoDialog" :disabled="isLoadingAction">
              Cancelar
            </v-btn>
            <v-btn color="primary" variant="elevated" @click="uploadProfilePhoto" :disabled="isLoadingAction">
              Subir Foto
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Diálogo Editar Usuario -->
      <v-dialog v-model="showEditUserDialog" max-width="800px">
        <v-card>
          <v-card-title class="text-h5 bg-primary text-white">
            <v-icon class="mr-1">mdi-pencil</v-icon>
            Editar Perfil
          </v-card-title>
          <v-card-text class="py-4">
            <v-form ref="userForm">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field v-model="editedUser.nombres" label="Nombres" variant="outlined" :rules="[v => !!v || 'El nombre es obligatorio']" required />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field v-model="editedUser.apellidos" label="Apellidos" variant="outlined" :rules="[v => !!v || 'El apellido es obligatorio']" required />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field v-model="editedUser.celularPersonal" label="Celular Personal" variant="outlined" />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field v-model="editedUser.celularCorporativo" label="Celular Corporativo" variant="outlined" />
                </v-col>
                <v-col cols="12">
                  <v-text-field v-model="editedUser.direccion" label="Dirección" variant="outlined" />
                </v-col>
                <v-col cols="12" md="6">
                  <v-checkbox v-model="editedUser.recomendaciones" label="Recibir recomendaciones" />
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="blue-grey-darken-2" variant="text" @click="closeEditUserDialog" :disabled="isLoadingAction">Cancelar</v-btn>
            <v-btn color="primary" variant="elevated" @click="submitEditUser" :loading="isLoadingAction">Guardar Cambios</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Diálogo Agregar Evento -->
      <v-dialog v-model="showAddEventDialogForContrato" max-width="600px">
        <v-card>
          <v-card-title class="text-h5 bg-primary text-white">
            <v-icon class="mr-1">mdi-plus-circle</v-icon>
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
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field v-model="newEvent.subtipo" label="Subtipo (opcional)" variant="outlined" />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="newEvent.fechaInicio"
                    label="Fecha de Inicio"
                    type="date"
                    variant="outlined"
                    :rules="[v => !!v || 'La fecha de inicio es obligatoria']"
                    required
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field v-model="newEvent.fechaFin" label="Fecha de Fin (opcional)" type="date" variant="outlined" />
                </v-col>
                <v-col cols="12">
                  <v-textarea v-model="newEvent.descripcion" label="Descripción (opcional)" variant="outlined" />
                </v-col>
                <v-col cols="12">
                  <v-file-input
                    ref="eventFileRef"
                    label="Documento adjunto (PDF, JPG, PNG)"
                    prepend-icon="mdi-paperclip"
                    accept=".pdf,image/jpeg,image/png"
                    variant="outlined"
                  />
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="blue-grey-darken-2" variant="text" @click="closeAddEventDialog" :disabled="isLoadingAction">Cancelar</v-btn>
            <v-btn color="primary" variant="elevated" @click="submitNewEvent" :loading="isLoadingAction">Guardar Evento</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Diálogo Detalle Evento -->
      <v-dialog v-model="showEventDetailsDialog" max-width="500px">
        <v-card v-if="selectedEvent">
          <v-card-title class="text-h5 bg-primary text-white">
            <v-icon class="mr-1">mdi-information-outline</v-icon>
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
              <!-- (opcional) mostrar creador también en el modal -->
              <v-list-item>
                <v-list-item-title class="font-weight-bold">Creado por:</v-list-item-title>
                <v-list-item-subtitle>
                  <v-chip v-if="(selectedEvent as any).usuario" size="x-small" color="primary" label>
                    {{ fullName((selectedEvent as any).usuario) }}
                  </v-chip>
                  <span v-else>Sistema</span>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="blue-grey-darken-2" variant="text" @click="showEventDetailsDialog = false">Cerrar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Diálogo EDITAR PASO -->
      <v-dialog v-model="showEditPasoDialog" max-width="600px">
        <v-card>
          <v-card-title class="text-h5 bg-primary text-white">
            <v-icon class="mr-1">mdi-pencil</v-icon>
            Editar Paso de Inicio
          </v-card-title>
          <v-card-text class="py-4">
            <v-form ref="editPasoForm">
              <v-textarea
                v-model="pasoEditData.observacion"
                label="Observación"
                variant="outlined"
                rows="3"
              />
              <v-file-input
                ref="editPasoFileRef"
                label="Archivo adjunto (opcional)"
                variant="outlined"
                density="compact"
                show-size
                prepend-icon="mdi-paperclip"
                accept=".pdf,image/jpeg,image/png"
              />
              <div class="text-caption mt-2 text-grey-darken-1">
                Si adjuntas un archivo nuevo, reemplazará el existente.
              </div>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="blue-grey-darken-2" variant="text" @click="closeEditPasoDialog" :disabled="isLoadingAction">
              Cancelar
            </v-btn>
            <v-btn color="primary" variant="elevated" @click="submitEditPaso" :loading="isLoadingAction">
              Guardar Cambios
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Alertas -->
      <v-dialog v-model="showAlertDialog" max-width="400px">
        <v-card>
          <v-card-title class="text-h6 bg-primary text-white">{{ alertDialogTitle }}</v-card-title>
          <v-card-text class="py-4">{{ alertDialogMessage }}</v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="primary" @click="showAlertDialog = false">Aceptar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Confirmaciones -->
      <v-dialog v-model="showConfirmDialog" max-width="400px">
        <v-card>
          <v-card-title class="text-h6 bg-warning text-white">{{ confirmDialogTitle }}</v-card-title>
          <v-card-text class="py-4">{{ confirmDialogMessage }}</v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="blue-grey-darken-2" variant="text" @click="confirmDialogCallback(false)">Cancelar</v-btn>
            <v-btn color="primary" @click="confirmDialogCallback(true)">Confirmar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  obtenerUsuarioPorId,
  uploadProfilePicture,
  actualizarUsuario,
  type User,
  type Contrato as BaseContrato
} from '@/services/userService'
import { actualizarContrato } from '@/services/contratoService'
import {
  crearEventoDeContrato,
  type ContratoEvento
} from '@/services/contratoEventosService'
import {
  actualizarPasoContrato,
  fetchPasosInicio,
  type ContratoPaso
} from '@/services/contratosPasosService'
import type { ContratoHistorialEstado } from '@/services/contratoHistorialEstadosService'

/* ===== Tipos ampliados ===== */
interface Rel { id: number; nombre: string }

interface CambioUsuario {
  id: number
  nombres: string
  apellidos: string
  correo?: string
}

interface ContratoCambio {
  id: number
  contratoId: number
  usuarioId: number | null
  usuario?: CambioUsuario | null
  campo: string
  oldValue: any
  newValue: any
  createdAt: string
}

/* 👇 Extiendo localmente para permitir 'usuario' en eventos y pasos */
type ContratoEventoExt = ContratoEvento & { usuario?: CambioUsuario | null }
type ContratoPasoExt = ContratoPaso & { usuario?: CambioUsuario | null }

type TimelineItemEstado = (ContratoHistorialEstado & { usuario?: CambioUsuario | null }) & {
  kind: 'estado'
}
type TimelineItemCambio = ContratoCambio & { kind: 'cambio' }
type TimelineItem = TimelineItemEstado | TimelineItemCambio

interface Contrato extends BaseContrato {
  identificacion?: string        // 👈 para mostrar cédula
  cargo?: Rel | null
  sede?: Rel | null
  eps?: Rel | null
  arl?: Rel | null
  afp?: Rel | null
  afc?: Rel | null
  ccf?: Rel | null
  fechaTerminacion?: string | null
  activeTab?: string
  activeSubTab?: string
  eventos?: ContratoEventoExt[]
  pasos?: ContratoPasoExt[]
  historialEstados?: (ContratoHistorialEstado & { usuario?: CambioUsuario | null })[]
  cambios?: ContratoCambio[]
  timeline?: TimelineItem[]
  fechaFinalizacion?: string
  motivoFinalizacion?: string
}

interface UserProfile extends User { contratos?: Contrato[] }

interface UserEditForm {
  nombres: string
  apellidos: string
  celularPersonal?: string
  celularCorporativo?: string
  direccion?: string
  recomendaciones?: boolean
}

const router = useRouter()
const route = useRoute()

const user = ref<UserProfile | null>(null)
const isLoadingUser = ref(true)
const error = ref<string | null>(null)
const isLoadingAction = ref(false)

/** ========= Actor logueado ========= */
const actorId = computed<number | null>(() => {
  const tryNum = (k: string) => {
    const v = localStorage.getItem(k) ?? sessionStorage.getItem(k)
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return tryNum('actorId') ?? tryNum('authUserId') ?? tryNum('userId') ?? null
})
// ===================================

/* ===== Tooltips abreviaturas ===== */
const ABBREV_TOOLTIPS: Record<string, string> = {
  epsId: 'ENTIDAD PRESTADORA DE SERVICIOS DE SALUD',
  arlId: 'ADMINISTRADORA DE RIESGOS LABORALES',
  afpId: 'ADMINISTRADORA DE FONDO DE PENSIONES',
  afcId: 'ADMINISTRADORA DE FONDO DE CESANTÍAS',
  ccfId: 'CAJA DE COMPENSACIÓN FAMILIAR',
}

/* ===== Diálogos / refs ===== */
const showPhotoDialog = ref(false)
const fileInputRef = ref<any>(null)

const showEditUserDialog = ref(false)
const editedUser = ref<Partial<UserEditForm>>({})
const userForm = ref<any>(null)

const showAddEventDialogForContrato = ref(false)
const contratoIdForNewEvent = ref<number | null>(null)
const newEvent = ref<Partial<ContratoEvento>>({})
const eventFileRef = ref<any>(null)
const eventForm = ref<any>(null)
const tiposEvento = ['incapacidad', 'suspension', 'licencia', 'permiso', 'vacaciones', 'cesantias', 'disciplinario', 'terminacion']

const showAlertDialog = ref(false)
const alertDialogTitle = ref('')
const alertDialogMessage = ref('')
const showConfirmDialog = ref(false)
const confirmDialogTitle = ref('')
const confirmDialogMessage = ref('')
const confirmDialogCallback = ref((confirmed: boolean) => {})

const showEventDetailsDialog = ref(false)
const selectedEvent = ref<ContratoEventoExt | null>(null)

const finalizationDate = ref<string | null>(null)
const finalizationReason = ref<string | null>(null)
const finalizationForm = ref<any>(null)

/* ===== Edición de pasos de inicio ===== */
const showEditPasoDialog = ref(false)
const editPasoForm = ref<any>(null)
const editPasoFileRef = ref<any>(null)
const pasoEditData = ref<{ observacion?: string }>({})
const contratoIdForPasoEdit = ref<number | null>(null)
const pasoIdForEdit = ref<number | null>(null)

/* ===== Contrato prioritario ===== */
const primaryContrato = computed<Contrato | null>(() => {
  const cs = user.value?.contratos || []
  if (!cs.length) return null
  const activo = cs.find(c => (c.estado || '').toLowerCase() === 'activo')
  if (activo) return activo
  return [...cs]
    .filter(c => !!c.fechaInicio)
    .sort((a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime())[0] || null
})

/* ===== Helpers UI ===== */
const showAlert = (title: string, message: string) => {
  alertDialogTitle.value = title
  alertDialogMessage.value = message
  showAlertDialog.value = true
}

const showConfirm = (title: string, message: string): Promise<boolean> => {
  confirmDialogTitle.value = title
  confirmDialogMessage.value = message
  showConfirmDialog.value = true
  return new Promise((resolve) => {
    confirmDialogCallback.value = (confirmed: boolean) => {
      showConfirmDialog.value = false
      resolve(confirmed)
    }
  })
}

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString as string)
  if (Number.isNaN(date.getTime())) return String(dateString)
  return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
}

const getEstadoNombre = (estado: 'activo' | 'inactivo') => (estado === 'activo' ? 'Activo' : 'Inactivo')
const fullName = (u?: {nombres?: string; apellidos?: string | null} | null) =>
  u ? [u.nombres, u.apellidos].filter(Boolean).join(' ') : '—'

/* ===== Etiquetas de campos ===== */
const CAMPO_LABELS: Record<string, string> = {
  razonSocialId: 'Empresa',
  sedeId: 'Sede',
  cargoId: 'Cargo',
  funcionesCargo: 'Funciones',
  tipoContrato: 'Tipo de Contrato',
  terminoContrato: 'Término',
  fechaInicio: 'Fecha de Inicio',
  fechaTerminacion: 'Fecha de Terminación',
  periodoPrueba: 'Periodo de Prueba',
  horarioTrabajo: 'Horario de Trabajo',
  centroCosto: 'Centro de Costo',
  epsId: 'EPS',
  arlId: 'ARL',
  afpId: 'AFP',
  afcId: 'AFC',
  ccfId: 'CCF',
  estado: 'Estado',
  motivoFinalizacion: 'Motivo de Finalización',
  tieneRecomendacionesMedicas: 'Recomendaciones médicas',
  salarioBasico: 'Salario básico',
  bonoSalarial: 'Bono salarial',
  auxilioTransporte: 'Auxilio transporte',
  auxilioNoSalarial: 'Auxilio no salarial',
  creacion: 'Creación',
}
const labelCampo = (campo: string) => CAMPO_LABELS[campo] || campo

/* ===== Utilidades de parseo/igualdad de cambios ===== */
const parseMaybeJson = (v: any) => {
  if (v === null || v === undefined) return v
  if (typeof v === 'string') {
    try { return JSON.parse(v) } catch { return v }
  }
  return v
}
const isNamedRel = (val: any): val is { id?: number | string; nombre?: string } =>
  !!val && typeof val === 'object' && ('nombre' in val || 'id' in val)

const toNumberLoose = (v: any): number | null => {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v === 'string') {
    const s = v.replace(/\./g, '').replace(/,/g, '.').trim()
    const n = Number(s)
    return Number.isFinite(n) ? n : null
  }
  return null
}
const toBoolLoose = (v: any): boolean | null => {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') {
    const s = v.toLowerCase().trim()
    if (s === 'true' || s === '1' || s === 'si' || s === 'sí') return true
    if (s === 'false' || s === '0' || s === 'no') return false
  }
  return null
}

const equalForField = (campo: string, a: any, b: any): boolean => {
  const va = parseMaybeJson(a)
  const vb = parseMaybeJson(b)

  if (campo === 'tieneRecomendacionesMedicas') {
    const ba = toBoolLoose(va)
    const bb = toBoolLoose(vb)
    return ba === bb
  }

  if (['salarioBasico','bonoSalarial','auxilioTransporte','auxilioNoSalarial'].includes(campo)) {
    const na = toNumberLoose(va)
    const nb = toNumberLoose(vb)
    return na === nb
  }

  if (campo.endsWith('Id')) {
    const idA = isNamedRel(va) ? Number(va.id) : Number(va)
    const idB = isNamedRel(vb) ? Number(vb.id) : Number(vb)
    if (!Number.isNaN(idA) && !Number.isNaN(idB)) return idA === idB
    return JSON.stringify(va) === JSON.stringify(vb)
  }

  return (va ?? null) === (vb ?? null)
}

const renderValor = (campo: string, raw: any, contrato?: Contrato) => {
  const v = parseMaybeJson(raw)
  if (v === null || v === undefined || v === '') return 'N/A'

  if (campo.endsWith('Id') && isNamedRel(v)) {
    return v.nombre ?? `#${v.id ?? ''}`
  }

  if (campo.endsWith('Id')) {
    const id = typeof v === 'number' ? v : Number(v)
    const nameMatch = (() => {
      if (campo === 'epsId' && contrato?.eps && contrato.eps.id === id) return contrato.eps.nombre
      if (campo === 'arlId' && contrato?.arl && contrato.arl.id === id) return contrato.arl.nombre
      if (campo === 'afpId' && contrato?.afp && contrato.afp.id === id) return contrato.afp.nombre
      if (campo === 'afcId' && contrato?.afc && contrato.afc.id === id) return contrato.afc.nombre
      if (campo === 'ccfId' && contrato?.ccf && contrato.ccf.id === id) return contrato.ccf.nombre
      if (campo === 'sedeId' && contrato?.sede && contrato.sede.id === id) return contrato.sede.nombre
      if (campo === 'cargoId' && contrato?.cargo && contrato.cargo.id === id) return contrato.cargo.nombre
      if (campo === 'razonSocialId' && (contrato as any)?.razonSocial && (contrato as any).razonSocial.id === id) return (contrato as any).razonSocial.nombre
      return null
    })()
    return nameMatch ? nameMatch : `#${isNaN(id) ? String(v) : id}`
  }

  if (campo.startsWith('fecha')) {
    return typeof v === 'string' ? formatDate(v) : formatDate(String(v))
  }

  if (campo === 'estado') {
    return v === 'activo' ? 'Activo' : (v === 'inactivo' ? 'Inactivo' : String(v))
  }

  if (typeof v === 'boolean') return v ? 'Sí' : 'No'
  if (typeof v === 'number') return new Intl.NumberFormat('es-CO').format(v)
  if (typeof v === 'object') {
    if ('estado' in v && (v.estado === 'activo' || v.estado === 'inactivo')) {
      return getEstadoNombre(v.estado)
    }
    return JSON.stringify(v)
  }
  return String(v)
}

/* ===== Timeline Combinado ===== */
const buildTimeline = (c: Contrato): TimelineItem[] => {
  const items: TimelineItem[] = []

  ;(c.historialEstados || []).forEach((h: any) => {
    items.push({ ...h, kind: 'estado' })
  })

  ;(c.cambios || [])
    .filter((chg: any) => !equalForField(chg.campo, chg.oldValue, chg.newValue))
    .forEach((chg: any) => {
      items.push({
        ...chg,
        oldValue: parseMaybeJson(chg.oldValue),
        newValue: parseMaybeJson(chg.newValue),
        kind: 'cambio',
      })
    })

  return items.sort((a, b) => {
    const da = new Date(a.kind === 'estado' ? (a as any).fechaCambio : (a as any).createdAt).getTime()
    const db = new Date(b.kind === 'estado' ? (b as any).fechaCambio : (b as any).createdAt).getTime()
    return db - da
  })
}

/* ===== Carga de datos ===== */
const loadUser = async () => {
  isLoadingUser.value = true
  error.value = null
  user.value = null
  const userIdFromRoute = Number(route.params.id)

  if (isNaN(userIdFromRoute)) {
    error.value = 'ID de usuario inválido en la URL.'
    isLoadingUser.value = false
    return
  }

  try {
    const fetchedUser = await obtenerUsuarioPorId(userIdFromRoute) as UserProfile
    if (fetchedUser) {
      if (fetchedUser.contratos) {
        fetchedUser.contratos = await Promise.all(
          fetchedUser.contratos.map(async (contrato: any) => {
            const c: Contrato = {
              ...contrato,
              activeTab: 'detalles',
              activeSubTab: 'inicio',
              eventos: contrato.eventos || [],
              pasos: contrato.pasos || [],
              historialEstados: contrato.historialEstados || [],
              cambios: (contrato.cambios || []).map((x: any) => ({
                ...x,
                oldValue: parseMaybeJson(x.oldValue),
                newValue: parseMaybeJson(x.newValue),
              })),
              fechaFinalizacion: contrato.fechaTerminacion ? String(contrato.fechaTerminacion).split('T')[0] : null,
              motivoFinalizacion: contrato.motivoFinalizacion || null,
            }

            // Traer pasos de la fase 'inicio' si no vinieron
            if (!c.pasos || c.pasos.length === 0) {
              c.pasos = await fetchPasosInicio(c.id) as unknown as ContratoPasoExt[]
            }

            c.timeline = buildTimeline(c)
            return c
          })
        )
      }
      user.value = fetchedUser
    } else {
      error.value = 'No se encontraron datos del usuario.'
    }
  } catch (err: any) {
    console.error('Error al cargar datos del usuario:', err)
    error.value = `Error al cargar el usuario: ${err.message || 'error desconocido'}.`
  } finally {
    isLoadingUser.value = false
  }
}

/* ===== Acciones ===== */
const openEditUserDialog = () => {
  if (user.value) {
    editedUser.value = {
      nombres: user.value.nombres,
      apellidos: user.value.apellidos,
      celularPersonal: user.value.celularPersonal,
      celularCorporativo: user.value.celularCorporativo,
      direccion: user.value.direccion,
      recomendaciones: user.value.recomendaciones,
    }
  }
  showEditUserDialog.value = true
}

const closeEditUserDialog = () => {
  showEditUserDialog.value = false
  userForm.value?.reset()
}

const submitEditUser = async () => {
  if (!user.value?.id) return
  const { valid } = await userForm.value.validate()
  if (!valid) return

  isLoadingAction.value = true
  try {
    const updatedUser = await actualizarUsuario(user.value.id, editedUser.value)
    user.value = updatedUser as UserProfile
    showAlert('Éxito', 'Perfil actualizado correctamente.')
    closeEditUserDialog()
  } catch (err: any) {
    console.error('Error al actualizar el perfil:', err)
    showAlert('Error', `Error al actualizar el perfil: ${err.message || 'error desconocido'}.`)
  } finally {
    isLoadingAction.value = false
  }
}

const closePhotoDialog = () => {
  showPhotoDialog.value = false
  fileInputRef.value?.reset()
}

const uploadProfilePhoto = async () => {
  if (!user.value?.id) {
    showAlert('Error', 'No se pudo obtener el ID del usuario.')
    return
  }
  const fileToUpload = fileInputRef.value?.files[0]
  if (!fileToUpload) {
    showAlert('Advertencia', 'Debe seleccionar una imagen para subir.')
    return
  }

  isLoadingAction.value = true
  try {
    const updatedUser = await uploadProfilePicture(user.value.id, fileToUpload)
    user.value = updatedUser as UserProfile
    showAlert('Éxito', 'Foto de perfil actualizada correctamente.')
    closePhotoDialog()
  } catch (err: any) {
    console.error('Error al subir la foto de perfil:', err)
    showAlert('Error', `Ocurrió un error al subir la foto: ${err.message || 'error desconocido'}.`)
  } finally {
    isLoadingAction.value = false
  }
}

const showAddEventDialog = (contratoId: number) => {
  contratoIdForNewEvent.value = contratoId
  newEvent.value = {}
  showAddEventDialogForContrato.value = true
}

const closeAddEventDialog = () => {
  showAddEventDialogForContrato.value = false
  eventForm.value?.reset()
  eventFileRef.value?.reset()
}

const submitNewEvent = async () => {
  if (!contratoIdForNewEvent.value) return
  const { valid } = await eventForm.value.validate()
  if (!valid) return

  isLoadingAction.value = true
  const fileToUpload = eventFileRef.value?.files[0]
  const payload = new FormData()

  if (newEvent.value.tipo) payload.append('tipo', newEvent.value.tipo)
  if (newEvent.value.subtipo) payload.append('subtipo', newEvent.value.subtipo as string)
  if (newEvent.value.fechaInicio) payload.append('fechaInicio', newEvent.value.fechaInicio as string)
  if (newEvent.value.fechaFin) payload.append('fechaFin', newEvent.value.fechaFin as string)
  if (newEvent.value.descripcion) payload.append('descripcion', newEvent.value.descripcion as string)
  if (fileToUpload) payload.append('documento', fileToUpload)
  if (actorId.value != null) payload.append('actorId', String(actorId.value))

  try {
    const createdEvent = await crearEventoDeContrato(contratoIdForNewEvent.value, payload) as ContratoEventoExt
    showAlert('Éxito', 'Evento creado correctamente.')
    closeAddEventDialog()

    const targetContrato = user.value?.contratos?.find(c => c.id === contratoIdForNewEvent.value)
    if (targetContrato) {
      targetContrato.eventos = targetContrato.eventos || []
      targetContrato.eventos.push(createdEvent)
    }
  } catch (err: any) {
    console.error('Error al crear el evento:', err)
    showAlert('Error', `Error al crear el evento: ${err.message || 'error desconocido'}.`)
  } finally {
    isLoadingAction.value = false
  }
}

const viewEventDetails = (event: ContratoEventoExt) => {
  selectedEvent.value = event
  showEventDetailsDialog.value = true
}

const confirmarCambioEstadoContrato = async (contratoId: number, nuevoEstado: 'activo' | 'inactivo') => {
  const confirmMessage = nuevoEstado === 'activo'
    ? '¿Estás seguro de que deseas activar este contrato?'
    : '¿Estás seguro de que deseas desactivar este contrato?'

  const confirmed = await showConfirm('Confirmar Cambio de Estado', confirmMessage)
  if (confirmed) {
    isLoadingAction.value = true
    try {
      await actualizarContrato(contratoId, { estado: nuevoEstado, actorId: actorId.value ?? undefined } as any)
      showAlert('Éxito', nuevoEstado === 'activo' ? 'Contrato activado correctamente.' : 'Contrato desactivado correctamente.')
      await loadUser()
    } catch (err: any) {
      console.error('Error al cambiar el estado del contrato:', err)
      showAlert('Error', `Error al cambiar el estado del contrato: ${err.message || 'error desconocido'}.`)
    } finally {
      isLoadingAction.value = false
    }
  }
}

const confirmFinalizeContract = async (contratoId: number) => {
  const confirmed = await showConfirm(
    'Confirmar Finalización',
    '¿Estás seguro de que deseas finalizar este contrato? Esta acción no se puede deshacer.'
  )
  if (confirmed) await submitContractFinalization(contratoId)
}

const submitContractFinalization = async (contratoId: number) => {
  if (!finalizationDate.value || !finalizationReason.value) {
    showAlert('Advertencia', 'Por favor, complete la fecha y el motivo de finalización.')
    return
  }

  isLoadingAction.value = true
  try {
    await actualizarContrato(contratoId, {
      estado: 'inactivo',
      fechaTerminacion: finalizationDate.value,
      motivoFinalizacion: finalizationReason.value,
      actorId: actorId.value ?? undefined,
    } as any)
    showAlert('Éxito', 'Contrato finalizado correctamente.')
    await loadUser()
  } catch (err: any) {
    console.error('Error al finalizar el contrato:', err)
    showAlert('Error', `Error al finalizar el contrato: ${err.message || 'error desconocido'}.`)
  } finally {
    isLoadingAction.value = false
  }
}

/* ===== Edición de paso ===== */
const openEditPasoDialog = (contratoId: number, paso: ContratoPasoExt) => {
  contratoIdForPasoEdit.value = contratoId
  pasoIdForEdit.value = (paso as any).id || null
  pasoEditData.value = { observacion: paso.observacion || '' }
  showEditPasoDialog.value = true
}

const closeEditPasoDialog = () => {
  showEditPasoDialog.value = false
  editPasoForm.value?.reset()
  editPasoFileRef.value?.reset()
}

const submitEditPaso = async () => {
  if (!contratoIdForPasoEdit.value || !pasoIdForEdit.value) return
  isLoadingAction.value = true

  const fileToUpload = editPasoFileRef.value?.files?.[0]
  const payload = new FormData()
  payload.append('observacion', pasoEditData.value.observacion || '')
  if (fileToUpload) payload.append('archivo', fileToUpload)
  if (actorId.value != null) payload.append('actorId', String(actorId.value))

  try {
    await actualizarPasoContrato(contratoIdForPasoEdit.value, pasoIdForEdit.value, payload)
    showAlert('Éxito', 'Paso actualizado correctamente.')
    closeEditPasoDialog()
    await loadUser()
  } catch (err: any) {
    console.error('Error al actualizar paso:', err)
    showAlert('Error', `Error al actualizar el paso: ${err.message || 'error desconocido'}.`)
  } finally {
    isLoadingAction.value = false
  }
}

const goBack = () => router.go(-1)

onMounted(() => {
  loadUser()
})
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

/* NUEVO: estilo del hipervínculo del Contrato Físico */
.contrato-link {
  color: #0d47a1 !important; /* azul oscuro */
  text-decoration: underline;
}
</style>
