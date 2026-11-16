import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Button, MenuItem, TextField } from "@mui/material"
import { LuSearchX } from "react-icons/lu"
import Cargando from "../../components/cargando/Cargando"
import Coincidencia from "../../components/coincidencia/Coincidencia"
import Cupos from "../../components/cupos/Cupos"
import EstadoVacio from "../../components/estadoVacio/EstadoVacio"
import MensajeDeError from "../../components/mensajeDeError/MensajeDeError"
import SelectorDeHabilidades from "../../components/selectorDeHabilidades/SelectorDeHabilidades"
import { useAuth } from "../../context/AuthContext"
import { mensajeDeError } from "../../service/api"
import { obtenerPerfilPropio } from "../../service/colaboradorasService"
import { obtenerHabilidades } from "../../service/habilidadesService"
import { buscarPerfiles, ORDENES } from "../../service/perfilesService"
import { MODALIDADES } from "../../service/proyectosService"
import "./BuscarProyectos.css"

const ORDEN_POR_DEFECTO = "recientes"

// La búsqueda vive en la URL: así, al volver de la página de un proyecto, el
// listado sigue ahí con los mismos filtros.
const filtrosDe = (parametros) => ({
  habilidades: parametros.getAll("habilidades"),
  modalidad: parametros.get("modalidad") ?? "",
  orden: parametros.get("orden") ?? ORDEN_POR_DEFECTO,
})

const Resultado = ({
  resultado: { proyecto, perfil, coincidencia, faltantes },
}) => (
  <article className="resultado-de-busqueda">
    <header>
      <p className="resultado-de-busqueda-colectivo">{proyecto.colectivo}</p>
      <h3>{proyecto.titulo}</h3>
      <p className="resultado-de-busqueda-perfil">Perfil {perfil.nombre}</p>
    </header>
    <dl className="resultado-de-busqueda-datos">
      <dt>Compromiso</dt>
      <dd>{perfil.compromiso}</dd>
      <dt>Modalidades</dt>
      <dd>{perfil.modalidades.join(", ")}</dd>
    </dl>
    <div className="resultado-de-busqueda-chips">
      <Coincidencia nivel={coincidencia} />
      <Cupos limite={perfil.limite} aceptadas={perfil.aceptadas} />
    </div>
    {faltantes.length > 0 && (
      <p className="resultado-de-busqueda-faltantes">
        Te falta: {faltantes.join(", ")}
      </p>
    )}
    <Button
      className="resultado-de-busqueda-accion"
      variant="outlined"
      size="small"
      component={Link}
      to={`/proyectos/${proyecto.id}`}
    >
      Ver proyecto
    </Button>
  </article>
)

const BuscarProyectos = () => {
  const { usuario } = useAuth()
  const [parametros, setParametros] = useSearchParams()
  const buscados = parametros.toString()
  const hayBusqueda = parametros.has("habilidades")
  // Si se entró con una búsqueda en la URL. No cambia después.
  const [entroConBusqueda] = useState(hayBusqueda)
  const personaId = usuario.entidad.id

  const [catalogo, setCatalogo] = useState(null)
  const [errorDeCarga, setErrorDeCarga] = useState(null)
  const [intentoDeCarga, setIntentoDeCarga] = useState(0)
  const [filtros, setFiltros] = useState(() => filtrosDe(parametros))
  const [faltanHabilidades, setFaltanHabilidades] = useState(false)

  const [resultados, setResultados] = useState(null)
  const [buscando, setBuscando] = useState(false)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)

  // Al entrar sin una búsqueda en la URL, el filtro arranca con las
  // habilidades del perfil de quien busca.
  useEffect(() => {
    let vigente = true
    setErrorDeCarga(null)
    Promise.all([
      obtenerHabilidades(),
      entroConBusqueda ? null : obtenerPerfilPropio(personaId),
    ])
      .then(([habilidades, perfil]) => {
        if (!vigente) {
          return
        }
        setCatalogo(habilidades)
        if (perfil) {
          setFiltros((anteriores) => ({
            ...anteriores,
            habilidades: perfil.habilidades,
          }))
        }
      })
      .catch((e) => vigente && setErrorDeCarga(mensajeDeError(e)))

    return () => {
      vigente = false
    }
  }, [intentoDeCarga, entroConBusqueda, personaId])

  useEffect(() => {
    if (!hayBusqueda) {
      setResultados(null)
      return
    }
    let vigente = true
    setBuscando(true)
    setError(null)
    buscarPerfiles(filtrosDe(new URLSearchParams(buscados)))
      .then((encontrados) => vigente && setResultados(encontrados))
      .catch((e) => {
        if (vigente) {
          setResultados(null)
          setError(mensajeDeError(e))
        }
      })
      .finally(() => vigente && setBuscando(false))

    return () => {
      vigente = false
    }
  }, [buscados, hayBusqueda, intento])

  const cambiar = (campo) => (valor) => {
    setFaltanHabilidades(false)
    setFiltros({ ...filtros, [campo]: valor })
  }

  const buscar = (evento) => {
    evento.preventDefault()
    if (filtros.habilidades.length === 0) {
      setFaltanHabilidades(true)
      return
    }
    const nuevos = new URLSearchParams()
    filtros.habilidades.forEach((id) => nuevos.append("habilidades", id))
    if (filtros.modalidad) {
      nuevos.set("modalidad", filtros.modalidad)
    }
    nuevos.set("orden", filtros.orden)
    setParametros(nuevos)
    // Repetir la misma búsqueda no cambia la URL: se vuelve a pedir igual.
    setIntento(intento + 1)
  }

  const renderResultados = () => {
    if (buscando) {
      return <Cargando texto="Buscando perfiles..." />
    }
    if (error) {
      return (
        <MensajeDeError
          mensaje={error}
          alReintentar={() => setIntento(intento + 1)}
        />
      )
    }
    if (!resultados) {
      return (
        <p className="buscar-proyectos-ayuda">
          Elegí los filtros y tocá Buscar para ver los perfiles que encajan con
          vos.
        </p>
      )
    }
    if (resultados.length === 0) {
      return (
        <EstadoVacio
          icono={<LuSearchX />}
          titulo="No encontramos perfiles con esos filtros"
          texto="Probá con otras habilidades o sacando el filtro de modalidad."
        />
      )
    }
    return (
      <>
        <p className="buscar-proyectos-ayuda" aria-live="polite">
          {resultados.length === 1
            ? "1 perfil encontrado"
            : `${resultados.length} perfiles encontrados`}
        </p>
        <ul className="buscar-proyectos-resultados">
          {resultados.map((resultado) => (
            <li key={resultado.perfil.id}>
              <Resultado resultado={resultado} />
            </li>
          ))}
        </ul>
      </>
    )
  }

  return (
    <section className="buscar-proyectos">
      <header className="buscar-proyectos-encabezado">
        <h1>Buscar proyectos</h1>
        <p>
          Perfiles con la búsqueda abierta que piden alguna de tus habilidades,
          con cuánto coincidís con cada uno.
        </p>
      </header>

      {errorDeCarga && (
        <MensajeDeError
          mensaje={errorDeCarga}
          alReintentar={() => setIntentoDeCarga(intentoDeCarga + 1)}
        />
      )}
      {!errorDeCarga && !catalogo && (
        <Cargando texto="Cargando los filtros..." />
      )}
      {catalogo && (
        <form className="buscar-proyectos-filtros" onSubmit={buscar} noValidate>
          <SelectorDeHabilidades
            titulo="Habilidades"
            habilidades={catalogo}
            elegidas={filtros.habilidades}
            alCambiar={cambiar("habilidades")}
          />
          {faltanHabilidades && (
            <MensajeDeError mensaje="Elegí al menos una habilidad para buscar." />
          )}
          <div className="buscar-proyectos-opciones">
            <TextField
              select
              label="Modalidad de colaboración"
              value={filtros.modalidad}
              onChange={(e) => cambiar("modalidad")(e.target.value)}
              slotProps={{
                select: { displayEmpty: true },
                inputLabel: { shrink: true },
              }}
              fullWidth
            >
              <MenuItem value="">Todas</MenuItem>
              {Object.entries(MODALIDADES).map(([valor, etiqueta]) => (
                <MenuItem key={valor} value={valor}>
                  {etiqueta}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Ordenar por fecha de alta"
              value={filtros.orden}
              onChange={(e) => cambiar("orden")(e.target.value)}
              fullWidth
            >
              {Object.entries(ORDENES).map(([valor, etiqueta]) => (
                <MenuItem key={valor} value={valor}>
                  {etiqueta}
                </MenuItem>
              ))}
            </TextField>
          </div>
          <Button type="submit" variant="contained" disabled={buscando}>
            Buscar
          </Button>
        </form>
      )}

      <section className="buscar-proyectos-listado" aria-label="Resultados">
        <h2>Resultados</h2>
        {renderResultados()}
      </section>
    </section>
  )
}

export default BuscarProyectos
