import { Chip } from "@mui/material"
import { LuCircleCheck, LuCircleDashed } from "react-icons/lu"

// Las claves son los niveles tal como los manda el back.
const NIVELES = {
  TOTAL: {
    etiqueta: "Coincidencia total",
    color: "success",
    Icono: LuCircleCheck,
  },
  PARCIAL: {
    etiqueta: "Coincidencia parcial",
    color: "warning",
    Icono: LuCircleDashed,
  },
}

// Cuánto de lo que pide un perfil cubre una persona. El ícono acompaña al
// texto: el nivel nunca se comunica solo con color.
const Coincidencia = ({ nivel, size = "small" }) => {
  const { etiqueta, color, Icono } = NIVELES[nivel] ?? {
    etiqueta: nivel,
    color: "default",
  }

  return (
    <Chip
      variant="suave"
      size={size}
      color={color}
      icon={Icono && <Icono aria-hidden="true" />}
      label={etiqueta}
    />
  )
}

export default Coincidencia
