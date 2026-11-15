import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Alert, Button, Chip, Skeleton } from "@mui/material"
import { LuEyeOff, LuInbox } from "react-icons/lu"
import ConfirmarAccion from "../../components/confirmarAccion/ConfirmarAccion"
import EstadoChip from "../../components/estadoChip/EstadoChip"
import EstadoVacio from "../../components/estadoVacio/EstadoVacio"
import MensajeDeError from "../../components/mensajeDeError/MensajeDeError"
import { useAvisos } from "../../context/AvisosContext"
import { mensajeDeError } from "../../service/api"
import {
  darDeBajaPostulacion,
  obtenerPostulacionesColaborador,
} from "../../service/postulacionesService"
import "./PaginaPostulaciones.css"

const QUIEN_DIO_LA_BAJA = {
  PERSONA_COLABORADORA: "Te diste de baja",
  COLECTIVO: "Te desanotó el colectivo",
}

const fecha = (valor) => new Date(valor).toLocaleDateString("es-AR")

// Mientras carga se ve la forma de la lista, no un spinner suelto.
const PostulacionesCargando = () => (
  <div aria-busy="true">
    <span role="status" className="visualmente-oculto">
      Cargando tus postulaciones...
    </span>
    <div className="grilla-tarjetas" aria-hidden="true">
      {[1, 2, 3].map((n) => (
        <Skeleton key={n} variant="rounded" height={180} />
      ))}
    </div>
  </div>
)

const Fechas = ({ postulacion }) => (
  <dl className="mi-postulacion-fechas">
    <dt>Te postulaste</dt>
    <dd>{fecha(postulacion.fechaPostulacion)}</dd>
    {postulacion.fechaRevision && (
      <>
        <dt>Revisada</dt>
        <dd>{fecha(postulacion.fechaRevision)}</dd>
      </>
    )}
    {postulacion.estado === "BAJA" && postulacion.fechaBaja && (
      <>
        <dt>Baja</dt>
        <dd>{fecha(postulacion.fechaBaja)}</dd>
      </>
    )}
  </dl>
)

const MiPostulacion = ({ postulacion, enviando, alDarDeBaja }) => {
  const { proyecto, perfil } = postulacion

  return (
    <article
      className="mi-postulacion"
      aria-labelledby={`postulacion-${postulacion.id}`}
    >
      <div className="mi-postulacion-chips">
        <EstadoChip estado={postulacion.estado} />
        {postulacion.esAnonima && (
          <Chip
            size="small"
            variant="outlined"
            icon={<LuEyeOff aria-hidden="true" />}
            label="Anónima"
          />
        )}
      </div>

      <h2
        id={`postulacion-${postulacion.id}`}
        className="mi-postulacion-titulo"
      >
        {proyecto ? (
          <Link to={`/proyectos/${proyecto.id}`}>{proyecto.titulo}</Link>
        ) : (
          "Proyecto no disponible"
        )}
      </h2>
      <p className="mi-postulacion-perfil">
        Perfil: {perfil?.nombre ?? "Perfil no disponible"}
      </p>

      <Fechas postulacion={postulacion} />

      {postulacion.estado === "BAJA" && (
        <p className="mi-postulacion-baja">
          {QUIEN_DIO_LA_BAJA[postulacion.origenBaja] ??
            "Postulación dada de baja"}
        </p>
      )}

      {postulacion.estado === "ACEPTADA" && (
        <div className="mi-postulacion-acciones">
          <Button
            variant="outlined"
            color="error"
            size="small"
            disabled={enviando}
            onClick={() => alDarDeBaja(postulacion)}
          >
            Darme de baja
          </Button>
        </div>
      )}
    </article>
  )
}

const PaginaPostulaciones = () => {
  const { mostrarAviso } = useAvisos()
  const [postulaciones, setPostulaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)
  // La postulación que la persona eligió dar de baja, mientras confirma.
  const [aDarDeBaja, setADarDeBaja] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [errorBaja, setErrorBaja] = useState(null)

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      setError(null)
      try {
        setPostulaciones(await obtenerPostulacionesColaborador())
      } catch (e) {
        setError(mensajeDeError(e))
      } finally {
        setCargando(false)
      }
    }

    cargar()
  }, [intento])

  const confirmarBaja = async () => {
    const { id: postulacionId, perfil } = aDarDeBaja
    setADarDeBaja(null)
    setEnviando(true)
    setErrorBaja(null)
    try {
      const baja = await darDeBajaPostulacion(postulacionId)
      setPostulaciones((actuales) =>
        actuales.map((postulacion) =>
          postulacion.id === postulacionId
            ? { ...postulacion, ...baja, id: postulacionId }
            : postulacion,
        ),
      )
      mostrarAviso(
        perfil
          ? `Te diste de baja del perfil ${perfil.nombre}.`
          : "Te diste de baja.",
      )
    } catch (e) {
      setErrorBaja(mensajeDeError(e))
    } finally {
      setEnviando(false)
    }
  }

  const renderPostulaciones = () => {
    if (cargando) {
      return <PostulacionesCargando />
    }

    if (error) {
      return (
        <MensajeDeError
          mensaje={error}
          alReintentar={() => setIntento(intento + 1)}
        />
      )
    }

    if (postulaciones.length === 0) {
      return (
        <EstadoVacio
          icono={<LuInbox />}
          titulo="Todavía no te postulaste"
          texto="Explorá los proyectos y sumate a los perfiles que te interesen."
          accion={{ etiqueta: "Ver proyectos", a: "/" }}
        />
      )
    }

    return (
      <ul className="grilla-tarjetas mis-postulaciones-lista">
        {postulaciones.map((postulacion) => (
          <li key={postulacion.id}>
            <MiPostulacion
              postulacion={postulacion}
              enviando={enviando}
              alDarDeBaja={(elegida) => {
                setErrorBaja(null)
                setADarDeBaja(elegida)
              }}
            />
          </li>
        ))}
      </ul>
    )
  }

  const perfilADarDeBaja = aDarDeBaja?.perfil?.nombre

  return (
    <section className="mis-postulaciones-pagina">
      <header className="mis-postulaciones-encabezado">
        <h1>Mis postulaciones</h1>
        <p className="texto-lectura">
          Seguí en qué estado está cada perfil al que te postulaste.
        </p>
      </header>

      {errorBaja && (
        <Alert severity="error" onClose={() => setErrorBaja(null)}>
          {errorBaja}
        </Alert>
      )}

      {renderPostulaciones()}

      <ConfirmarAccion
        abierto={aDarDeBaja !== null}
        titulo="Darme de baja"
        mensaje={`La baja es permanente: vas a dejar de colaborar${
          perfilADarDeBaja ? ` en el perfil ${perfilADarDeBaja}` : ""
        } y no vas a poder volver a postularte. Esta acción no se puede deshacer.`}
        textoConfirmar="Sí, darme de baja"
        alConfirmar={confirmarBaja}
        alCancelar={() => setADarDeBaja(null)}
      />
    </section>
  )
}

export default PaginaPostulaciones
