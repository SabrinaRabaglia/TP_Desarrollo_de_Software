import api from "./api"
import { MODALIDADES, UNIDADES_DE_COMPROMISO } from "./proyectosService"

export const ORDENES = {
  recientes: "Más recientes primero",
  antiguos: "Más antiguos primero",
}

// El back manda los cupos que quedan; `Cupos` se arma con el límite y las
// colaboraciones aceptadas.
const aceptadasDe = ({ limiteColaboraciones, cuposDisponibles }) =>
  limiteColaboraciones == null ? 0 : limiteColaboraciones - cuposDisponibles

const aResultado = ({
  proyecto,
  perfil,
  coincidencia,
  habilidadesRequeridasFaltantes,
}) => ({
  proyecto: {
    id: proyecto.id,
    titulo: proyecto.titulo,
    colectivo: proyecto.colectivo.nombre,
  },
  perfil: {
    id: perfil.id,
    nombre: perfil.nombre ?? "Perfil sin nombre",
    compromiso: `${perfil.cantidadHoras} ${UNIDADES_DE_COMPROMISO[perfil.unidadCompromiso]}`,
    modalidades: perfil.modalidadesColaboracion.map(
      (modalidad) => MODALIDADES[modalidad],
    ),
    limite: perfil.limiteColaboraciones,
    aceptadas: aceptadasDe(perfil),
  },
  coincidencia,
  faltantes: habilidadesRequeridasFaltantes.map(
    (habilidad) => habilidad.titulo,
  ),
})

// Perfiles con la búsqueda abierta que piden alguna de esas habilidades. La
// coincidencia, los cupos y el orden los resuelve el back.
export const buscarPerfiles = async ({ habilidades, modalidad, orden }) => {
  const response = await api.get("/perfiles", {
    params: {
      habilidades,
      modalidad: modalidad || undefined,
      orden: orden || undefined,
      limit: 50,
    },
  })
  return response.data.data.map(aResultado)
}
