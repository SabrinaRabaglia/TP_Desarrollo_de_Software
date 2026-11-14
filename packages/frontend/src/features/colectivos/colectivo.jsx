import { useEffect, useState } from "react"
import { Button } from "@mui/material"
import { Link, useParams } from "react-router-dom"
import Cargando from "../../components/cargando/Cargando"
import MensajeDeError from "../../components/mensajeDeError/MensajeDeError"
import { mensajeDeError } from "../../service/api"
import { obtenerColectivo } from "../../service/colectivoService"
import "./colectivo.css"

const Colectivo = () => {
  const { id } = useParams()

  const [colectivo, setColectivo] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let cancelado = false

    const cargar = async () => {
      setCargando(true)
      setError(null)
      try {
        const resultado = await obtenerColectivo(id)
        if (!cancelado) setColectivo(resultado)
      } catch (e) {
        if (!cancelado) {
          setError(
            e.response?.status === 404
              ? "Organización no encontrada"
              : mensajeDeError(e),
          )
        }
      } finally {
        if (!cancelado) setCargando(false)
      }
    }

    cargar()
    return () => {
      cancelado = true
    }
  }, [id, intento])

  if (cargando) {
    return <Cargando texto="Cargando la organización..." />
  }

  if (error) {
    return (
      <MensajeDeError
        mensaje={error}
        alReintentar={() => setIntento(intento + 1)}
      />
    )
  }

  const ubicacion = [
    colectivo.ciudad,
    colectivo.provincia?.nombre,
    colectivo.pais?.nombre,
  ]
    .filter(Boolean)
    .join(", ")

  return (
    <article className="pagina-colectivo">
      <header className="pagina-colectivo-encabezado">
        <div>
          <p className="pagina-colectivo-tipo">{colectivo.tipo}</p>
          <h1>{colectivo.nombre}</h1>
          {ubicacion && (
            <p className="pagina-colectivo-ubicacion">{ubicacion}</p>
          )}
        </div>
        <div>
          <Button
            component={Link}
            to={`/proyectos/nuevo?colectivo=${colectivo.id}`}
            variant="contained"
          >
            Crear proyecto
          </Button>
          <Button
            component={Link}
            to={`/colectivos/${colectivo.id}/editar`}
            variant="outlined"
          >
            Editar organización
          </Button>
        </div>
      </header>
      <p className="pagina-colectivo-descripcion">{colectivo.descripcion}</p>

      <section className="pagina-colectivo-proyectos">
        <h2>Proyectos de la organización</h2>
        {colectivo.proyectos.length === 0 ? (
          <p>Esta organización todavía no tiene proyectos.</p>
        ) : (
          <ul>
            {colectivo.proyectos.map((proyecto) => (
              <li key={proyecto.id}>
                <Link to={`/proyectos/${proyecto.id}`}>{proyecto.titulo}</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  )
}

export default Colectivo
