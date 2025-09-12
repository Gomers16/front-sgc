<!--
  Componente: LoginForm.vue
  Ubicación sugerida: src/components/login/LoginForm.vue  (o como vista: src/views/auth/LoginView.vue)
  Propósito: Renderiza el formulario de inicio de sesión (email + password), dispara authStore.login
             y muestra mensajes de feedback (info/éxito/error) en un “message-box”.
  Notas:
  - Este componente no redirige por sí mismo tras el login (solo muestra “Inicio de sesión exitoso”).
    Puedes redirigir desde aquí o hacerlo a nivel de vista/layout luego de validar el store.
  - Si deseas evitar dobles envíos, puedes agregar un “isLoading” y deshabilitar el botón mientras espera.
-->

<template>
  <div class="login-form">
    <!-- Título del formulario -->
    <h2 class="titulo-login">Bienvenido</h2>

    <!-- Manejo del submit:
         - @submit.prevent evita que el navegador recargue la página.
         - handlerLogin es la función que procesa el login. -->
    <form @submit.prevent="handlerLogin">
      <!-- Campo de correo -->
      <div class="input-group">
        <label for="email">Correo electrónico</label>
        <input
          type="email"
          id="email"
          v-model="email"
          placeholder="Ingresa tu correo"
          required
        />
      </div>

      <!-- Campo de contraseña -->
      <div class="input-group">
        <label for="password">Contraseña</label>
        <input
          type="password"
          id="password"
          v-model="password"
          placeholder="Ingresa tu contraseña"
          required
        />
      </div>

      <!-- Link para recuperar contraseña (navega a otra ruta) -->
      <div class="forgot-password-container">
        <router-link to="/reset-password" class="forgot-password-link">
          ¿Olvidó su contraseña?
        </router-link>
      </div>

      <!-- Botón principal de acción -->
      <button type="submit">Ingresar</button>
    </form>

    <!-- Caja de mensajes (info/error/success) -->
    <div v-if="message" :class="['message-box', messageType]">
      <p>{{ message }}</p>
      <!-- Botón para cerrar el mensaje -->
      <button @click="clearMessage" class="close-message-button">X</button>
    </div>
  </div>
</template>

<script setup lang="ts">
/*
  Script:
  - Maneja el estado local (email, password, message, messageType)
  - Invoca al store de autenticación (authStore.login)
  - Muestra feedback al usuario con showMessage/clearMessage
*/

import { ref } from 'vue'
import { authSetStore } from '@/stores/AuthStore.ts' // Asegúrate de que esta ruta coincida con tu proyecto

// Acceso al store de autenticación
const authStore = authSetStore()

// Estado del formulario
const email = ref('')               // Correo ingresado por el usuario
const password = ref('')            // Contraseña ingresada por el usuario

// Estado para feedback visual
const message = ref<string | null>(null)                 // Texto del mensaje mostrado al usuario
const messageType = ref<'success' | 'error' | 'info'>('info') // Tipo del mensaje: info/success/error

// Muestra un mensaje al usuario y lo oculta automáticamente a los 5s
const showMessage = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
  message.value = msg
  messageType.value = type
  setTimeout(() => {
    clearMessage()
  }, 5000)
}

// Limpia el mensaje actual
const clearMessage = () => {
  message.value = null
}

// Maneja el intento de login
// - Valida que existan email y password
// - Invoca authStore.login
// - Muestra el resultado por message-box
const handlerLogin = async () => {
  clearMessage() // Limpia cualquier mensaje previo

  // Validación mínima antes de llamar al store
  if (!email.value || !password.value) {
    showMessage('Por favor, completa todos los campos', 'info')
    return
  }

  try {
    // Llamada al store: implementa la lógica de login (API/Token/Session) allí
    await authStore.login({
      email: email.value,
      password: password.value,
    })

    // Si el login es exitoso, mostramos feedback positivo
    // Sugerencia: aquí también podrías redirigir a /dashboard u otra ruta
    showMessage('Inicio de sesión exitoso', 'success')
  } catch (error) {
    // Si falla: credenciales inválidas, error de red, etc.
    showMessage('Credenciales incorrectas o error de conexión', 'error')
    console.error(error)
  }
}
</script>

<style scoped>
/* ========= CONTENEDOR PRINCIPAL ========= */
.login-form {
  width: 90%;                /* Formulario responsivo (ocupa la mayor parte del ancho en móviles) */
  max-width: 400px;          /* Ancho máximo para mantenerlo legible en pantallas grandes */
  padding: 2.8rem;           /* Espaciado interno para comodidad visual */
  background: rgba(255, 255, 255, 0.15); /* Fondo translúcido (efecto “glass”) */
  backdrop-filter: blur(10px);
  border-radius: 12px;       /* Bordes redondeados */
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2); /* Sombra suave */
  text-align: center;
  margin: 0 auto;            /* Centrado horizontal */
}

/* Título del login */
.titulo-login {
  color: white;
  font-size: 1.8rem;
  margin-bottom: 1rem;
  text-align: center;
  font-weight: bold;
}

/* ========= CAMPOS ========= */
.input-group {
  margin-bottom: 0.5rem;
  text-align: left;
}

label {
  display: block;
  font-size: 1.05rem;
  color: white;
  margin-bottom: 0.5rem;
}

input {
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  outline: none;
  background-color: white;
  color: black;
  text-align: center;
  box-sizing: border-box;
}

/* ========= LINK RECUPERAR CONTRASEÑA ========= */
.forgot-password-container {
  text-align: center;
  margin-bottom: 1.5rem;
}

.forgot-password-link {
  color: #a0a0a0;
  text-decoration: none;
  font-size: 1.05rem;
  transition: color 0.3s ease;
}

.forgot-password-link:hover {
  color: #ffffff;
}

/* ========= BOTÓN SUBMIT ========= */
button {
  width: 100%;           /* 100% en móviles por defecto */
  padding: 1.1rem;
  border: none;
  background: #f5f6f8;
  color: rgb(2, 34, 102);
  font-size: 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
  box-sizing: border-box;
}

button:hover {
  background: #0056b3;
  color: white;
}

/* En pantallas >= 768px, reduce el ancho del botón para estética */
@media (min-width: 768px) {
  button {
    width: 65%;
  }
}

/* ========= MESSAGE BOX (feedback) ========= */
.message-box {
  padding: 1rem;
  margin-top: 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  position: relative;
  text-align: left;
}

.message-box p {
  margin: 0;
  color: white;
}

/* Colores según el tipo de mensaje */
.message-box.info {
  background-color: rgba(0, 123, 255, 0.8);
}
.message-box.error {
  background-color: rgba(220, 53, 69, 0.8);
}
.message-box.success {
  background-color: rgba(40, 167, 69, 0.8);
}

/* Botón para cerrar el mensaje */
.close-message-button {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  border-radius: 50%;
  transition: background 0.2s;
}
.close-message-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}
</style>
