import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "@mui/material"
import Cargando from "../../components/cargando/Cargando"
import MensajeDeError from "../../components/mensajeDeError/MensajeDeError"
import {
  buscarProyectos,
  ESTADOS_DE_PROYECTO,
} from "../../service/proyectosService"
import { mensajeDeError } from "../../service/api"
import "./Inicio.css"

const Inicio = () => {
  const [proyectos, setProyectos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      setError(null)
      try {
        setProyectos(await buscarProyectos())
      } catch (e) {
        setError(mensajeDeError(e))
      } finally {
        setCargando(false)
      }
    }

    cargar()
  }, [intento])

  const renderProyectos = () => {
    if (cargando) {
      return <Cargando texto="Cargando proyectos..." />
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
      <ul className="inicio-proyectos">
        {proyectos.map((proyecto) => (
          <li key={proyecto.id}>
            <Card variant="outlined" className="inicio-proyecto">
              <CardContent>
                <p className="inicio-proyecto-estado">
                  {ESTADOS_DE_PROYECTO[proyecto.estado]} ·{" "}
                  {proyecto.colectivo.nombre}
                </p>
                <h3>
                  <Link to={`/proyectos/${proyecto.id}`}>
                    {proyecto.titulo}
                  </Link>
                </h3>
                <p>{proyecto.descripcion}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <section className="inicio">
      <h1>Código a Voluntad</h1>
      <p className="inicio-bajada">
        Conectamos colectivos sociales que necesitan software con personas que
        quieren colaborar con su tiempo y sus habilidades.
      </p>
      <h2>Proyectos</h2>
      {renderProyectos()}
    </section>
  )
}

export default Inicio
