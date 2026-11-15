import { Chip } from "@mui/material"
import { LuInfinity, LuUserCheck, LuUsers } from "react-icons/lu"

// Cupos de un perfil: sin límite, completo o cuántos quedan.
// `limite` vacío (null o undefined) significa que el perfil no tiene límite.
const describirCupos = (limite, aceptadas) => {
  if (limite == null) {
    return { texto: "Sin límite de cupos", color: "info", Icono: LuInfinity }
  }

  const disponibles = Math.max(limite - aceptadas, 0)

  if (disponibles === 0) {
    return {
      texto: `Cupo completo (${aceptadas} de ${limite})`,
      color: "default",
      Icono: LuUserCheck,
    }
  }

  return {
    texto:
      disponibles === 1
        ? `1 cupo disponible de ${limite}`
        : `${disponibles} cupos disponibles de ${limite}`,
    color: "success",
    Icono: LuUsers,
  }
}

const Cupos = ({ limite, aceptadas = 0, size = "small" }) => {
  const { texto, color, Icono } = describirCupos(limite, aceptadas)

  return (
    <Chip
      className="cupos"
      variant="suave"
      size={size}
      color={color}
      icon={<Icono aria-hidden="true" />}
      label={texto}
    />
  )
}

export default Cupos
