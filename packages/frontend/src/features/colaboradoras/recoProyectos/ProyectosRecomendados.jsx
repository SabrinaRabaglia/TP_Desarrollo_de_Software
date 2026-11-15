import { Button, Card, CardContent, FormControl, InputLabel, MenuItem, Select } from "@mui/material"
import Cargando from "../../../components/cargando/Cargando"
import MensajeDeError from "../../../components/mensajeDeError/MensajeDeError"
import { mensajeDeError } from "../../../service/api"
import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { buscarProyectos, ESTADOS_DE_PROYECTO } from "../../../service/proyectosService"
import { useAuth } from "../../../context/AuthContext"
import { obtenerPerfilPropio } from "../../../service/colaboradorasService"

const ProyectosRecomendados = () => {
 
  const [proyectos, setProyectos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  
  const [paginaActual, setPaginaActual] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [sinHabilidades, setSinHabilidades] = useState(false)
  const [misHabilidades, setMisHabilidades] = useState([])

  const [modalidad, setModalidad] = useState(""); // Vacio = todas
  const [orden, setOrden] = useState("recientes");

  const { usuario } = useAuth() 

  // Función para calcular los cupos según el TP
const calcularCupos = (perfil) => {
  if (!perfil.limiteColaboraciones) {
    return "Sin límite";
  }
  const aceptadas = perfil.colaboracionesAceptadas || 0;
  const disponibles = perfil.limiteColaboraciones - aceptadas;
  return disponibles > 0 ? `${disponibles} cupos disponibles` : "Sin cupos";
};

const analizarCoincidencia = (perfil, misHabilidadesIds) => {
  // Atajamos los dos nombres posibles por si aProyecto lo renombró
  const requeridas = perfil.habilidadesRequeridas || perfil.habilidades || [];
  
  const misHabilidadesStr = misHabilidadesIds.map(h => {
    const id = h?.id || h?._id || h;
    return typeof id === 'object' ? id.toString() : String(id);
  });

  const faltantes = requeridas.filter(req => {
    if (!req) return false; 
    
    const idReq = req?.id || req?._id || req;
    const idReqStr = typeof idReq === 'object' ? idReq.toString() : String(idReq);

    return !misHabilidadesStr.includes(idReqStr);
  });

  // LOG CLAVE PARA DEBUGGEAR:
  console.log(`🔍 Perfil: ${perfil.nombre}`);
  console.log("   - Requeridas:", requeridas.map(r => r?.titulo || r?.nombre || r));
  console.log("   - Faltantes:", faltantes.map(f => f?.titulo || f?.nombre || f));

  if (faltantes.length === 0) {
    return { nivel: "TOTAL", faltantes: [] };
  }
  
  return { nivel: "PARCIAL", faltantes };
};

  useEffect(() => {
    const cargar = async () => {
      // Si el usuario no tiene habilidades cargadas, cortamos acá
      if (!usuario || !usuario.entidad?.id) {
        setCargando(false)
        return
      }

      setCargando(true)
      setError(null)
      setSinHabilidades(false)
      try {
        // Mapeamos para mandar solo los IDs (por si el back te devolvió los objetos completos)
        const perfilCompleto = await obtenerPerfilPropio(usuario.entidad.id)
        console.log("Respuesta del backend (perfil):", perfilCompleto)
        
        // Verificamos si realmente tiene habilidades cargadas
        if (!perfilCompleto.habilidades || perfilCompleto.habilidades.length === 0) {
          setSinHabilidades(true)
          setCargando(false)
          return
        }
        const idsHabilidades = perfilCompleto.habilidades.map(h => h.id || h._id || h)
        setMisHabilidades(idsHabilidades)

        const respuesta = await buscarProyectos({
          habilidades: idsHabilidades,
          modalidad: modalidad || undefined,
          busquedaAbierta: true, 
          estado: "PUBLICADO",
          orden: orden,
          page: paginaActual,
          limit: 10
        });
        
        setProyectos(respuesta.data || respuesta.proyectos)
            
        // Paginación calculada en frontend
        const { total, limit } = respuesta.metadata
        setTotalPaginas(Math.ceil(total / limit) || 1)
      } catch (e) {
        setError(mensajeDeError(e))
      } finally {
        setCargando(false)
      }
    }

    cargar()
  }, [paginaActual, usuario, modalidad, orden])

  const renderContenido = () => {
    if (cargando) return <Cargando texto="Buscando proyectos que hagan match con vos..." />
    if (error) return <MensajeDeError mensaje={error} alReintentar={() => setPaginaActual(1)} />
    if (sinHabilidades) {
      return (
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <p>No tenés habilidades registradas en tu perfil.</p>
          <Button component={Link} to="/mi-perfil" variant="outlined" style={{ marginTop: "10px" }}>
            Volver a Mi Perfil
          </Button>
        </div>
      )
    }


    if (proyectos.length === 0) {
      return <p>No encontramos proyectos activos que requieran tus habilidades en este momento.</p>
    }

    return (
      <ul className="inicio-proyectos">
        {proyectos.map((proyecto) => (
          <li key={proyecto._id || proyecto.id}>
            <Card variant="outlined" className="inicio-proyecto">
              <CardContent>
                <p className="inicio-proyecto-estado">
                  {ESTADOS_DE_PROYECTO?.[proyecto.estado] || proyecto.estado} · {proyecto.colectivo?.nombre}
                </p>
                <h3>
                  <Link to={`/proyectos/${proyecto._id || proyecto.id}`}>
                    {proyecto.titulo}
                  </Link>
                </h3>
                <p>{proyecto.descripcion}</p>

                {/* NUEVO: Mapeo de los perfiles del proyecto */}
                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <h4 style={{ marginBottom: '5px' }}>Perfiles Requeridos:</h4>
                  
                  {proyecto.perfiles?.map(perfil => {
                    // Calculamos los datos en vivo para este perfil
                    const { nivel, faltantes } = analizarCoincidencia(perfil, misHabilidades);
                    const textoCupos = calcularCupos(perfil);

                    return (
                      <div key={perfil.id || perfil._id} style={{ borderLeft: '4px solid #1976d2', paddingLeft: '12px' }}>
                        <div style={{ fontWeight: 'bold' }}>
                          {perfil.nombre}
                        </div>
                        
                        <div style={{ fontSize: '0.9em', color: '#555', marginTop: '4px' }}>
                          <span>Modalidad: {perfil.modalidadColaboracion || perfil.modalidad}</span>
                          <span style={{ margin: '0 8px' }}>|</span>
                          <span>{textoCupos}</span>
                        </div>

                        <div style={{ fontSize: '0.9em', marginTop: '4px' }}>
                          Coincidencia:{' '}
                          <strong style={{ color: nivel === 'TOTAL' ? 'green' : '#d32f2f' }}>
                            {nivel}
                          </strong>
                          {nivel === "PARCIAL" && faltantes.length > 0 && (
                            <span style={{ color: '#666', marginLeft: '5px' }}>
                              (Faltan: {faltantes.map(f => f.nombre || f.titulo || f).join(', ')})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <section className="inicio">
      <h1>Proyectos Recomendados</h1>
      <p className="inicio-bajada">
        Basado en tus habilidades, estos colectivos sociales están buscando a alguien como vos.
      </p>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', alignItems: 'center' }}>
  {/* Filtro de Modalidad */}
  <FormControl size="small" style={{ minWidth: 200 }}>
    <InputLabel>Modalidad</InputLabel>
    <Select
      value={modalidad}
      label="Modalidad"
      onChange={(e) => {
        setModalidad(e.target.value);
        setPaginaActual(1); // Siempre que filtrás, volvés a la pag 1
      }}
    >
      <MenuItem value=""><em>Todas</em></MenuItem>
      <MenuItem value="GRATUITA">Gratuita</MenuItem>
      <MenuItem value="CON_INCENTIVO_ECONOMICO">Con incentivo económico</MenuItem>
      <MenuItem value="CON_POSIBILIDAD_CONTRATACION">Con posibilidad de contratación</MenuItem>
    </Select>
  </FormControl>

  {/* Filtro de Ordenamiento */}
  <FormControl size="small" style={{ minWidth: 200 }}>
    <InputLabel>Ordenar por</InputLabel>
    <Select
      value={orden}
      label="Ordenar por"
      onChange={(e) => {
        setOrden(e.target.value);
        setPaginaActual(1);
      }}
    >
      <MenuItem value="recientes">Más recientes primero</MenuItem>
      <MenuItem value="antiguos">Más antiguos primero</MenuItem>
    </Select>
  </FormControl>
</div>
      
      {renderContenido()}

      {!cargando && totalPaginas > 0 && (
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

export default ProyectosRecomendados