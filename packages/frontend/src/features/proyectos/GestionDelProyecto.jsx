import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@mui/material"
import { LuLock, LuPencil, LuTrash2 } from "react-icons/lu"
import ConfirmarAccion from "../../components/confirmarAccion/ConfirmarAccion"
import MensajeDeError from "../../components/mensajeDeError/MensajeDeError"
import { useAvisos } from "../../context/AvisosContext"
import { mensajeDeError } from "../../service/api"
import {
  cerrarProyecto,
  eliminarProyecto,
} from "../../service/proyectosService"
import "./GestionDelProyecto.css"

// Lo que el colectivo dueño puede hacer con su proyecto: editarlo, cerrarlo y
// borrarlo. Cerrar y borrar no tienen vuelta atrás y piden confirmación.
const GestionDelProyecto = ({ proyecto, alModificar }) => {
  const navigate = useNavigate()
  const { mostrarAviso } = useAvisos()
  // Qué se está confirmando y qué se está enviando: "CERRAR", "BORRAR" o null.
  const [dialogo, setDialogo] = useState(null)
  const [enviando, setEnviando] = useState(null)
  const [error, setError] = useState(null)

  const ejecutar = async (accion, enviar) => {
    setDialogo(null)
    setEnviando(accion)
    setError(null)
    try {
      await enviar()
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setEnviando(null)
    }
  }

  const cerrar = () =>
    ejecutar("CERRAR", async () => {
      await cerrarProyecto(proyecto.id)
      mostrarAviso(`Cerraste el proyecto ${proyecto.titulo}.`)
      await alModificar()
    })

  const borrar = () =>
    ejecutar("BORRAR", async () => {
      await eliminarProyecto(proyecto.id)
      mostrarAviso(`Borraste el proyecto ${proyecto.titulo}.`)
      navigate("/", { replace: true })
    })

  return (
    <div className="gestion-del-proyecto">
      <div
        className="gestion-del-proyecto-acciones"
        role="group"
        aria-label="Gestión del proyecto"
      >
        <Button
          variant="outlined"
          color="inherit"
          size="small"
          component={Link}
          to={`/proyectos/${proyecto.id}/edicion`}
          startIcon={<LuPencil aria-hidden="true" />}
        >
          Editar proyecto
        </Button>
        {proyecto.estado === "PUBLICADO" && (
          <Button
            variant="outlined"
            color="inherit"
            size="small"
            onClick={() => setDialogo("CERRAR")}
            loading={enviando === "CERRAR"}
            disabled={enviando !== null}
            startIcon={<LuLock aria-hidden="true" />}
          >
            Cerrar proyecto
          </Button>
        )}
        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={() => setDialogo("BORRAR")}
          loading={enviando === "BORRAR"}
          disabled={enviando !== null}
          startIcon={<LuTrash2 aria-hidden="true" />}
        >
          Borrar proyecto
        </Button>
      </div>
      {error && <MensajeDeError mensaje={error} />}

      <ConfirmarAccion
        abierto={dialogo === "CERRAR"}
        titulo="Cerrar proyecto"
        mensaje={`Vas a cerrar ${proyecto.titulo}. Nadie más va a poder postularse y sus perfiles ya no se van a poder modificar. Esta acción no se puede deshacer: un proyecto cerrado no se vuelve a abrir.`}
        textoConfirmar="Sí, cerrar"
        alConfirmar={cerrar}
        alCancelar={() => setDialogo(null)}
      />
      <ConfirmarAccion
        abierto={dialogo === "BORRAR"}
        titulo="Borrar proyecto"
        mensaje={`Vas a borrar ${proyecto.titulo} con todos sus perfiles y logros. Esta acción no se puede deshacer.`}
        textoConfirmar="Sí, borrar"
        alConfirmar={borrar}
        alCancelar={() => setDialogo(null)}
      />
    </div>
  )
}

export default GestionDelProyecto
