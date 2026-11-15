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
import BarraDeBusqueda from "../../components/barraDeBusqueda/BarraDeBusqueda";

const Inicio = () => {
  const [proyectos, setProyectos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)

  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      setError(null)
      try {
        const respuesta = await buscarProyectos({
          q: textoBusqueda,
          page: paginaActual,
          limit:2 // TODO BORRAR
        })
        // EXTRAEMOS SOLO EL ARRAY PARA QUE EL .map() FUNCIONE
        setProyectos(respuesta.proyectos) 
        const { total, limit } = respuesta.metadata;
        setTotalPaginas(Math.ceil(total / limit) || 1)
      } catch (e) {
        setError(mensajeDeError(e))
      } finally {
        setCargando(false)
      }
    }

    cargar()
  },[textoBusqueda, paginaActual, intento]);

  const ejecutarBusqueda = (texto) => {
    setTextoBusqueda(texto);
    setPaginaActual(1); // Fundamental: resetear a la página 1 al buscar algo nuevo
  };

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

      {/* ACÁ AGREGAMOS LA BARRA DE BÚSQUEDA */}
      <BarraDeBusqueda 
        placeholder="Buscar proyectos por nombre o descripción..." 
        onBuscar={ejecutarBusqueda} 
      />

      {renderProyectos()}
      {!cargando && totalPaginas > 1 && (
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', margin: '30px 0' }}>
          <button 
            disabled={paginaActual === 1} 
            onClick={() => setPaginaActual(paginaActual - 1)}
            style={{ padding: '8px 16px', cursor: paginaActual === 1 ? 'not-allowed' : 'pointer' }}
          >
            ← Anterior
          </button>
          
          <span style={{ alignSelf: 'center', fontWeight: 'bold' }}>
            Página {paginaActual} de {totalPaginas}
          </span>
          
          <button 
            disabled={paginaActual >= totalPaginas} 
            onClick={() => setPaginaActual(paginaActual + 1)}
            style={{ padding: '8px 16px', cursor: paginaActual >= totalPaginas ? 'not-allowed' : 'pointer' }}
          >
            Siguiente →
          </button>
        </div>
      )}
    </section>
  )
}

export default Inicio
