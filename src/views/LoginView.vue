<template>
  <!-- Mantengo el nombre de la clase y agrego auth-card para que respete el ancho del layout -->
  <div class="login-form auth-card">
    <!-- Encabezado del card -->
    <div class="card-head">
      <h2 class="titulo-login">Bienvenido</h2>
      <p class="subtitle">Ingresa con tus credenciales para continuar</p>
    </div>

    <form @submit.prevent="handlerLogin" class="card-body">
      <div class="input-group">
        <label for="email">Correo electrónico</label>
        <input
          type="email"
          id="email"
          v-model="email"
          placeholder="Ingresa tu correo"
          autocomplete="username"
          required
        />
      </div>

      <div class="input-group">
        <label for="password">Contraseña</label>
        <input
          type="password"
          id="password"
          v-model="password"
          placeholder="Ingresa tu contraseña"
          autocomplete="current-password"
          required
        />
      </div>

      <div class="actions">
        <router-link to="/reset-password" class="forgot-password-link">
          ¿Olvidó su contraseña?
        </router-link>

        <button type="submit" class="btn-primary">Ingresar</button>
      </div>
    </form>

    <!-- Mensaje personalizado para errores/avisos (sin cambios funcionales) -->
    <div v-if="message" :class="['message-box', messageType]">
      <p>{{ message }}</p>
      <button @click="clearMessage" class="close-message-button" aria-label="Cerrar">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { authSetStore } from '@/stores/AuthStore.ts'

const authStore = authSetStore()
const email = ref('')
const password = ref('')
const message = ref<string | null>(null)
const messageType = ref<'success' | 'error' | 'info'>('info')

const showMessage = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
  message.value = msg
  messageType.value = type
  setTimeout(() => clearMessage(), 5000)
}

const clearMessage = () => {
  message.value = null
}

const handlerLogin = async () => {
  clearMessage()
  if (!email.value || !password.value) {
    showMessage('Por favor, completa todos los campos', 'info')
    return
  }

  try {
    await authStore.login({ email: email.value, password: password.value })
    showMessage('Inicio de sesión exitoso', 'success')
  } catch (error) {
    showMessage('Credenciales incorrectas o error de conexión', 'error')
    console.error(error)
  }
}
</script>

<style scoped>
:root{
  --azul:#21478d; --blanco:#fff; --blanco-2:#f5f7fb; --borde:rgba(255,255,255,.28);
}

/* Card base */
.login-form{
  position:relative;
  width:min(100%,520px);
  margin:0 auto;
  padding:clamp(18px,3.2vw,24px);
  background:linear-gradient(180deg,rgba(255,255,255,.26),rgba(255,255,255,.22));
  border:1px solid var(--borde);
  border-radius:16px;
  backdrop-filter:blur(14px);
  box-shadow:0 14px 36px rgba(0,0,0,.28);
  color:#fff;
}

/* Encabezado */
.card-head{ text-align:center; margin-bottom:clamp(14px,2.4vw,18px); }
.titulo-login{
  margin:0; font-weight:800; line-height:1.1;
  font-size:clamp(22px,3.4vw,30px); color:#fff;
  text-shadow:0 3px 10px rgba(0,0,0,.35);
}
.subtitle{ margin:6px 0 0; opacity:.95; font-size:clamp(13px,2vw,14px); }

/* Form centrado (labels a la izquierda) */
.card-body{ display:grid; gap:clamp(12px,2.4vw,16px); justify-items:center; text-align:center; }
.input-group{ width:100%; display:grid; gap:8px; text-align:left; }
.input-group label{ display:block; width:100%; text-align:left; }

/* Inputs */
input{
  width:100%; height:52px; padding:0 14px; box-sizing:border-box;
  border-radius:12px; border:1px solid rgba(9,25,70,.25);
  background:#fff; color:#0f1630; outline:none; text-align:center;
  transition:border-color .2s, box-shadow .2s, transform .05s;
}
input::placeholder{ color:#8190b3; }
input:focus{ border-color:#385fbe; box-shadow:0 0 0 3px rgba(56,95,190,.25); }

/* Acciones */
.actions{ display:grid; gap:12px; margin-top:4px; justify-items:center; text-align:center; }
.forgot-password-link{
  justify-self:center; color:#e9eeff; text-decoration:none; opacity:.95;
  font-size:.95rem; transition:opacity .2s, text-decoration-color .2s; text-decoration-color:transparent;
}
.forgot-password-link:hover{ opacity:1; text-decoration:underline; }

/* Botón */
.btn-primary{
  width:100%; height:52px; border:0; border-radius:12px; cursor:pointer;
  font-size:1.05rem; font-weight:800; letter-spacing:.3px; color:#0e254f;
  background:linear-gradient(180deg,#ffe37a,#ffbf2a);
  box-shadow:0 10px 22px rgba(0,0,0,.18), inset 0 -2px 0 rgba(0,0,0,.08);
  transition:transform .05s, filter .15s, box-shadow .2s;
}
.btn-primary:hover{ filter:brightness(.98); box-shadow:0 12px 26px rgba(0,0,0,.22), inset 0 -2px 0 rgba(0,0,0,.1); }
.btn-primary:active{ transform:translateY(1px); }

/* Mensajes */
.message-box{ margin-top:14px; border-radius:12px; padding:12px 40px 12px 14px; position:relative; font-size:.95rem; text-align:center; }
.message-box p{ margin:0; color:#fff; }
.message-box.info{ background:rgba(0,123,255,.88); }
.message-box.error{ background:rgba(220,53,69,.92); }
.message-box.success{ background:rgba(40,167,69,.9); }
.close-message-button{
  position:absolute; top:8px; right:8px; width:28px; height:28px; border:none; border-radius:50%;
  background:rgba(255,255,255,.2); color:#fff; font-size:18px; cursor:pointer; transition:background .2s;
}
.close-message-button:hover{ background:rgba(255,255,255,.3); }

/* --- MODO COMPACTO: evita scroll en pantallas pequeñas --- */
@media (max-width: 480px), (max-height: 720px){
  .login-form{ padding:14px; border-radius:14px; }
  .card-head{ margin-bottom:12px; }
  .titulo-login{ font-size:22px; }
  .subtitle{ font-size:12px; margin-top:4px; }
  input, .btn-primary{ height:46px; }
}

/* Súper compacto (cuando el alto es muy bajo) */
@media (max-height: 640px){
  .login-form{ padding:12px; }
  .card-head{ margin-bottom:10px; }
  .titulo-login{ font-size:20px; }
  .subtitle{ display:none; }      /* Ganamos ~20px sin perder contexto */
  input, .btn-primary{ height:44px; }
}
</style>
