import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { Alert, Button } from "@mui/material"
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
  const [seleccionadas, setSeleccionadas] = useState([])
  // A quiénes se les está escribiendo; null con el formulario cerrado.
  const [destinatarias, setDestinatarias] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [rechazadas, setRechazadas] = useState([])

  const seleccionar = (candidata, marcada) =>
    setSeleccionadas((anteriores) =>
      marcada
        ? [...anteriores, candidata.id]
        : anteriores.filter((id) => id !== candidata.id),
    )

  const escribirles = (elegidas) => {
    setAviso(null)
    setRechazadas([])
    setDestinatarias(elegidas)
  }

  const avisarEnvio = ({ enviadas, rechazadas: sinEnviar }) => {
    setDestinatarias(null)
    setSeleccionadas([])
    setAviso(
      enviadas.length === 1
        ? `El mensaje fue enviado a ${enviadas[0].nombreFantasia}.`
        : `El mensaje fue enviado a ${enviadas.length} colaboradoras.`,
    )
    setRechazadas(sinEnviar)
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
      <Migas
        proyectoId={proyecto.id}
        proyecto={proyecto.titulo}
        perfil={perfil.nombre}
        actual="Candidatas"
      />
      <header className="pagina-candidatas-encabezado">
        <h1>Personas para el perfil {perfil.nombre}</h1>
        <p>
          Del proyecto{" "}
          <Link to={`/proyectos/${proyecto.id}`}>{proyecto.titulo}</Link>.
          Tienen al menos una de las habilidades requeridas. Primero aparecen
          las de coincidencia total y, entre ellas, las que tienen más de las
          opcionales.
        </p>
      </header>

      {aviso && (
        <Alert severity="success" onClose={() => setAviso(null)}>
          {aviso}
        </Alert>
      )}
      {rechazadas.map(({ candidata, motivo }) => (
        <Alert key={candidata.id} severity="error">
          No se envió a {candidata.nombreFantasia}: {motivo}
        </Alert>
      ))}

      {candidatas.length === 0 ? (
        <p className="pagina-candidatas-vacia">
          Todavía no hay personas con alguna de las habilidades requeridas de
          este perfil.
        </p>
      ) : (
        <>
          <div className="pagina-candidatas-seleccion">
            <p aria-live="polite">
              {seleccionadas.length === 1
                ? "1 persona seleccionada"
                : `${seleccionadas.length} personas seleccionadas`}
            </p>
            <Button
              variant="contained"
              disabled={seleccionadas.length === 0}
              onClick={() =>
                escribirles(
                  candidatas.filter((candidata) =>
                    seleccionadas.includes(candidata.id),
                  ),
                )
              }
            >
              Enviar mensaje a las seleccionadas
            </Button>
          </div>
          <ul className="pagina-candidatas-lista">
            {candidatas.map((candidata) => (
              <li key={candidata.id}>
                <Candidata
                  candidata={candidata}
                  seleccionada={seleccionadas.includes(candidata.id)}
                  alSeleccionar={seleccionar}
                  alContactar={(elegida) => escribirles([elegida])}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      {destinatarias && (
        <FormularioDeContacto
          candidatas={destinatarias}
          proyectoId={proyecto.id}
          perfilId={perfil.id}
          alCerrar={() => setDestinatarias(null)}
          alEnviar={avisarEnvio}
        />
      )}
    </section>
  )
}

export default PaginaCandidatas
