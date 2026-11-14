import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import Cargando from "../../components/cargando/Cargando"
import MensajeDeError from "../../components/mensajeDeError/MensajeDeError"
import { useAuth } from "../../context/AuthContext"
import {
  ESTADOS_DE_PROYECTO,
  obtenerProyecto,
} from "../../service/proyectosService"
import { mensajeDeError } from "../../service/api"
import PerfilRequerido from "./PerfilRequerido"
import "./PaginaProyecto.css"

const PaginaProyecto = () => {
  const { id } = useParams()
  const { usuario } = useAuth()

  const [proyecto, setProyecto] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      setError(null)
      try {
        setProyecto(await obtenerProyecto(id))
      } catch (e) {
        if (e.response?.status === 404) {
          setError("Proyecto no encontrado")
        } else {
          setError(mensajeDeError(e))
        }
      } finally {
        setCargando(false)
      }
    }

    cargar()
  }, [id, intento])

  if (cargando) {
    return <Cargando texto="Cargando el proyecto..." />
  }

  if (error) {
    return (
      <MensajeDeError
        mensaje={error}
        alReintentar={() => setIntento(intento + 1)}
      />
    )
  }

  // Solo el colectivo dueño busca personas, y un proyecto cerrado ya no busca.
  const puedeBuscarCandidatas =
    usuario?.rol === "COLECTIVO" &&
    usuario.entidad?.id === proyecto.colectivo.id &&
    proyecto.estado !== "CERRADO"

  return (
    <article className="pagina-proyecto">
      <header className="pagina-proyecto-encabezado">
        <span className="pagina-proyecto-estado">
          {ESTADOS_DE_PROYECTO[proyecto.estado]}
        </span>
        <h1>{proyecto.titulo}</h1>
        <p className="pagina-proyecto-colectivo">
          Lo propone {proyecto.colectivo.nombre}
        </p>
      </header>

      <p>{proyecto.descripcion}</p>

      <section className="pagina-proyecto-perfiles">
        <h2>Perfiles que busca</h2>
        {proyecto.perfiles.length === 0 ? (
          <p>Este proyecto todavía no cargó perfiles.</p>
        ) : (
          <div className="pagina-proyecto-grilla">
            {proyecto.perfiles.map((perfil) => (
              <PerfilRequerido
                key={perfil.id}
                perfil={perfil}
                enlaceACandidatas={
                  puedeBuscarCandidatas
                    ? `/proyectos/${proyecto.id}/perfiles/${perfil.id}/candidatas`
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </section>
    </article>
  )
}

export default PaginaProyecto
