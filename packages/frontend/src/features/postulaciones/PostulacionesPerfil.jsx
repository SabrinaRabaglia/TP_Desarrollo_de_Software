import "./PostulacionesPerfil.css"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@mui/material"
import Cargando from "../../components/cargando/Cargando"
import MensajeDeError from "../../components/mensajeDeError/MensajeDeError"
import { mensajeDeError } from "../../service/api"
import "./PaginaPostulaciones.css"
import { ESTADOS_DE_POSTULACION, obtenerPostulacionesPerfil } from "../../service/postulacionesService.js"


const PostulacionesPerfil  = () => {
  const [postulaciones, setPostulaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      setError(null)
      try {
        setPostulaciones(await obtenerPostulacionesPerfil())
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
                <p className="postulacion-estado">
                  {ESTADOS_DE_POSTULACION[postulacion.estado]} ·{" "}
                  {postulacion.proyecto?.titulo ?? "Proyecto no disponible"} ·
                  {postulacion.perfil?.nombre ?? "Perfil no disponible"}
                </p>
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
        con sus respectivos estados
      </p>
      <h2>Postulaciones</h2>
      {renderPostulaciones()}
    </section>
  )
}


export default PostulacionesPerfil