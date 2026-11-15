import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { Alert } from "@mui/material"
import Cargando from "../../components/cargando/Cargando"
import MensajeDeError from "../../components/mensajeDeError/MensajeDeError"
import { mensajeDeError } from "../../service/api"
import { buscarCandidatas } from "../../service/colaboradorasService"
import { obtenerProyecto } from "../../service/proyectosService"
import Candidata from "./Candidata"
import FormularioDeContacto from "./FormularioDeContacto"
import "./PaginaCandidatas.css"
import Migas from "../../components/migas/Migas"

const PaginaCandidatas = () => {
  const { id, perfilId } = useParams()

  const [proyecto, setProyecto] = useState(null)
  const [candidatas, setCandidatas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)
  const [contactada, setContactada] = useState(null)
  const [aviso, setAviso] = useState(null)

  const avisarEnvio = (candidata) => {
    setContactada(null)
    setAviso(`Le enviaste el mensaje a ${candidata.nombreFantasia}.`)
  }

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      setError(null)
      try {
        const [proyectoCargado, candidatasCargadas] = await Promise.all([
          obtenerProyecto(id),
          buscarCandidatas(perfilId),
        ])
        setProyecto(proyectoCargado)
        setCandidatas(candidatasCargadas)
      } catch (e) {
        if (e.response?.status === 404) {
          setError("Perfil no encontrado")
        } else {
          setError(mensajeDeError(e))
        }
      } finally {
        setCargando(false)
      }
    }

    cargar()
  }, [id, perfilId, intento])

  if (cargando) {
    return <Cargando texto="Buscando personas para el perfil..." />
  }

  if (error) {
    return (
      <MensajeDeError
        mensaje={error}
        alReintentar={() => setIntento(intento + 1)}
      />
    )
  }

  // El perfil tiene que ser de este proyecto: si no, la URL está mal armada.
  const perfil = proyecto.perfiles.find((p) => p.id === perfilId)
  if (!perfil) {
    return <MensajeDeError mensaje="Perfil no encontrado" />
  }

  return (
    <section className="pagina-candidatas">
      <Migas proyectoId={id} perfilId={perfilId} actual="Candidatas" />
      <header className="pagina-candidatas-encabezado">
        <h1>Personas para el perfil {perfil.nombre}</h1>
        <p>
          Del proyecto{" "}
          <Link to={`/proyectos/${proyecto.id}`}>{proyecto.titulo}</Link>.
          Tienen todas las habilidades requeridas; primero aparecen las que
          tienen más de las opcionales.
        </p>
      </header>

      {aviso && (
        <Alert severity="success" onClose={() => setAviso(null)}>
          {aviso}
        </Alert>
      )}

      {candidatas.length === 0 ? (
        <p className="pagina-candidatas-vacia">
          Todavía no hay personas con todas las habilidades que pide este
          perfil.
        </p>
      ) : (
        <ul className="pagina-candidatas-lista">
          {candidatas.map((candidata) => (
            <li key={candidata.id}>
              <Candidata
                candidata={candidata}
                alContactar={(elegida) => {
                  setAviso(null)
                  setContactada(elegida)
                }}
              />
            </li>
          ))}
        </ul>
      )}

      {contactada && (
        <FormularioDeContacto
          candidata={contactada}
          proyectoId={proyecto.id}
          perfilId={perfil.id}
          alCerrar={() => setContactada(null)}
          alEnviar={avisarEnvio}
        />
      )}
    </section>
  )
}

export default PaginaCandidatas
