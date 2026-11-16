import { useEffect, useState } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import { Button, LinearProgress, Skeleton, Tab, Tabs } from "@mui/material"
import { LuCode, LuExternalLink, LuFlag, LuPlus } from "react-icons/lu"
import EstadoChip from "../../components/estadoChip/EstadoChip"
import EstadoVacio from "../../components/estadoVacio/EstadoVacio"
import MensajeDeError from "../../components/mensajeDeError/MensajeDeError"
import { useAuth } from "../../context/AuthContext"
import { useAvisos } from "../../context/AvisosContext"
import { obtenerProyecto } from "../../service/proyectosService"
import { mensajeDeError } from "../../service/api"
import FormularioDePerfil from "./FormularioDePerfil"
import GestionDelProyecto from "./GestionDelProyecto"
import PerfilRequerido from "./PerfilRequerido"
import "./PaginaProyecto.css"

const PESTANAS = ["perfiles", "avance"]

const formatoFecha = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long",
  year: "numeric",
})

// Mientras carga se muestra la forma de la página, no un spinner suelto.
const PaginaProyectoCargando = () => (
  <div className="pagina-proyecto" aria-busy="true">
    <span role="status" className="visualmente-oculto">
      Cargando el proyecto...
    </span>
    <div className="pagina-proyecto-encabezado" aria-hidden="true">
      <Skeleton variant="rounded" width={96} height={24} />
      <Skeleton variant="text" width="60%" height={48} />
      <Skeleton variant="text" width="40%" />
    </div>
    <div className="pagina-proyecto-grilla" aria-hidden="true">
      <Skeleton variant="rounded" height={220} />
      <Skeleton variant="rounded" height={220} />
    </div>
  </div>
)

const Avance = ({ porcentaje, etiqueta }) => (
  <div className="pagina-proyecto-avance">
    <LinearProgress
      variant="determinate"
      value={porcentaje}
      aria-label={etiqueta}
    />
    <span className="pagina-proyecto-avance-valor">{porcentaje}%</span>
  </div>
)

const Hitos = ({ hitos }) => {
  if (hitos.length === 0) {
    return (
      <EstadoVacio
        icono={<LuFlag />}
        titulo="Todavía no hay logros"
        texto="Cuando el colectivo cargue los logros del proyecto, vas a ver acá cómo avanza."
      />
    )
  }

  return (
    <ol className="pagina-proyecto-hitos">
      {hitos.map((hito) => (
        <li key={hito.id} className="pagina-proyecto-hito">
          <time dateTime={hito.fecha.toISOString()}>
            {formatoFecha.format(hito.fecha)}
          </time>
          <p>{hito.descripcion}</p>
          <Avance
            porcentaje={hito.porcentaje}
            etiqueta={`Avance al lograr: ${hito.descripcion}`}
          />
        </li>
      ))}
    </ol>
  )
}

const PaginaProyecto = () => {
  const { id } = useParams()
  const { usuario } = useAuth()
  const { mostrarAviso } = useAvisos()
  const [parametros, setParametros] = useSearchParams()

  const [proyecto, setProyecto] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)
  const [agregandoPerfil, setAgregandoPerfil] = useState(false)

  // La pestaña vive en la URL (?tab=avance) para poder compartir el link.
  const pestana = PESTANAS.includes(parametros.get("tab"))
    ? parametros.get("tab")
    : "perfiles"

  const cambiarPestana = (_evento, nueva) => {
    setParametros(nueva === "perfiles" ? {} : { tab: nueva }, {
      replace: true,
    })
  }

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      setError(null)
      try {
        setProyecto(await obtenerProyecto(id))
      } catch (e) {
        if (e.response?.status === 404) {
          setError("Proyecto no encontrado")
        } else {
          setError(mensajeDeError(e))
        }
      } finally {
        setCargando(false)
      }
    }

    cargar()
  }, [id, intento])

  // Después de modificar el proyecto o un perfil se piden los datos de nuevo,
  // sin volver al esqueleto de carga: las tarjetas siguen en pantalla mientras
  // tanto.
  const refrescar = async () => {
    try {
      setProyecto(await obtenerProyecto(id))
    } catch (e) {
      setError(mensajeDeError(e))
    }
  }

  if (cargando) {
    return <PaginaProyectoCargando />
  }

  if (error) {
    return (
      <MensajeDeError
        mensaje={error}
        alReintentar={() => setIntento(intento + 1)}
      />
    )
  }

  // Solo el colectivo dueño revisa postulaciones, busca candidatas y gestiona
  // el proyecto y sus perfiles.
  const esDueno =
    usuario?.rol === "COLECTIVO" &&
    usuario.entidad?.id === proyecto.colectivo.id
  const proyectoAbierto = proyecto.estado === "PUBLICADO"
  // Los perfiles de un proyecto cerrado no se pueden modificar.
  const puedeAgregarPerfiles = esDueno && proyectoAbierto

  const alAgregarPerfil = (nombre) => {
    setAgregandoPerfil(false)
    mostrarAviso(`Agregaste el perfil ${nombre} al proyecto.`)
    return refrescar()
  }

  const hayEnlaces = proyecto.enlaceSistema || proyecto.enlaceRepositorio

  return (
    <article className="pagina-proyecto">
      <header className="pagina-proyecto-encabezado">
        <EstadoChip estado={proyecto.estado} />
        <h1>{proyecto.titulo}</h1>
        <p className="pagina-proyecto-colectivo">
          Lo propone{" "}
          <Link to={`/colectivos/${proyecto.colectivo.id}`}>
            {proyecto.colectivo.nombre}
          </Link>
        </p>
        {esDueno && (
          <GestionDelProyecto proyecto={proyecto} alModificar={refrescar} />
        )}
      </header>

      <div className="pagina-proyecto-resumen">
        <p className="texto-lectura">{proyecto.descripcion}</p>

        <section
          className="pagina-proyecto-concrecion"
          aria-labelledby="titulo-concrecion"
        >
          <h2 id="titulo-concrecion" className="pagina-proyecto-subtitulo">
            Concreción del proyecto
          </h2>
          <Avance
            porcentaje={proyecto.avance}
            etiqueta="Concreción del proyecto"
          />
          {hayEnlaces && (
            <div className="pagina-proyecto-enlaces">
              {proyecto.enlaceSistema && (
                <Button
                  variant="outlined"
                  color="inherit"
                  size="small"
                  href={proyecto.enlaceSistema}
                  target="_blank"
                  rel="noreferrer"
                  startIcon={<LuExternalLink aria-hidden="true" />}
                >
                  Ver el sistema funcionando
                </Button>
              )}
              {proyecto.enlaceRepositorio && (
                <Button
                  variant="outlined"
                  color="inherit"
                  size="small"
                  href={proyecto.enlaceRepositorio}
                  target="_blank"
                  rel="noreferrer"
                  startIcon={<LuCode aria-hidden="true" />}
                >
                  Ver el código
                </Button>
              )}
            </div>
          )}
        </section>
      </div>

      <div>
        <Tabs
          value={pestana}
          onChange={cambiarPestana}
          variant="scrollable"
          allowScrollButtonsMobile
          aria-label="Secciones del proyecto"
        >
          <Tab
            value="perfiles"
            label={`Perfiles (${proyecto.perfiles.length})`}
            id="pestana-perfiles"
            aria-controls="panel-perfiles"
          />
          <Tab
            value="avance"
            label={`Logros (${proyecto.hitos.length})`}
            id="pestana-avance"
            aria-controls="panel-avance"
          />
        </Tabs>

        <div
          role="tabpanel"
          id={`panel-${pestana}`}
          aria-labelledby={`pestana-${pestana}`}
          className="pagina-proyecto-panel"
        >
          {pestana === "perfiles" && (
            <div className="pagina-proyecto-perfiles">
              {puedeAgregarPerfiles && (
                <Button
                  variant="contained"
                  onClick={() => setAgregandoPerfil(true)}
                  startIcon={<LuPlus aria-hidden="true" />}
                  className="pagina-proyecto-agregar"
                >
                  Agregar un perfil
                </Button>
              )}
              {proyecto.perfiles.length === 0 ? (
                <p>
                  {puedeAgregarPerfiles
                    ? "Este proyecto todavía no tiene perfiles. Agregá el primero para que las personas puedan postularse."
                    : "Este proyecto todavía no cargó perfiles."}
                </p>
              ) : (
                <div className="pagina-proyecto-grilla">
                  {proyecto.perfiles.map((perfil) => (
                    <PerfilRequerido
                      key={perfil.id}
                      perfil={perfil}
                      proyectoId={proyecto.id}
                      proyectoAbierto={proyectoAbierto}
                      esDueno={esDueno}
                      alModificar={refrescar}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          {pestana === "avance" && <Hitos hitos={proyecto.hitos} />}
        </div>
      </div>

      {agregandoPerfil && (
        <FormularioDePerfil
          proyectoId={proyecto.id}
          alCerrar={() => setAgregandoPerfil(false)}
          alGuardar={alAgregarPerfil}
        />
      )}
    </article>
  )
}

export default PaginaProyecto
