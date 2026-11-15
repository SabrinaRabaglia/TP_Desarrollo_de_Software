import { Chip } from "@mui/material"
import {
  LuCircleCheck,
  LuCircleDot,
  LuCircleMinus,
  LuCircleX,
  LuClock,
  LuUserMinus,
} from "react-icons/lu"
import { ESTADOS_DE_POSTULACION } from "../../service/postulacionesService"
import { ESTADOS_DE_PROYECTO } from "../../service/proyectosService"
import "./EstadoChip.css"

// Las claves son los estados tal como los manda el back. Los de proyecto y
// los de postulación no comparten nombres, así que alcanza con el estado.
const ESTADOS = {
  PUBLICADO: {
    etiqueta: ESTADOS_DE_PROYECTO.PUBLICADO,
    color: "success",
    Icono: LuCircleDot,
  },
  CERRADO: {
    etiqueta: ESTADOS_DE_PROYECTO.CERRADO,
    color: "default",
    Icono: LuCircleMinus,
  },
  PENDIENTE: {
    etiqueta: ESTADOS_DE_POSTULACION.PENDIENTE,
    color: "warning",
    Icono: LuClock,
  },
  ACEPTADA: {
    etiqueta: ESTADOS_DE_POSTULACION.ACEPTADA,
    color: "success",
    Icono: LuCircleCheck,
  },
  RECHAZADA: {
    etiqueta: ESTADOS_DE_POSTULACION.RECHAZADA,
    color: "error",
    Icono: LuCircleX,
  },
  BAJA: {
    etiqueta: ESTADOS_DE_POSTULACION.BAJA,
    color: "default",
    Icono: LuUserMinus,
  },
}

// El ícono acompaña al texto: el estado nunca se comunica solo con color.
const EstadoChip = ({ estado, size = "small" }) => {
  const { etiqueta, color, Icono } = ESTADOS[estado] ?? {
    etiqueta: estado,
    color: "default",
  }

  return (
    <Chip
      className={`estado-chip estado-chip-${estado?.toLowerCase()}`}
      variant="suave"
      size={size}
      color={color}
      icon={Icono && <Icono aria-hidden="true" />}
      label={etiqueta}
    />
  )
}

export default EstadoChip
