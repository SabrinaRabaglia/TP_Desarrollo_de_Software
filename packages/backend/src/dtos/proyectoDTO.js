import { perfilDTO } from "./perfilDTO.js"

export const proyectoDTO = (proyecto) => ({
  id: proyecto.id,
  titulo: proyecto.titulo,
  descripcion: proyecto.descripcion,
  estado: proyecto.estado,
  fechaAlta: proyecto.fechaAlta,
  fechaCierre: proyecto.fechaCierre,
  colectivo: proyecto.colectivo,
  perfiles: proyecto.perfiles.map(perfilDTO),
  createdAt: proyecto.createdAt,
  updatedAt: proyecto.updatedAt,
})
