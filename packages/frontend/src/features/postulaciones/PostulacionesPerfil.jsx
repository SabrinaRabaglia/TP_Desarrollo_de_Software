import "./PostulacionesPerfil.css"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { Button, Card, CardContent } from "@mui/material"
import Cargando from "../../components/cargando/Cargando"
import MensajeDeError from "../../components/mensajeDeError/MensajeDeError"
import { mensajeDeError } from "../../service/api"
import "./PaginaPostulaciones.css"
import {
  aceptarPostulacion,
  darDeBajaPostulacion,
  ESTADOS_DE_POSTULACION,
  obtenerPostulacionesPerfil,
  rechazarPostulacion,
} from "../../service/postulacionesService.js"
import ConfirmarAccion from "../../components/confirmarAccion/ConfirmarAccion.jsx"
import ListaDeHabilidades from "../../components/listaDeHabilidades/ListaDeHabilidades.jsx"

// Lo que hace cada acción y cómo se le pide confirmación al colectivo.
const ACCIONES = {
  ACEPTAR: {
    enviar: aceptarPostulacion,
    titulo: "Aceptar postulación",
    mensaje: "¿Seguro que quieres aceptar esta postulación?",
    textoConfirmar: "Sí",
  },
  RECHAZAR: {
    enviar: rechazarPostulacion,
    titulo: "Rechazar postulación",
    mensaje: "¿Seguro que quieres rechazar esta postulación?",
    textoConfirmar: "Sí",
  },
  DESANOTAR: {
    enviar: darDeBajaPostulacion,
    titulo: "Desanotar",
    mensaje:
      "La persona deja de colaborar en este perfil y no podrá volver a postularse. Esta acción no se puede deshacer.",
    textoConfirmar: "Desanotar",
  },
}

const QUIEN_DIO_LA_BAJA = {
  PERSONA_COLABORADORA: "Se dio de baja",
  COLECTIVO: "La desanotaste",
}

const GrupoDeHabilidades = ({ titulo, habilidades }) => {
  if (habilidades.length === 0) {
    return null
  }

  return (
    <div className="perfil-habilidades">
      <h4>{titulo}</h4>
      <ListaDeHabilidades habilidades={habilidades} />
    </div>
  )
}

const PostulacionesPerfil = () => {
  const { proyectoId, perfilId } = useParams()
  const [postulaciones, setPostulaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState(false)
  const [postulacionSeleccionada, setPostulacionSeleccionada] = useState(null)
  const [accion, setAccion] = useState(null)
  const [errorAccion, setErrorAccion] = useState(null)

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      setError(null)
      try {
        setPostulaciones(await obtenerPostulacionesPerfil(proyectoId, perfilId))
      } catch (e) {
        setError(mensajeDeError(e))
      } finally {
        setCargando(false)
      }
    }

    cargar()
  }, [intento, proyectoId, perfilId])

  const renderPostulaciones = () => {
    if (cargando) {
      return <Cargando texto="Cargando postulaciones..." />
    }

    if (error) {
      return (
        <MensajeDeError
          mensaje={error}
          alReintentar={() => setIntento(intento + 1)}
        />
      )
    }

    const Accion = async () => {
      // Se cierra antes de enviar: si el back falla, el error tiene que quedar
      // a la vista y no detrás del diálogo.
      setDialogoAbierto(false)
      try {
        setEnviando(true)
        setErrorAccion(null)
        setExito(false)

        await ACCIONES[accion].enviar(postulacionSeleccionada)

        setExito(true)

        // Volvemos a cargar las postulaciones actualizadas.
        setIntento((anterior) => anterior + 1)
      } catch (error) {
        setErrorAccion(mensajeDeError(error))
      } finally {
        setEnviando(false)
      }
    }

    return (
      <>
        <ul className="mis-postulaciones">
          {postulaciones.map((postulacion) => (
            <li key={postulacion.id}>
              <Card variant="outlined" className="postulacion">
                <CardContent>
                  <div className="postulacion-carta">
                    <div className="postulacion-header">
                      <div className="titulo-proyecto">
                        <span>Nombre Colaborador: </span>
                        {postulacion.personaColaboradora.nombreCompleto}
                      </div>
                      <div className="postulacion-badges">
                        {postulacion.esAnonima && (
                          <span className="badge-anonimo">
                            Postulación anónima
                          </span>
                        )}

                        <span
                          className={`estado-postulacion estado-${postulacion.estado?.toLowerCase()}`}
                        >
                          {ESTADOS_DE_POSTULACION[postulacion.estado]}
                        </span>
                      </div>
                    </div>
                    <div className="presentacion-colaborador">
                      {postulacion.personaColaboradora.presentacion}
                    </div>
                    <div>
                      <GrupoDeHabilidades
                        titulo="Habilidades"
                        habilidades={
                          postulacion.personaColaboradora.habilidades
                        }
                      />
                    </div>
                    <div>
                      <span className="fecha-postulacion">Fecha: </span>{" "}
                      {new Date(
                        postulacion.fechaBaja ??
                          postulacion.fechaRevision ??
                          postulacion.fechaPostulacion,
                      ).toLocaleDateString("es-AR")}
                    </div>
                    {postulacion.estado === "BAJA" && (
                      <div className="origen-baja">
                        {QUIEN_DIO_LA_BAJA[postulacion.origenBaja] ??
                          "Postulación dada de baja"}
                      </div>
                    )}
                    {postulacion.estado === "ACEPTADA" && (
                      <div className="datos-contacto">
                        <span>datos de contacto: </span>
                        {postulacion.personaColaboradora.mediosDeContacto.map(
                          (medio) => (
                            <div key={medio.tipo}>
                              {medio.tipo}: {medio.valor}
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                  {postulacion.estado === "PENDIENTE" && (
                    <div className="acciones-postulacion">
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                          setPostulacionSeleccionada(postulacion.id)
                          setAccion("ACEPTAR")
                          setErrorAccion(null)
                          setExito(false)
                          setDialogoAbierto(true)
                        }}
                        disabled={enviando}
                      >
                        Aceptar
                      </Button>

                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => {
                          setPostulacionSeleccionada(postulacion.id)
                          setAccion("RECHAZAR")
                          setErrorAccion(null)
                          setExito(false)
                          setDialogoAbierto(true)
                        }}
                        disabled={enviando}
                      >
                        Rechazar
                      </Button>
                    </div>
                  )}
                  {postulacion.estado === "ACEPTADA" && (
                    <div className="acciones-postulacion">
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => {
                          setPostulacionSeleccionada(postulacion.id)
                          setAccion("DESANOTAR")
                          setErrorAccion(null)
                          setExito(false)
                          setDialogoAbierto(true)
                        }}
                        disabled={enviando}
                      >
                        Desanotar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
        {exito && <p>La postulación se actualizó correctamente.</p>}

        {errorAccion && <p role="alert">{errorAccion}</p>}

        <ConfirmarAccion
          abierto={dialogoAbierto}
          titulo={ACCIONES[accion]?.titulo}
          mensaje={ACCIONES[accion]?.mensaje}
          textoConfirmar={ACCIONES[accion]?.textoConfirmar}
          alConfirmar={Accion}
          alCancelar={() => setDialogoAbierto(false)}
        />
      </>
    )
  }

  return (
    <section className="postulaciones">
      <h1>Postulaciones</h1>
      <p className="postulaciones-bajada">
        Aca se muestran todas las postulaciones realizadas con sus respectivos
        estados
      </p>
      <h2>Postulaciones</h2>
      {renderPostulaciones()}
    </section>
  )
}

export default PostulacionesPerfil
