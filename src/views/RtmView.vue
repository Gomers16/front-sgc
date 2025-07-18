<template>
  <v-container class="rtm-container" fluid>
    <v-row justify="center">
      <v-col cols="12" class="text-center">
        <h1 class="rtm-title">Inicio RTM</h1>
      </v-col>

      <v-col cols="12" md="6" class="text-center">
        <v-list class="rtm-list">
          <v-list-item v-for="etapa in etapas" :key="etapa">
            <v-list-item-content>
              <v-list-item-title class="rtm-etapa">
                {{ etapa }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
const etapas = [
  'Puerta',
  'Registro',
  'Facturación',
  'Revisión',
  'Certificación',
]
</script>

<style scoped>
.rtm-container {
  padding-top: 100px;
  background-color: #fffde7; /* amarillo muy claro */
  min-height: 100vh;
}

.rtm-title {
  font-size: 36px;
  font-weight: bold;
  color: black;
  margin-bottom: 40px;
}

.rtm-etapa {
  font-size: 20px;
  font-weight: bold;
  color: black;
  padding: 10px 0;
}

.rtm-list {
  background-color: #fffde7;
  border: 1px solid #fdd835;
  border-radius: 12px;
  padding: 20px;
}
</style>
