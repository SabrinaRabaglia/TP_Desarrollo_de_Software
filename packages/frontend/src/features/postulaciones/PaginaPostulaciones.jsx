import { useEffect, useState } from "react"
import { Card, CardContent } from "@mui/material"
import Cargando from "../../components/cargando/Cargando"
import MensajeDeError from "../../components/mensajeDeError/MensajeDeError"
import { mensajeDeError } from "../../service/api"
import "./PaginaPostulaciones.css"
import { ESTADOS_DE_POSTULACION, obtenerPostulacionesColaborador } from "../../service/postulacionesService.js"

const PaginaPostulaciones = () => {
  const [postulaciones, setPostulaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)

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
                        <span className="badge-anonimo">Postulación anónima</span>
                      )}

                      <span className={`estado-postulacion estado-${postulacion.estado?.toLowerCase()}`}>
                        {ESTADOS_DE_POSTULACION[postulacion.estado]}
                      </span>
                  </div>
                  </div>
                  <div className="nombre-perfil">
                    <span>Perfil:</span> {postulacion.perfil?.nombre ?? "Perfil no disponible"}
                  </div>
                  <div>
                    <span className="fecha-postulacion">Fecha: </span> {postulacion.fechaRevision
                                  ? new Date(postulacion.fechaRevision).toLocaleDateString('es-AR') 
                                  : new Date(postulacion.fechaPostulacion).toLocaleDateString('es-AR') }
                  </div>
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
        Aca se muestran todas las postulaciones realizadas 
        con sus respectivos estados, junto al titulo del proyecto y el perfil correspondiente
      </p>
      <h2>Postulaciones</h2>
      {renderPostulaciones()}
    </section>
  )
}

export default PaginaPostulaciones
