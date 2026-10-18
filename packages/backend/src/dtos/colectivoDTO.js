import { catalogoDTO } from "./catalogoDTO.js"
import { proyectoDTO } from "./proyectoDTO.js"

export const colectivoDTO = ({ colectivo, proyectos }) => ({
  id: colectivo.id,
  nombre: colectivo.nombre,
  descripcion: colectivo.descripcion,
  tipo: colectivo.tipo,
  pais: catalogoDTO(colectivo.pais),
  provincia: catalogoDTO(colectivo.provincia),
  ciudad: colectivo.ciudad,
  proyectos: proyectos.map(proyectoDTO),
})
