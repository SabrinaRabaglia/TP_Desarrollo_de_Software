import { useEffect, useRef, useState } from "react"
import {
  Alert,
  Button,
  Card,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import Cargando from "../../components/cargando/Cargando"
import ConfirmarAccion from "../../components/confirmarAccion/ConfirmarAccion"
import MensajeDeError from "../../components/mensajeDeError/MensajeDeError"
import { mensajeDeError } from "../../service/api"
import { buscarColectivos } from "../../service/colectivoService"
import {
  actualizarPerfil,
  actualizarProyecto,
  crearPerfil,
  crearProyecto,
  eliminarPerfil,
  eliminarProyecto,
  ESTADOS_DE_PROYECTO,
  MODALIDADES_DE_COLABORACION,
  obtenerHabilidades,
  obtenerProyectoParaEditar,
  UNIDADES_DE_COMPROMISO,
} from "../../service/proyectosService"
import "./FormularioProyecto.css"

const valoresIniciales = (colectivo = "") => ({
  titulo: "",
  descripcion: "",
  colectivo,
  estado: "PUBLICADO",
  fechaCierre: "",
  busquedaAbierta: false,
  busquedaAbiertaHasta: "",
})

const perfilVacio = (clave) => ({
  clave,
  id: null,
  nombre: "",
  descripcion: "",
  unidadCompromiso: "HORAS_SEMANALES",
  cantidadHoras: "1",
  modalidadesColaboracion: ["GRATUITA"],
  habilidadesRequeridas: [],
  habilidadesOpcionales: [],
  limiteColaboraciones: null,
  sinLimite: true,
})

const fechaDeInput = (fecha) =>
  fecha ? new Date(fecha).toISOString().slice(0, 10) : ""

const idDe = (elemento) => elemento?.id ?? elemento?._id

const valoresDelProyecto = (proyecto) => ({
  titulo: proyecto.titulo ?? "",
  descripcion: proyecto.descripcion ?? "",
  colectivo: proyecto.colectivo ?? "",
  estado: proyecto.estado ?? "PUBLICADO",
  fechaCierre: fechaDeInput(proyecto.fechaCierre),
  busquedaAbierta: proyecto.busquedaAbierta ?? false,
  busquedaAbiertaHasta: fechaDeInput(proyecto.busquedaAbiertaHasta),
})

const perfilParaFormulario = (perfil, clave) => ({
  ...perfil,
  clave,
  nombre: perfil.nombre ?? "",
  cantidadHoras: String(perfil.cantidadHoras ?? 1),
  limiteColaboraciones: perfil.limiteColaboraciones ?? null,
  sinLimite: perfil.limiteColaboraciones == null,
})

const CampoMultiple = ({
  id,
  etiqueta,
  opciones,
  valor,
  alCambiar,
  disabled,
}) => (
  <FormControl fullWidth disabled={disabled}>
    <InputLabel id={`${id}-label`}>{etiqueta}</InputLabel>
    <Select
      labelId={`${id}-label`}
      id={id}
      multiple
      value={valor}
      label={etiqueta}
      onChange={(evento) => alCambiar(evento.target.value)}
      renderValue={(seleccionados) =>
        opciones
          .filter((opcion) => seleccionados.includes(opcion.id))
          .map((opcion) => opcion.titulo)
          .join(", ")
      }
    >
      {opciones.map((opcion) => (
        <MenuItem key={opcion.id} value={opcion.id}>
          {opcion.titulo}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
)

const FormularioProyecto = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const colectivoInicial = searchParams.get("colectivo") ?? ""
  const navigate = useNavigate()
  const [valores, setValores] = useState(valoresIniciales(colectivoInicial))
  const [perfiles, setPerfiles] = useState([])
  const [perfilesEliminados, setPerfilesEliminados] = useState([])
  const [colectivos, setColectivos] = useState([])
  const [habilidades, setHabilidades] = useState([])
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState(null)
  const [errorDeCarga, setErrorDeCarga] = useState(false)
  const [intento, setIntento] = useState(0)
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(false)
  const [idCreado, setIdCreado] = useState(null)
  const [proyectoYaCerrado, setProyectoYaCerrado] = useState(false)
  const siguienteClave = useRef(0)
  const proyectoId = id ?? idCreado
  const editando = Boolean(proyectoId)
  const proyectoCerrado = proyectoYaCerrado

  useEffect(() => {
    let cancelado = false

    const cargar = async () => {
      setCargando(true)
      setError(null)
      setErrorDeCarga(false)
      try {
        const [colectivosDisponibles, habilidadesDisponibles, proyecto] =
          await Promise.all([
            buscarColectivos(),
            obtenerHabilidades(),
            id ? obtenerProyectoParaEditar(id) : Promise.resolve(null),
          ])

        if (cancelado) return
        setColectivos(colectivosDisponibles)
        setHabilidades(habilidadesDisponibles)
        if (proyecto) {
          setValores(valoresDelProyecto(proyecto))
          setProyectoYaCerrado(proyecto.estado === "CERRADO")
          setPerfiles(
            proyecto.perfiles.map((perfil) =>
              perfilParaFormulario(perfil, perfil.id),
            ),
          )
        } else {
          setProyectoYaCerrado(false)
          setValores(
            valoresIniciales(
              colectivoInicial || colectivosDisponibles[0]?.id || "",
            ),
          )
          setPerfiles([])
          setPerfilesEliminados([])
        }
      } catch (e) {
        if (!cancelado) {
          setErrorDeCarga(true)
          setError(
            id && e.response?.status === 404
              ? "Proyecto no encontrado"
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
  }, [id, intento, colectivoInicial])

  const cambiarValor = (evento) => {
    const { name, value, checked, type } = evento.target
    setValores((actuales) => ({
      ...actuales,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const cambiarPerfil = (clave, campo, valor) => {
    setPerfiles((actuales) =>
      actuales.map((perfil) =>
        perfil.clave === clave ? { ...perfil, [campo]: valor } : perfil,
      ),
    )
  }

  const agregarPerfil = () => {
    const clave = `nuevo-${siguienteClave.current++}`
    setPerfiles((actuales) => [...actuales, perfilVacio(clave)])
  }

  const quitarPerfil = (perfil) => {
    setPerfiles((actuales) =>
      actuales.filter((actual) => actual.clave !== perfil.clave),
    )
    if (perfil.id) {
      setPerfilesEliminados((actuales) => [...actuales, perfil.id])
    }
  }

  const datosDePerfil = (perfil) => ({
    nombre: perfil.nombre.trim() || undefined,
    descripcion: perfil.descripcion.trim(),
    unidadCompromiso: perfil.unidadCompromiso,
    cantidadHoras: Number(perfil.cantidadHoras),
    modalidadesColaboracion: perfil.modalidadesColaboracion,
    habilidadesRequeridas: perfil.habilidadesRequeridas,
    habilidadesOpcionales: perfil.habilidadesOpcionales,
    limiteColaboraciones: perfil.sinLimite
      ? null
      : Number(perfil.limiteColaboraciones),
  })

  const validar = () => {
    if (
      !valores.titulo.trim() ||
      !valores.descripcion.trim() ||
      !valores.colectivo
    ) {
      return "Completá el título, la descripción y el colectivo del proyecto."
    }
    if (!editando && valores.estado === "CERRADO") {
      return "Un proyecto debe crearse publicado; podés cerrarlo después."
    }

    for (const [indice, perfil] of perfiles.entries()) {
      const numero = indice + 1
      if (!perfil.descripcion.trim()) {
        return `Completá la descripción del perfil ${numero}.`
      }
      if (
        !Number.isInteger(Number(perfil.cantidadHoras)) ||
        Number(perfil.cantidadHoras) <= 0
      ) {
        return `Las horas del perfil ${numero} deben ser un entero positivo.`
      }
      if (!perfil.modalidadesColaboracion.length) {
        return `Elegí al menos una modalidad para el perfil ${numero}.`
      }
      if (
        !perfil.habilidadesRequeridas.length ||
        !perfil.habilidadesOpcionales.length
      ) {
        return `Elegí habilidades requeridas y opcionales para el perfil ${numero}.`
      }
      if (
        !perfil.sinLimite &&
        (!Number.isInteger(Number(perfil.limiteColaboraciones)) ||
          Number(perfil.limiteColaboraciones) <= 0)
      ) {
        return `El cupo del perfil ${numero} debe ser un entero positivo.`
      }
    }

    return null
  }

  const guardar = async (evento) => {
    evento.preventDefault()
    setError(null)
    const errorDeValidacion = validar()
    if (errorDeValidacion) {
      setError(errorDeValidacion)
      return
    }

    setEnviando(true)
    try {
      const datos = {
        titulo: valores.titulo.trim(),
        descripcion: valores.descripcion.trim(),
        colectivo: valores.colectivo,
        estado: valores.estado,
        fechaCierre: valores.fechaCierre
          ? `${valores.fechaCierre}T00:00:00.000Z`
          : null,
        busquedaAbierta: valores.busquedaAbierta,
        busquedaAbiertaHasta:
          valores.busquedaAbierta && valores.busquedaAbiertaHasta
            ? `${valores.busquedaAbiertaHasta}T00:00:00.000Z`
            : null,
      }
      const sincronizarPerfiles = async (guardadoId) => {
        for (const perfil of perfiles) {
          const datosPerfil = datosDePerfil(perfil)
          if (perfil.id) {
            await actualizarPerfil(guardadoId, perfil.id, datosPerfil)
          } else {
            const creado = await crearPerfil(guardadoId, datosPerfil)
            const perfilId = idDe(creado)
            if (!perfilId) {
              throw new Error(
                "El servidor guardó un perfil pero no devolvió su identificador.",
              )
            }
            setPerfiles((actuales) =>
              actuales.map((actual) =>
                actual.clave === perfil.clave
                  ? { ...actual, id: perfilId, clave: perfilId }
                  : actual,
              ),
            )
          }
        }

        for (const perfilId of perfilesEliminados) {
          await eliminarPerfil(guardadoId, perfilId)
          setPerfilesEliminados((actuales) =>
            actuales.filter((actual) => actual !== perfilId),
          )
        }
      }

      let guardadoId = proyectoId
      if (editando && valores.estado === "CERRADO") {
        await sincronizarPerfiles(guardadoId)
        const proyecto = await actualizarProyecto(guardadoId, datos)
        guardadoId = idDe(proyecto)
      } else {
        const proyecto = editando
          ? await actualizarProyecto(proyectoId, datos)
          : await crearProyecto(datos)
        guardadoId = idDe(proyecto)
        if (!guardadoId) {
          throw new Error(
            "El servidor guardó el proyecto pero no devolvió su identificador.",
          )
        }
        if (!editando) setIdCreado(guardadoId)
        await sincronizarPerfiles(guardadoId)
      }

      if (!guardadoId) {
        throw new Error(
          "El servidor guardó el proyecto pero no devolvió su identificador.",
        )
      }
      navigate(`/proyectos/${guardadoId}`, { replace: true })
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setEnviando(false)
    }
  }

  const borrarProyecto = async () => {
    setError(null)
    setEliminando(true)
    try {
      await eliminarProyecto(proyectoId)
      navigate("/", { replace: true })
    } catch (e) {
      setError(mensajeDeError(e))
      setConfirmarEliminacion(false)
    } finally {
      setEliminando(false)
    }
  }

  if (cargando) {
    return <Cargando texto="Cargando el formulario del proyecto..." />
  }

  if (errorDeCarga) {
    return (
      <MensajeDeError
        mensaje={error}
        alReintentar={() => setIntento((actual) => actual + 1)}
      />
    )
  }

  return (
    <section className="formulario-proyecto">
      <header className="formulario-proyecto-encabezado">
        <h1>{editando ? "Editar proyecto" : "Crear proyecto"}</h1>
        <p>
          Completá la información del proyecto y definí los perfiles que
          necesita.
        </p>
      </header>

      <Card variant="outlined" className="formulario-proyecto-tarjeta">
        {error && <Alert severity="error">{error}</Alert>}
        {proyectoCerrado && (
          <Alert severity="info">
            El proyecto está cerrado y no se puede editar. Podés eliminarlo si
            corresponde.
          </Alert>
        )}

        <form onSubmit={guardar} className="formulario-proyecto-campos">
          <TextField
            label="Título del proyecto"
            name="titulo"
            value={valores.titulo}
            onChange={cambiarValor}
            disabled={proyectoCerrado}
            required
            fullWidth
          />
          <TextField
            label="Descripción"
            name="descripcion"
            value={valores.descripcion}
            onChange={cambiarValor}
            multiline
            minRows={4}
            disabled={proyectoCerrado}
            required
            fullWidth
          />
          <TextField
            select
            label="Colectivo"
            name="colectivo"
            value={valores.colectivo}
            onChange={cambiarValor}
            disabled={proyectoCerrado}
            required
            fullWidth
          >
            {colectivos.map((colectivo) => (
              <MenuItem key={colectivo.id} value={colectivo.id}>
                {colectivo.nombre}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Estado"
            name="estado"
            value={valores.estado}
            onChange={cambiarValor}
            disabled={proyectoCerrado}
            fullWidth
          >
            {Object.entries(ESTADOS_DE_PROYECTO).map(([estado, etiqueta]) => (
              <MenuItem
                key={estado}
                value={estado}
                disabled={!editando && estado === "CERRADO"}
              >
                {etiqueta}
              </MenuItem>
            ))}
          </TextField>
          {valores.estado === "CERRADO" && !proyectoCerrado && (
            <Alert severity="info">
              Al guardar, el proyecto se cerrará y sus perfiles dejarán de poder
              modificarse.
            </Alert>
          )}
          <FormControlLabel
            control={
              <Checkbox
                name="busquedaAbierta"
                checked={valores.busquedaAbierta}
                onChange={cambiarValor}
                disabled={proyectoCerrado}
              />
            }
            label="Abrir búsqueda de personas colaboradoras"
          />
          {valores.busquedaAbierta && (
            <TextField
              label="Fecha límite de búsqueda"
              name="busquedaAbiertaHasta"
              type="date"
              value={valores.busquedaAbiertaHasta}
              onChange={cambiarValor}
              slotProps={{ inputLabel: { shrink: true } }}
              disabled={proyectoCerrado}
              fullWidth
            />
          )}

          <section className="formulario-proyecto-perfiles">
            <header>
              <div>
                <h2>Perfiles y cupos</h2>
                <p>
                  Definí las horas, habilidades y cantidad de colaboraciones.
                </p>
              </div>
              {!proyectoCerrado && (
                <Button
                  type="button"
                  onClick={agregarPerfil}
                  variant="outlined"
                >
                  Agregar perfil
                </Button>
              )}
            </header>

            {proyectoCerrado && (
              <Alert severity="info">
                Un proyecto cerrado no permite modificar sus perfiles.
              </Alert>
            )}

            {perfiles.length === 0 && (
              <p>Este proyecto todavía no tiene perfiles.</p>
            )}

            {perfiles.map((perfil, indice) => (
              <Card
                key={perfil.clave}
                variant="outlined"
                className="formulario-proyecto-perfil"
              >
                <header>
                  <h3>Perfil {indice + 1}</h3>
                  {!proyectoCerrado && (
                    <Button
                      type="button"
                      color="error"
                      onClick={() => quitarPerfil(perfil)}
                      disabled={enviando}
                    >
                      Quitar perfil
                    </Button>
                  )}
                </header>
                <TextField
                  label="Nombre del perfil (opcional)"
                  value={perfil.nombre}
                  onChange={(evento) =>
                    cambiarPerfil(perfil.clave, "nombre", evento.target.value)
                  }
                  disabled={proyectoCerrado}
                  fullWidth
                />
                <TextField
                  label="Descripción del perfil"
                  value={perfil.descripcion}
                  onChange={(evento) =>
                    cambiarPerfil(
                      perfil.clave,
                      "descripcion",
                      evento.target.value,
                    )
                  }
                  required
                  multiline
                  minRows={2}
                  disabled={proyectoCerrado}
                  fullWidth
                />
                <div className="formulario-proyecto-compromiso">
                  <TextField
                    select
                    label="Unidad de compromiso"
                    value={perfil.unidadCompromiso}
                    onChange={(evento) =>
                      cambiarPerfil(
                        perfil.clave,
                        "unidadCompromiso",
                        evento.target.value,
                      )
                    }
                    disabled={proyectoCerrado}
                    fullWidth
                  >
                    {Object.entries(UNIDADES_DE_COMPROMISO).map(
                      ([unidad, etiqueta]) => (
                        <MenuItem key={unidad} value={unidad}>
                          {etiqueta}
                        </MenuItem>
                      ),
                    )}
                  </TextField>
                  <TextField
                    label="Cantidad de horas"
                    type="number"
                    value={perfil.cantidadHoras}
                    onChange={(evento) =>
                      cambiarPerfil(
                        perfil.clave,
                        "cantidadHoras",
                        evento.target.value,
                      )
                    }
                    slotProps={{ htmlInput: { min: 1, step: 1 } }}
                    required
                    disabled={proyectoCerrado}
                    fullWidth
                  />
                </div>
                <CampoMultiple
                  id={`modalidades-${indice}`}
                  etiqueta="Modalidades de colaboración"
                  opciones={Object.entries(MODALIDADES_DE_COLABORACION).map(
                    ([id, titulo]) => ({ id, titulo }),
                  )}
                  valor={perfil.modalidadesColaboracion}
                  alCambiar={(valor) =>
                    cambiarPerfil(
                      perfil.clave,
                      "modalidadesColaboracion",
                      valor,
                    )
                  }
                  disabled={proyectoCerrado}
                />
                <CampoMultiple
                  id={`requeridas-${indice}`}
                  etiqueta="Habilidades requeridas"
                  opciones={habilidades}
                  valor={perfil.habilidadesRequeridas}
                  alCambiar={(valor) =>
                    cambiarPerfil(perfil.clave, "habilidadesRequeridas", valor)
                  }
                  disabled={proyectoCerrado}
                />
                <CampoMultiple
                  id={`opcionales-${indice}`}
                  etiqueta="Habilidades opcionales"
                  opciones={habilidades}
                  valor={perfil.habilidadesOpcionales}
                  alCambiar={(valor) =>
                    cambiarPerfil(perfil.clave, "habilidadesOpcionales", valor)
                  }
                  disabled={proyectoCerrado}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={perfil.sinLimite}
                      onChange={(evento) =>
                        cambiarPerfil(
                          perfil.clave,
                          "sinLimite",
                          evento.target.checked,
                        )
                      }
                      disabled={proyectoCerrado}
                    />
                  }
                  label="Sin límite de colaboraciones"
                />
                {!perfil.sinLimite && (
                  <TextField
                    label="Cupo máximo de colaboraciones"
                    type="number"
                    value={perfil.limiteColaboraciones ?? ""}
                    onChange={(evento) =>
                      cambiarPerfil(
                        perfil.clave,
                        "limiteColaboraciones",
                        evento.target.value,
                      )
                    }
                    slotProps={{ htmlInput: { min: 1, step: 1 } }}
                    required
                    disabled={proyectoCerrado}
                    fullWidth
                  />
                )}
              </Card>
            ))}
          </section>

          <div className="formulario-proyecto-acciones">
            <Button
              component={Link}
              to={editando ? `/proyectos/${proyectoId}` : "/"}
              disabled={enviando || eliminando}
              color="inherit"
            >
              Cancelar
            </Button>
            {editando && (
              <Button
                type="button"
                color="error"
                onClick={() => setConfirmarEliminacion(true)}
                disabled={enviando || eliminando}
              >
                Eliminar proyecto
              </Button>
            )}
            {!proyectoCerrado && (
              <Button
                type="submit"
                variant="contained"
                disabled={enviando || eliminando}
              >
                {enviando
                  ? "Guardando..."
                  : valores.estado === "CERRADO"
                    ? "Cerrar proyecto"
                    : editando
                      ? "Guardar cambios"
                      : "Crear proyecto"}
              </Button>
            )}
          </div>
        </form>
      </Card>

      <ConfirmarAccion
        abierto={confirmarEliminacion}
        titulo="Eliminar proyecto"
        mensaje="Se eliminarán el proyecto y sus colaboraciones. Esta acción no se puede deshacer."
        textoConfirmar={eliminando ? "Eliminando..." : "Eliminar proyecto"}
        alConfirmar={borrarProyecto}
        alCancelar={() => setConfirmarEliminacion(false)}
      />
    </section>
  )
}

export default FormularioProyecto
