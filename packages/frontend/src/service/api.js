import axios from "axios"

const CLAVE_SESION = "sesion"

export const leerSesionGuardada = () =>
  JSON.parse(localStorage.getItem(CLAVE_SESION))

export const guardarSesion = (sesion) => {
  if (sesion) {
    localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion))
  } else {
    localStorage.removeItem(CLAVE_SESION)
  }
}

let alPerderSesion = () => {}

export const registrarAlPerderSesion = (callback) => {
  alPerderSesion = callback
}

const api = axios.create({
 // baseURL: process.env.REACT_APP_API_URL,
 baseURL: "http://localhost:8000",
  paramsSerializer: { indexes: null },
})

api.interceptors.request.use((config) => {
  const sesion = leerSesionGuardada()
  if (sesion) {
    config.headers.Authorization = `Bearer ${sesion.token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      alPerderSesion()
    }
    return Promise.reject(error)
  },
)

// Sin respuesta del servidor es un problema de conexión; con respuesta (o un
// error propio del front) no lo es, y no hay que decir que lo fue.
export const mensajeDeError = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  if (error.isAxiosError && !error.response) {
    return "No pudimos conectarnos con el servidor"
  }
  return "Ocurrió un error inesperado"
}

export default api
