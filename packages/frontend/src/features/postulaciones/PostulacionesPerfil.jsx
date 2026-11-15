import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { Alert, Button, Chip, Skeleton } from "@mui/material"
import { LuEyeOff, LuInbox } from "react-icons/lu"
import ConfirmarAccion from "../../components/confirmarAccion/ConfirmarAccion"
import Cupos from "../../components/cupos/Cupos"
import EstadoChip from "../../components/estadoChip/EstadoChip"
import EstadoVacio from "../../components/estadoVacio/EstadoVacio"
import ListaDeHabilidades from "../../components/listaDeHabilidades/ListaDeHabilidades"
import MensajeDeError from "../../components/mensajeDeError/MensajeDeError"
import Migas from "../../components/migas/Migas"
import ValorDelMedio from "../../components/valorDelMedio/ValorDelMedio"
import { useAvisos } from "../../context/AvisosContext"
import { mensajeDeError } from "../../service/api"
import { TIPOS_DE_MEDIO } from "../../service/colaboradorasService"
import {
  aceptarPostulacion,
  darDeBajaPostulacion,
  obtenerPostulacionesPerfil,
  rechazarPostulacion,
} from "../../service/postulacionesService"
import { obtenerResumenDelPerfil } from "../../service/proyectosService"
import "./PostulacionesPerfil.css"

// Lo que hace cada acción, cómo se le pide confirmación al colectivo y qué
// aviso ve cuando sale bien. Rechazar y desanotar no tienen vuelta atrás.
const ACCIONES = {
  ACEPTAR: {
    enviar: aceptarPostulacion,
    titulo: "Aceptar postulación",
    mensaje: (nombre) =>
      `${nombre} va a ocupar un lugar en el perfil y vas a poder ver sus datos de contacto.`,
    textoConfirmar: "Sí, aceptar",
    peligrosa: false,
    aviso: (nombre) =>
      `Aceptaste a ${nombre}. Ya podés ver sus datos de contacto.`,
  },
  RECHAZAR: {
    enviar: rechazarPostulacion,
    titulo: "Rechazar postulación",
    mensaje: (nombre) =>
      `Vas a rechazar la postulación de ${nombre}. Esta acción no se puede deshacer.`,
    textoConfirmar: "Sí, rechazar",
    peligrosa: true,
    aviso: (nombre) => `Rechazaste la postulación de ${nombre}.`,
  },
  DESANOTAR: {
    enviar: darDeBajaPostulacion,
    titulo: "Desanotar",
    mensaje: () =>
      "La persona deja de colaborar en este perfil y no podrá volver a postularse. Esta acción no se puede deshacer.",
    textoConfirmar: "Desanotar",
    peligrosa: true,
    aviso: (nombre) => `Desanotaste a ${nombre} del perfil.`,
  },
}

const QUIEN_DIO_LA_BAJA = {
  PERSONA_COLABORADORA: "Se dio de baja",
  COLECTIVO: "La desanotaste",
}

const fecha = (valor) => new Date(valor).toLocaleDateString("es-AR")

const PostulacionesCargando = () => (
  <div aria-busy="true">
    <span role="status" className="visualmente-oculto">
      Cargando las postulaciones...
    </span>
    <div className="grilla-tarjetas" aria-hidden="true">
      {[1, 2].map((n) => (
        <Skeleton key={n} variant="rounded" height={260} />
      ))}
    </div>
  </div>
)

// Los datos de contacto solo los manda el back de las aceptadas.
const Contacto = ({ persona }) => (
  <div className="revision-contacto">
    <h3>Datos de contacto</h3>
    {persona.mediosDeContacto.length === 0 ? (
      <p>No cargó medios de contacto.</p>
    ) : (
      <dl>
        {persona.nombreCompleto && (
          <div className="revision-medio">
            <dt>Nombre</dt>
            <dd>{persona.nombreCompleto}</dd>
          </div>
        )}
        {persona.mediosDeContacto.map((medio, indice) => (
          <div key={`${medio.tipo}-${indice}`} className="revision-medio">
            <dt>{TIPOS_DE_MEDIO[medio.tipo] ?? medio.tipo}</dt>
            <dd>
              <ValorDelMedio medio={medio} />
            </dd>
          </div>
        ))}
      </dl>
    )}
  </div>
)

const Postulacion = ({ postulacion, enviando, error, alElegir }) => {
  const persona = postulacion.personaColaboradora
  const titulo = `postulacion-${postulacion.id}`

  return (
    <article className="revision" aria-labelledby={titulo}>
      <div className="revision-chips">
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

      <h2 id={titulo} className="revision-nombre">
        <Link to={`/colaboradoras/${persona.id}`}>
          {persona.nombreFantasia}
        </Link>
      </h2>
      {persona.pronombres.length > 0 && (
        <p className="revision-pronombres">{persona.pronombres.join(", ")}</p>
      )}
      {persona.presentacion && <p>{persona.presentacion}</p>}

      {persona.habilidades.length > 0 && (
        <div className="revision-grupo">
          <h3>Habilidades</h3>
          <ListaDeHabilidades habilidades={persona.habilidades} />
        </div>
      )}

      <dl className="revision-fechas">
        <dt>Se postuló</dt>
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

      {postulacion.estado === "BAJA" && (
        <p className="revision-baja">
          {QUIEN_DIO_LA_BAJA[postulacion.origenBaja] ??
            "Postulación dada de baja"}
        </p>
      )}

      {postulacion.estado === "ACEPTADA" && <Contacto persona={persona} />}

      {/* El error queda al lado de la acción que lo causó */}
      {error && <Alert severity="error">{error}</Alert>}

      {postulacion.estado === "PENDIENTE" && (
        <div className="revision-acciones">
          <Button
            variant="contained"
            size="small"
            disabled={enviando}
            onClick={() => alElegir(postulacion, "ACEPTAR")}
          >
            Aceptar
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="small"
            disabled={enviando}
            onClick={() => alElegir(postulacion, "RECHAZAR")}
          >
            Rechazar
          </Button>
        </div>
      )}
      {postulacion.estado === "ACEPTADA" && (
        <div className="revision-acciones">
          <Button
            variant="outlined"
            color="error"
            size="small"
            disabled={enviando}
            onClick={() => alElegir(postulacion, "DESANOTAR")}
          >
            Desanotar
          </Button>
        </div>
      )}
    </article>
  )
}

const PostulacionesPerfil = () => {
  const { proyectoId, perfilId } = useParams()
  const { mostrarAviso } = useAvisos()
  const [postulaciones, setPostulaciones] = useState([])
  // Nombres para las migas y cupos del perfil
  const [resumen, setResumen] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)
  // { postulacion, accion } mientras el colectivo confirma
  const [elegida, setElegida] = useState(null)
  const [enviando, setEnviando] = useState(false)
  // { postulacionId, mensaje } del último error de una acción
  const [errorAccion, setErrorAccion] = useState(null)

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      setError(null)
      try {
        const [postulacionesCargadas, resumenCargado] = await Promise.all([
          obtenerPostulacionesPerfil(proyectoId, perfilId),
          // Migas y cupos son un dato extra: si no llegan, la lista sigue.
          obtenerResumenDelPerfil(proyectoId, perfilId).catch(() => null),
        ])
        setPostulaciones(postulacionesCargadas)
        setResumen(resumenCargado)
      } catch (e) {
        setError(mensajeDeError(e))
      } finally {
        setCargando(false)
      }
    }

    cargar()
  }, [intento, proyectoId, perfilId])

  const confirmar = async () => {
    const { postulacion, accion } = elegida
    const nombre = postulacion.personaColaboradora.nombreFantasia
    // Se cierra antes de enviar: si el back falla, el error tiene que quedar
    // a la vista y no detrás del diálogo.
    setElegida(null)
    setEnviando(true)
    setErrorAccion(null)
    try {
      await ACCIONES[accion].enviar(postulacion.id)
      mostrarAviso(ACCIONES[accion].aviso(nombre))
      // Se vuelve a cargar: cambian el estado, los cupos y los contactos.
      setIntento((anterior) => anterior + 1)
    } catch (e) {
      setErrorAccion({
        postulacionId: postulacion.id,
        mensaje: mensajeDeError(e),
      })
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
          titulo="Todavía no hay postulaciones"
          texto="Cuando alguien se postule a este perfil, la vas a ver acá para aceptarla o rechazarla."
        />
      )
    }

    return (
      <ul className="grilla-tarjetas revision-lista">
        {postulaciones.map((postulacion) => (
          <li key={postulacion.id}>
            <Postulacion
              postulacion={postulacion}
              enviando={enviando}
              error={
                errorAccion?.postulacionId === postulacion.id
                  ? errorAccion.mensaje
                  : null
              }
              alElegir={(elegidaAhora, accion) => {
                setErrorAccion(null)
                setElegida({ postulacion: elegidaAhora, accion })
              }}
            />
          </li>
        ))}
      </ul>
    )
  }

  const accion = elegida && ACCIONES[elegida.accion]

  return (
    <section className="revision-pagina">
      <Migas
        proyectoId={proyectoId}
        proyecto={resumen?.proyecto.titulo}
        perfil={resumen?.perfil?.nombre}
        actual="Postulaciones"
        cargando={cargando && !resumen}
      />
      <header className="revision-encabezado">
        <h1>Postulaciones</h1>
        <p>
          Revisá quién se postuló a este perfil. Los datos de contacto aparecen
          cuando aceptás a la persona.
        </p>
        {resumen?.perfil && (
          <Cupos
            limite={resumen.perfil.limite}
            aceptadas={resumen.perfil.aceptadas}
          />
        )}
      </header>

      {renderPostulaciones()}

      <ConfirmarAccion
        abierto={elegida !== null}
        titulo={accion?.titulo}
        mensaje={accion?.mensaje(
          elegida?.postulacion.personaColaboradora.nombreFantasia,
        )}
        textoConfirmar={accion?.textoConfirmar}
        peligrosa={accion?.peligrosa}
        alConfirmar={confirmar}
        alCancelar={() => setElegida(null)}
      />
    </section>
  )
}

export default PostulacionesPerfil
