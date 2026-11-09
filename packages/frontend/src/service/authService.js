import api from "./api"

export const ROLES = {
  COLECTIVO: "Colectivo",
  PERSONA_COLABORADORA: "Persona colaboradora",
}

const aUsuario = (usuarioBack) => ({
  id: usuarioBack.id,
  email: usuarioBack.email,
  rol: usuarioBack.rol,
  entidad: usuarioBack.entidad ?? null,
  nombre: usuarioBack.entidad?.nombre ?? usuarioBack.email,
})

export const iniciarSesion = async (email, contrasena) => {
  const response = await api.post("/auth/login", { email, contrasena })
  return {
    token: response.data.token,
    usuario: aUsuario(response.data.usuario),
  }
}

export const obtenerUsuarioActual = async () => {
  const response = await api.get("/auth/me")
  return aUsuario(response.data)
}
