import api from "./api"

const aHabilidad = (habilidadBack) => ({
  id: habilidadBack.id,
  titulo: habilidadBack.titulo,
})

export const obtenerHabilidades = async () => {
  const response = await api.get("/habilidades")
  return response.data.map(aHabilidad)
}
