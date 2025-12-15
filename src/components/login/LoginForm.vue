<!--
📌 LoginForm.vue
Formulario de inicio de sesión completamente responsive

✅ Características:
   - Desktop (>1024px): Card amplio, inputs espaciados
   - Tablet (480-1024px): Card medio, botones adaptados
   - Móvil (<480px): Card compacto, inputs optimizados
   - Pantallas bajas: Formulario compacto sin scroll
   - Glassmorphism effect
   - Validación en tiempo real
   - Feedback visual (success/error/info)

💡 Ubicación: src/components/login/LoginForm.vue
-->

<template>
  <div class="login-form auth-card">
    <!-- Encabezado -->
    <div class="card-head">
      <h2 class="titulo-login">Bienvenido</h2>
      <p class="subtitle">Ingresa con tus credenciales para continuar</p>
    </div>

    <!-- Formulario -->
    <form @submit.prevent="handlerLogin" class="card-body">
      <!-- Email -->
      <div class="input-group">
        <label for="email">Correo electrónico</label>
        <input
          type="email"
          id="email"
          v-model="email"
          placeholder="correo@ejemplo.com"
          autocomplete="username"
          required
          :disabled="isLoading"
        />
      </div>

      <!-- Password -->
      <div class="input-group">
        <label for="password">Contraseña</label>
        <input
          type="password"
          id="password"
          v-model="password"
          placeholder="••••••••"
          autocomplete="current-password"
          required
          :disabled="isLoading"
        />
      </div>

      <!-- Acciones -->
      <div class="actions">
        <router-link to="/reset-password" class="forgot-password-link">
          ¿Olvidó su contraseña?
        </router-link>

        <button
          type="submit"
          class="btn-primary"
          :disabled="isLoading"
        >
          <span v-if="!isLoading">Ingresar</span>
          <span v-else class="loading-text">
            <span class="spinner"></span>
            Ingresando...
          </span>
        </button>
      </div>
    </form>

    <!-- Mensaje de feedback -->
    <div v-if="message" :class="['message-box', messageType]">
      <p>{{ message }}</p>
      <button
        @click="clearMessage"
        class="close-message-button"
        aria-label="Cerrar"
        type="button"
      >
        ×
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { authSetStore } from '@/stores/AuthStore.ts'

const authStore = authSetStore()

// Estado del formulario
const email = ref('')
const password = ref('')
const isLoading = ref(false)

// Estado de mensajes
const message = ref<string | null>(null)
const messageType = ref<'success' | 'error' | 'info'>('info')

// Muestra mensaje con timeout automático
const showMessage = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
  message.value = msg
  messageType.value = type
  setTimeout(() => clearMessage(), 5000)
}

// Limpia el mensaje
const clearMessage = () => {
  message.value = null
}

// Handler del login
const handlerLogin = async () => {
  clearMessage()

  // Validación básica
  if (!email.value || !password.value) {
    showMessage('Por favor, completa todos los campos', 'info')
    return
  }

  // Validación de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    showMessage('Por favor, ingresa un correo válido', 'error')
    return
  }

  isLoading.value = true

  try {
    await authStore.login({
      email: email.value.trim(),
      password: password.value,
    })

    showMessage('Inicio de sesión exitoso', 'success')
    // Aquí puedes redirigir: router.push('/dashboard')
 } catch (error: unknown) {
  let errorMsg = 'Credenciales incorrectas o error de conexión'

  if (error instanceof Error) {
    const err = error as { response?: { data?: { message?: string } } }
    errorMsg = err.response?.data?.message || error.message || errorMsg
  }

  showMessage(errorMsg, 'error')
  console.error('Login error:', error)
} finally {
  isLoading.value = false
}
}
</script>

<style scoped>
/* ========= VARIABLES ========= */
:root {
  --color-primary: #21478d;
  --color-white: #ffffff;
  --color-glass: rgba(255, 255, 255, 0.22);
  --color-border: rgba(255, 255, 255, 0.28);
  --color-text: #ffffff;
  --color-input-bg: #ffffff;
  --color-input-text: #0f1630;
  --color-placeholder: #8190b3;
  --color-focus: #385fbe;
  --color-button-bg: linear-gradient(180deg, #ffe37a, #ffbf2a);
  --color-button-text: #0e254f;
  --shadow-card: 0 14px 36px rgba(0, 0, 0, 0.28);
  --shadow-input: 0 2px 8px rgba(0, 0, 0, 0.12);
  --shadow-button: 0 10px 22px rgba(0, 0, 0, 0.18), inset 0 -2px 0 rgba(0, 0, 0, 0.08);
}

/* ========= CARD PRINCIPAL ========= */
.login-form {
  position: relative;
  width: min(100%, 520px);
  margin: 0 auto;
  padding: clamp(20px, 3.5vw, 32px);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.28),
    rgba(255, 255, 255, 0.18)
  );
  border: 1px solid var(--color-border);
  border-radius: clamp(14px, 2vw, 18px);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: var(--shadow-card);
  color: var(--color-text);
  box-sizing: border-box;
}

/* ========= ENCABEZADO ========= */
.card-head {
  text-align: center;
  margin-bottom: clamp(16px, 3vh, 24px);
}

.titulo-login {
  margin: 0;
  padding: 0;
  font-weight: 800;
  line-height: 1.1;
  font-size: clamp(24px, 4vw, 32px);
  color: var(--color-white);
  text-shadow: 0 3px 10px rgba(0, 0, 0, 0.4);
  letter-spacing: .3px;
}

.subtitle {
  margin: clamp(6px, 1vh, 10px) 0 0;
  padding: 0;
  font-size: clamp(13px, 2vw, 15px);
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.4;
}

/* ========= FORMULARIO ========= */
.card-body {
  display: grid;
  gap: clamp(14px, 2.5vh, 20px);
  text-align: left;
}

.input-group {
  display: grid;
  gap: clamp(6px, 1vh, 10px);
}

.input-group label {
  display: block;
  font-size: clamp(14px, 2vw, 15px);
  font-weight: 600;
  color: var(--color-white);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

/* ========= INPUTS ========= */
input {
  width: 100%;
  height: clamp(48px, 6vh, 54px);
  padding: 0 clamp(12px, 2vw, 16px);
  box-sizing: border-box;
  border-radius: clamp(10px, 1.5vw, 12px);
  border: 1px solid rgba(9, 25, 70, 0.25);
  background: var(--color-input-bg);
  color: var(--color-input-text);
  font-size: clamp(14px, 2vw, 16px);
  outline: none;
  text-align: center;
  box-shadow: var(--shadow-input);
  transition: all 0.2s ease;
}

input::placeholder {
  color: var(--color-placeholder);
  opacity: 0.8;
}

input:focus {
  border-color: var(--color-focus);
  box-shadow: 0 0 0 3px rgba(56, 95, 190, 0.25), var(--shadow-input);
  transform: translateY(-1px);
}

input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ========= ACCIONES ========= */
.actions {
  display: grid;
  gap: clamp(12px, 2vh, 16px);
  margin-top: clamp(4px, 1vh, 8px);
  text-align: center;
}

.forgot-password-link {
  color: rgba(255, 255, 255, 0.95);
  text-decoration: none;
  font-size: clamp(13px, 1.8vw, 14px);
  font-weight: 500;
  transition: all 0.2s ease;
  text-decoration-color: transparent;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.forgot-password-link:hover {
  color: var(--color-white);
  text-decoration: underline;
  text-decoration-color: currentColor;
}

/* ========= BOTÓN PRINCIPAL ========= */
.btn-primary {
  position: relative;
  width: 100%;
  height: clamp(50px, 6.5vh, 56px);
  border: 0;
  border-radius: clamp(10px, 1.5vw, 12px);
  cursor: pointer;
  font-size: clamp(15px, 2.2vw, 17px);
  font-weight: 800;
  letter-spacing: .4px;
  color: var(--color-button-text);
  background: var(--color-button-bg);
  box-shadow: var(--shadow-button);
  transition: all 0.15s ease;
  overflow: hidden;
}

.btn-primary:hover:not(:disabled) {
  filter: brightness(0.98);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.24), inset 0 -2px 0 rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.16), inset 0 -1px 0 rgba(0, 0, 0, 0.08);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  filter: grayscale(20%);
}

/* ========= LOADING ========= */
.loading-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(14, 37, 79, 0.3);
  border-top-color: var(--color-button-text);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ========= MENSAJES ========= */
.message-box {
  position: relative;
  margin-top: clamp(14px, 2.5vh, 20px);
  padding: clamp(12px, 2vh, 16px) clamp(40px, 6vw, 50px) clamp(12px, 2vh, 16px) clamp(14px, 2.5vw, 18px);
  border-radius: clamp(10px, 1.5vw, 12px);
  font-size: clamp(13px, 1.9vw, 15px);
  line-height: 1.5;
  text-align: left;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.message-box p {
  margin: 0;
  color: var(--color-white);
  font-weight: 500;
}

.message-box.info {
  background: rgba(0, 123, 255, 0.9);
}

.message-box.error {
  background: rgba(220, 53, 69, 0.92);
}

.message-box.success {
  background: rgba(40, 167, 69, 0.9);
}

.close-message-button {
  position: absolute;
  top: clamp(8px, 1.5vh, 12px);
  right: clamp(8px, 1.5vw, 12px);
  width: clamp(26px, 4vw, 32px);
  height: clamp(26px, 4vh, 32px);
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  color: var(--color-white);
  font-size: clamp(18px, 3vw, 22px);
  font-weight: bold;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-message-button:hover {
  background: rgba(255, 255, 255, 0.35);
  transform: scale(1.05);
}

/* ========= DESKTOP (>1024px) ========= */
@media (min-width: 1025px) {
  .login-form {
    width: min(100%, 540px);
    padding: 32px;
  }

  input {
    height: 54px;
    font-size: 16px;
  }

  .btn-primary {
    height: 56px;
    font-size: 17px;
  }
}

/* ========= TABLET (481px - 1024px) ========= */
@media (min-width: 481px) and (max-width: 1024px) {
  .login-form {
    width: min(100%, 480px);
    padding: clamp(24px, 4vw, 28px);
  }

  input {
    height: 52px;
  }

  .btn-primary {
    height: 54px;
  }
}

/* ========= MÓVIL (<480px) ========= */
@media (max-width: 480px) {
  .login-form {
    width: 100%;
    padding: 18px;
    border-radius: 14px;
  }

  .card-head {
    margin-bottom: 16px;
  }

  .titulo-login {
    font-size: 22px;
  }

  .subtitle {
    font-size: 13px;
    margin-top: 6px;
  }

  input {
    height: 48px;
    font-size: 15px;
  }

  .btn-primary {
    height: 50px;
    font-size: 16px;
  }

  .message-box {
    padding: 12px 38px 12px 12px;
  }
}

/* ========= PANTALLAS BAJAS - Evita Scroll ========= */
@media (max-height: 720px) {
  .login-form {
    padding: clamp(16px, 2.5vh, 20px);
  }

  .card-head {
    margin-bottom: 14px;
  }

  .card-body {
    gap: 14px;
  }

  input,
  .btn-primary {
    height: 48px;
  }
}

@media (max-height: 640px) {
  .login-form {
    padding: 14px;
  }

  .card-head {
    margin-bottom: 12px;
  }

  .titulo-login {
    font-size: 20px;
  }

  .subtitle {
    display: none; /* Gana espacio vertical */
  }

  .card-body {
    gap: 12px;
  }

  input,
  .btn-primary {
    height: 46px;
  }

  .actions {
    gap: 10px;
    margin-top: 4px;
  }
}

@media (max-height: 560px) {
  .login-form {
    padding: 12px;
  }

  .card-head {
    margin-bottom: 10px;
  }

  .titulo-login {
    font-size: 18px;
  }

  .card-body {
    gap: 10px;
  }

  input,
  .btn-primary {
    height: 44px;
  }

  .input-group {
    gap: 6px;
  }

  .message-box {
    margin-top: 10px;
    padding: 10px 36px 10px 10px;
  }
}

/* ========= LANDSCAPE MÓVIL ========= */
@media (max-width: 812px) and (max-height: 480px) and (orientation: landscape) {
  .login-form {
    padding: 12px 20px;
  }

  .card-head {
    margin-bottom: 10px;
  }

  .subtitle {
    display: none;
  }

  .card-body {
    gap: 10px;
  }

  input,
  .btn-primary {
    height: 44px;
  }
}

/* ========= ACCESIBILIDAD ========= */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Focus visible para teclado */
input:focus-visible,
.btn-primary:focus-visible,
.forgot-password-link:focus-visible {
  outline: 3px solid rgba(255, 255, 255, 0.6);
  outline-offset: 2px;
}
</style>
