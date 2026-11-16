import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Button, Card, CardContent, Pagination } from "@mui/material"
import { LuPlus } from "react-icons/lu"
import Cargando from "../../components/cargando/Cargando"
import MensajeDeError from "../../components/mensajeDeError/MensajeDeError"
import { useAuth } from "../../context/AuthContext"
import {
  buscarProyectos,
  ESTADOS_DE_PROYECTO,
} from "../../service/proyectosService"
import { mensajeDeError } from "../../service/api"
import "./Inicio.css"

const Inicio = () => {
  const { usuario } = useAuth()
  const [proyectos, setProyectos] = useState([])
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      setError(null)
      try {
        const resultado = await buscarProyectos({ pagina })
        setProyectos(resultado.proyectos)
        setTotalPaginas(resultado.totalPaginas)
      } catch (e) {
        setError(mensajeDeError(e))
      } finally {
        setCargando(false)
      }
    }

    cargar()
  }, [intento, pagina])

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

  // Fuera de renderProyectos para que no desaparezca mientras carga otra página.
  const renderPaginacion = () =>
    totalPaginas > 1 &&
    !error && (
      <nav aria-label="Páginas de proyectos" className="inicio-paginacion">
        <Pagination
          count={totalPaginas}
          page={pagina}
          onChange={(_evento, nueva) => setPagina(nueva)}
          disabled={cargando}
          color="primary"
        />
      </nav>
    )

  return (
    <section className="inicio">
      <h1>Código a Voluntad</h1>
      <p className="inicio-bajada">
        Conectamos colectivos sociales que necesitan software con personas que
        quieren colaborar con su tiempo y sus habilidades.
      </p>
      <div className="inicio-proyectos-encabezado">
        <h2>Proyectos</h2>
        {usuario?.rol === "COLECTIVO" && (
          <Button
            variant="contained"
            component={Link}
            to="/proyectos/nuevo"
            startIcon={<LuPlus aria-hidden="true" />}
          >
            Crear proyecto
          </Button>
        )}
      </div>
      {renderProyectos()}
      {renderPaginacion()}
    </section>
  )
}

export default Inicio
