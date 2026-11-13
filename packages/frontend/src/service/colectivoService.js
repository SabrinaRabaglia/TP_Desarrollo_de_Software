import api from "./api"

export const TIPOS_DE_COLECTIVO = [
  "Fundación",
  "Asociación barrial",
  "ONG",
  "Asamblea",
]

const aColectivo = (colectivoBack) => ({
  id: colectivoBack.id,
  nombre: colectivoBack.nombre,
  descripcion: colectivoBack.descripcion,
  tipo: colectivoBack.tipo,
  pais: colectivoBack.pais,
  provincia: colectivoBack.provincia,
  ciudad: colectivoBack.ciudad,
  proyectos: colectivoBack.proyectos ?? [],
})

const aOpcionDeCatalogo = ({ id, nombre }) => ({ id, nombre })

export const buscarColectivos = async () => {
  const response = await api.get("/colectivos")
  return response.data.map((colectivo) => aColectivo(colectivo))
}

export const obtenerColectivo = async (id) => {
  const response = await api.get(`/colectivos/${id}`)
  return aColectivo(response.data)
}

export const crearColectivo = async (nuevoColectivo) => {
  const response = await api.post("/colectivos", nuevoColectivo)
  return aColectivo(response.data)
}

export const actualizarColectivo = async (id, colectivoActualizado) => {
  const response = await api.put(`/colectivos/${id}`, colectivoActualizado)
  return aColectivo(response.data)
}

export const eliminarColectivo = async (id) => {
  await api.delete(`/colectivos/${id}`)
}

export const obtenerPaises = async () => {
  const response = await api.get("/paises")
  return response.data.map((pais) => aOpcionDeCatalogo(pais))
}

export const obtenerProvincias = async () => {
  const response = await api.get("/provincias")
  return response.data.map((provincia) => aOpcionDeCatalogo(provincia))
}
