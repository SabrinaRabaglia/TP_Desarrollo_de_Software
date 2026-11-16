import api from "./api"

const aOpcion = (opcionBack) => ({
  id: opcionBack.id,
  nombre: opcionBack.nombre,
})

// La ubicación es opcional y el PUT reemplaza el colectivo entero: lo que
// queda vacío viaja como null para que el backend lo borre.
const aColectivoBack = (colectivo) => ({
  nombre: colectivo.nombre.trim(),
  descripcion: colectivo.descripcion.trim(),
  tipo: colectivo.tipo,
  pais: colectivo.pais || null,
  provincia: colectivo.provincia || null,
  ciudad: colectivo.ciudad.trim() || null,
})

const aColectivo = (colectivoBack) => ({
  id: colectivoBack.id,
  nombre: colectivoBack.nombre,
  descripcion: colectivoBack.descripcion,
  tipo: colectivoBack.tipo,
  ubicacion:
    [
      colectivoBack.ciudad,
      colectivoBack.provincia?.nombre,
      colectivoBack.pais?.nombre,
    ]
      .filter(Boolean)
      .join(", ") || null,
})

const aColectivoDelFormulario = (colectivoBack) => ({
  nombre: colectivoBack.nombre,
  descripcion: colectivoBack.descripcion,
  tipo: colectivoBack.tipo,
  pais: colectivoBack.pais?.id ?? "",
  provincia: colectivoBack.provincia?.id ?? "",
  ciudad: colectivoBack.ciudad ?? "",
})

export const obtenerCatalogosDeColectivo = async () => {
  const [tipos, paises, provincias] = await Promise.all([
    api.get("/tipos-de-colectivo"),
    api.get("/paises"),
    api.get("/provincias"),
  ])
  return {
    tipos: tipos.data.map(aOpcion),
    paises: paises.data.map(aOpcion),
    provincias: provincias.data.map(aOpcion),
  }
}

export const registrarColectivo = async ({ email, contrasena, colectivo }) => {
  const response = await api.post("/auth/registro/colectivo", {
    email,
    contrasena,
    colectivo: aColectivoBack(colectivo),
  })
  return response.data
}

export const obtenerColectivo = async (id) => {
  const response = await api.get(`/colectivos/${id}`)
  return aColectivo(response.data)
}

export const obtenerColectivoPropio = async (id) => {
  const response = await api.get(`/colectivos/${id}`)
  return aColectivoDelFormulario(response.data)
}

export const actualizarColectivo = async (id, colectivo) => {
  await api.put(`/colectivos/${id}`, aColectivoBack(colectivo))
}
