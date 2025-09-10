<template>
  <div class="login-form">
    <h2 class="titulo-login">Bienvenido</h2>
    <form @submit.prevent="handlerLogin">
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

      <div class="forgot-password-container">
        <router-link to="/reset-password" class="forgot-password-link">
          ¿Olvidó su contraseña?
        </router-link>
      </div>

      <button type="submit">Ingresar</button>
    </form>

    <!-- Mensaje personalizado para errores/avisos -->
    <div v-if="message" :class="['message-box', messageType]">
      <p>{{ message }}</p>
      <button @click="clearMessage" class="close-message-button">X</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { authSetStore } from '@/stores/AuthStore.ts' // Asegúrate de que la ruta sea correcta

const authStore = authSetStore()
const email = ref('')
const password = ref('')
const message = ref<string | null>(null)
const messageType = ref<'success' | 'error' | 'info'>('info')

// Función para mostrar mensajes al usuario
const showMessage = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
  message.value = msg
  messageType.value = type
  // Opcional: ocultar el mensaje después de un tiempo
  setTimeout(() => {
    clearMessage()
  }, 5000)
}

// Función para limpiar el mensaje
const clearMessage = () => {
  message.value = null
}

const handlerLogin = async () => {
  clearMessage() // Limpiar mensajes anteriores
  if (!email.value || !password.value) {
    showMessage('Por favor, completa todos los campos', 'info')
    return
  }

  try {
    await authStore.login({
      email: email.value,
      password: password.value,
    })
    // Si el login es exitoso, podrías redirigir o mostrar un mensaje de éxito
    showMessage('Inicio de sesión exitoso', 'success')
  } catch (error) {
    showMessage('Credenciales incorrectas o error de conexión', 'error')
    console.error(error)
  }
}
</script>

<style scoped>
/* Contenedor principal del formulario */
.login-form {
  width: 90%; /* Ocupa el 90% del ancho disponible */
  max-width: 400px; /* Aumenta el ancho máximo para el formulario un poco más */
  padding: 2.8rem; /* Aumenta el padding responsivo con rem para hacerlo más grande */
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
  text-align: center;
  margin: 0 auto; /* Mantenemos el margen automático para centrado horizontal */
}

.titulo-login {
  color: white;
  font-size: 1.8rem; /* Usamos rem para el tamaño de fuente, un poco más grande */
  margin-bottom: 1rem; /* Usamos rem para el margen */
  text-align: center;
  font-weight: bold;
}

.input-group {
  margin-bottom: 0.5rem; /* Usamos rem para el margen */
  text-align: left;
}

label {
  display: block;
  font-size: 1.05rem; /* Usamos rem, un poco más grande */
  color: white;
  margin-bottom: 0.5rem; /* Usamos rem */
}

input {
  width: 100%;
  padding: 1rem; /* Usamos rem, un poco más grande */
  border: none;
  border-radius: 8px;
  outline: none;
  background-color: white;
  color: black;
  text-align: center;
  box-sizing: border-box; /* Asegura que el padding no aumente el ancho total */
}

.forgot-password-container {
  text-align: center;
  margin-bottom: 1.5rem; /* Usamos rem */
}

.forgot-password-link {
  color: #a0a0a0;
  text-decoration: none;
  font-size: 1.05rem; /* Usamos rem, un poco más grande */
  transition: color 0.3s ease;
}

.forgot-password-link:hover {
  color: #ffffff;
}

button {
  width: 100%; /* Por defecto, 100% en móviles */
  padding: 1.1rem; /* Usamos rem, un poco más grande */
  border: none;
  background: #f5f6f8;
  color: rgb(2, 34, 102);
  font-size: 1.2rem; /* Usamos rem, un poco más grande */
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
  box-sizing: border-box; /* Asegura que el padding no aumente el ancho total */
}

button:hover {
  background: #0056b3;
  color: white;
}

/* Media Query para pantallas más grandes (ej. tabletas y escritorios) */
@media (min-width: 768px) {
  button {
    width: 65%; /* Aumenta el ancho del botón en pantallas más grandes */
  }
}

/* Estilos para el mensaje personalizado */
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

.message-box.info {
  background-color: rgba(0, 123, 255, 0.8); /* Azul para info */
}

.message-box.error {
  background-color: rgba(220, 53, 69, 0.8); /* Rojo para error */
}

.message-box.success {
  background-color: rgba(40, 167, 69, 0.8); /* Verde para éxito */
}

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
