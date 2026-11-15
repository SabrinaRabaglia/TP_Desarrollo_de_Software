import { useEffect, useState } from "react"
import { Alert, Button, Card, CardContent } from "@mui/material"
import Cargando from "../../components/cargando/Cargando"
import ConfirmarAccion from "../../components/confirmarAccion/ConfirmarAccion.jsx"
import MensajeDeError from "../../components/mensajeDeError/MensajeDeError"
import { mensajeDeError } from "../../service/api"
import "./PaginaPostulaciones.css"
import {
  ESTADOS_DE_POSTULACION,
  darDeBajaPostulacion,
  obtenerPostulacionesColaborador,
} from "../../service/postulacionesService.js"

const QUIEN_DIO_LA_BAJA = {
  PERSONA_COLABORADORA: "Te diste de baja",
  COLECTIVO: "Te desanotó el colectivo",
}

const fecha = (valor) => new Date(valor).toLocaleDateString("es-AR")

const PaginaPostulaciones = () => {
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
    const postulacionId = aDarDeBaja.id
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
    } catch (e) {
      setErrorBaja(mensajeDeError(e))
    } finally {
      setEnviando(false)
    }
  }

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

    return (
      <ul className="mis-postulaciones">
        {postulaciones.map((postulacion) => (
          <li key={postulacion.id}>
            <Card variant="outlined" className="postulacion">
              <CardContent>
                <div className="postulacion-carta">
                  <div className="postulacion-header">
                    <div className="titulo-proyecto">
                      {postulacion.proyecto?.titulo ?? "Proyecto no disponible"}
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
                  <div className="nombre-perfil">
                    <span>Perfil:</span>{" "}
                    {postulacion.perfil?.nombre ?? "Perfil no disponible"}
                  </div>
                  <div>
                    <span className="fecha-postulacion">Fecha: </span>{" "}
                    {fecha(
                      postulacion.fechaBaja ??
                        postulacion.fechaRevision ??
                        postulacion.fechaPostulacion,
                    )}
                  </div>
                  {postulacion.estado === "BAJA" && (
                    <div className="origen-baja">
                      {QUIEN_DIO_LA_BAJA[postulacion.origenBaja] ??
                        "Postulación dada de baja"}
                    </div>
                  )}
                  {postulacion.estado === "ACEPTADA" && (
                    <div>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        disabled={enviando}
                        onClick={() => setADarDeBaja(postulacion)}
                      >
                        Darme de baja
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <section className="postulaciones">
      <h1>Mis postulaciones</h1>
      <p className="postulaciones-bajada">
        Aca se muestran todas las postulaciones realizadas con sus respectivos
        estados, junto al titulo del proyecto y el perfil correspondiente
      </p>
      <h2>Postulaciones</h2>
      {errorBaja && (
        <Alert severity="error" onClose={() => setErrorBaja(null)}>
          {errorBaja}
        </Alert>
      )}
      {renderPostulaciones()}
      <ConfirmarAccion
        abierto={aDarDeBaja !== null}
        titulo="Darme de baja"
        mensaje="Vas a dejar de colaborar en este perfil y no vas a poder volver a postularte. Esta acción no se puede deshacer."
        textoConfirmar="Darme de baja"
        alConfirmar={confirmarBaja}
        alCancelar={() => setADarDeBaja(null)}
      />
    </section>
  )
}

export default PaginaPostulaciones
