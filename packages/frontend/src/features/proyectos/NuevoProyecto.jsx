import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { useAvisos } from "../../context/AvisosContext"
import { mensajeDeError } from "../../service/api"
import { crearProyecto } from "../../service/proyectosService"
import FormularioProyecto from "./FormularioProyecto"
import "./NuevoProyecto.css"

const NuevoProyecto = () => {
  const { usuario } = useAuth()
  const { mostrarAviso } = useAvisos()
  const navigate = useNavigate()

  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  const crear = async (proyecto) => {
    setEnviando(true)
    setError(null)
    try {
      const id = await crearProyecto(usuario.entidad.id, proyecto)
      mostrarAviso(
        "Creaste el proyecto. Ahora agregale los perfiles que buscás.",
      )
      // Con replace, volver atrás no trae de nuevo el formulario ya enviado.
      navigate(`/proyectos/${id}`, { replace: true })
    } catch (e) {
      setError(mensajeDeError(e))
      setEnviando(false)
    }
  }

  return (
    <section className="nuevo-proyecto">
      <header className="nuevo-proyecto-encabezado">
        <h1>Crear un proyecto</h1>
        <p>
          El proyecto queda publicado apenas lo creás. Después le agregás los
          perfiles que buscás, desde su página.
        </p>
      </header>
      <FormularioProyecto
        textoBoton="Crear proyecto"
        textoEnviando="Creando..."
        rutaCancelar="/"
        enviando={enviando}
        error={error}
        alGuardar={crear}
      />
    </section>
  )
}

export default NuevoProyecto
