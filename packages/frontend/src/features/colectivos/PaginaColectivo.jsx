import { useEffect, useState } from "react"
import { Link as RouterLink, useParams } from "react-router-dom"
import { Button, Chip } from "@mui/material"
import { LuMapPin, LuPencil } from "react-icons/lu"
import Cargando from "../../components/cargando/Cargando"
import MensajeDeError from "../../components/mensajeDeError/MensajeDeError"
import { useAuth } from "../../context/AuthContext"
import { mensajeDeError } from "../../service/api"
import { obtenerColectivo } from "../../service/colectivosService"
import "./PaginaColectivo.css"

const PaginaColectivo = () => {
  const { id } = useParams()
  const { usuario } = useAuth()
  const esSuColectivo =
    usuario?.rol === "COLECTIVO" && usuario.entidad?.id === id

  const [colectivo, setColectivo] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      setError(null)
      try {
        setColectivo(await obtenerColectivo(id))
      } catch (e) {
        if (e.response?.status === 404) {
          setError("Colectivo no encontrado")
        } else {
          setError(mensajeDeError(e))
        }
      } finally {
        setCargando(false)
      }
    }

    cargar()
  }, [id, intento])

  if (cargando) {
    return <Cargando texto="Cargando el colectivo..." />
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
    <article className="pagina-colectivo">
      <header className="pagina-colectivo-encabezado">
        <div className="pagina-colectivo-identidad">
          <h1>{colectivo.nombre}</h1>
          <div className="pagina-colectivo-datos">
            <Chip variant="suave" label={colectivo.tipo} />
            {colectivo.ubicacion && (
              <p className="pagina-colectivo-ubicacion">
                <LuMapPin aria-hidden="true" />
                <span className="visualmente-oculto">Ubicación: </span>
                {colectivo.ubicacion}
              </p>
            )}
          </div>
        </div>
        {esSuColectivo && (
          <Button
            variant="outlined"
            size="small"
            component={RouterLink}
            to="/mi-colectivo"
            startIcon={<LuPencil aria-hidden="true" />}
          >
            Editar mi colectivo
          </Button>
        )}
      </header>

      <section
        className="pagina-colectivo-seccion"
        aria-labelledby="titulo-descripcion"
      >
        <h2 id="titulo-descripcion">Sobre el colectivo</h2>
        <p className="texto-lectura pagina-colectivo-descripcion">
          {colectivo.descripcion}
        </p>
      </section>
    </article>
  )
}

export default PaginaColectivo
