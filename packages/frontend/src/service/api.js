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
  baseURL: process.env.REACT_APP_API_URL,
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

export const mensajeDeError = (error) =>
  error.response?.data?.message ?? "No pudimos conectarnos con el servidor"

export default api
