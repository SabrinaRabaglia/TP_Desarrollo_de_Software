import { useEffect, useState } from "react"
import { Alert, Button, Card, MenuItem, TextField } from "@mui/material"
import { Link, useNavigate, useParams } from "react-router-dom"
import Cargando from "../../components/cargando/Cargando"
import MensajeDeError from "../../components/mensajeDeError/MensajeDeError"
import { mensajeDeError } from "../../service/api"
import {
  actualizarColectivo,
  crearColectivo,
  obtenerColectivo,
  obtenerPaises,
  obtenerProvincias,
  TIPOS_DE_COLECTIVO,
} from "../../service/colectivoService"
import "./FormularioColectivo.css"

const valoresDe = (colectivo) => ({
  nombre: colectivo?.nombre ?? "",
  descripcion: colectivo?.descripcion ?? "",
  tipo: colectivo?.tipo ?? "",
  pais: colectivo?.pais?.id ?? colectivo?.pais ?? "",
  provincia: colectivo?.provincia?.id ?? colectivo?.provincia ?? "",
  ciudad: colectivo?.ciudad ?? "",
})

const FormularioColectivo = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const editando = Boolean(id)

  const [valores, setValores] = useState(valoresDe(null))
  const [paises, setPaises] = useState([])
  const [provincias, setProvincias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)
  const [errorDeCarga, setErrorDeCarga] = useState(false)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let cancelado = false

    const cargar = async () => {
      setCargando(true)
      setError(null)
      setErrorDeCarga(false)
      try {
        const [paisesDisponibles, provinciasDisponibles, colectivo] =
          await Promise.all([
            obtenerPaises(),
            obtenerProvincias(),
            id ? obtenerColectivo(id) : Promise.resolve(null),
          ])

        if (cancelado) return
        setPaises(paisesDisponibles)
        setProvincias(provinciasDisponibles)
        setValores(valoresDe(colectivo))
      } catch (e) {
        if (!cancelado) {
          setErrorDeCarga(true)
          setError(
            id && e.response?.status === 404
              ? "Organización no encontrada"
              : e.response
                ? mensajeDeError(e)
                : "No se pudieron cargar los catálogos. Verificá que el backend esté iniciado y reintentá.",
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

  const cambiarValor = (evento) => {
    const { name, value } = evento.target
    setValores((actuales) => ({
      ...actuales,
      [name]: value,
      ...(name === "pais" ? { provincia: "" } : {}),
    }))
  }

  const guardar = async (evento) => {
    evento.preventDefault()
    setError(null)

    const datos = {
      nombre: valores.nombre.trim(),
      descripcion: valores.descripcion.trim(),
      tipo: valores.tipo,
      pais: valores.pais || null,
      provincia: valores.provincia || null,
      ciudad: valores.ciudad.trim() || null,
    }

    if (!datos.nombre || datos.descripcion.length < 2) {
      setError("Ingresá el nombre y una descripción de al menos 2 caracteres.")
      return
    }

    setEnviando(true)
    try {
      const colectivo = editando
        ? await actualizarColectivo(id, datos)
        : await crearColectivo(datos)
      navigate(`/colectivos/${colectivo.id}`, { replace: true })
    } catch (e) {
      setError(mensajeDeError(e))
      setEnviando(false)
    }
  }

  if (cargando) {
    return <Cargando texto="Cargando el formulario..." />
  }

  if (error && !valores.nombre && editando) {
    return (
      <MensajeDeError
        mensaje={error}
        alReintentar={() => setIntento((actual) => actual + 1)}
      />
    )
  }

  return (
    <section className="formulario-colectivo">
      <header className="formulario-colectivo-encabezado">
        <h1>{editando ? "Editar organización" : "Registrar organización"}</h1>
        <p>
          {editando
            ? "Actualizá los datos de tu organización."
            : "Completá los datos para sumar una organización a Código a Voluntad."}
        </p>
      </header>

      <Card variant="outlined" className="formulario-colectivo-tarjeta">
        {error && (
          <Alert
            severity="error"
            action={
              errorDeCarga && (
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => setIntento((actual) => actual + 1)}
                >
                  Reintentar
                </Button>
              )
            }
          >
            {error}
          </Alert>
        )}

        <form onSubmit={guardar} className="formulario-colectivo-campos">
          <TextField
            label="Nombre de la organización"
            name="nombre"
            value={valores.nombre}
            onChange={cambiarValor}
            autoComplete="organization"
            required
            fullWidth
          />

          <TextField
            select
            label="Tipo de organización"
            name="tipo"
            value={valores.tipo}
            onChange={cambiarValor}
            required
            fullWidth
          >
            <MenuItem value="" disabled>
              Seleccioná un tipo
            </MenuItem>
            {TIPOS_DE_COLECTIVO.map((tipo) => (
              <MenuItem key={tipo} value={tipo}>
                {tipo}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Descripción"
            name="descripcion"
            value={valores.descripcion}
            onChange={cambiarValor}
            helperText={`${valores.descripcion.length}/500 caracteres`}
            slotProps={{ htmlInput: { maxLength: 500, minLength: 2 } }}
            multiline
            minRows={4}
            required
            fullWidth
          />

          <div className="formulario-colectivo-ubicacion">
            <TextField
              select
              label="País"
              name="pais"
              value={valores.pais}
              onChange={cambiarValor}
              fullWidth
            >
              <MenuItem value="">Sin especificar</MenuItem>
              {paises.map((pais) => (
                <MenuItem key={pais.id} value={pais.id}>
                  {pais.nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Provincia"
              name="provincia"
              value={valores.provincia}
              onChange={cambiarValor}
              disabled={!valores.pais}
              fullWidth
            >
              <MenuItem value="">Sin especificar</MenuItem>
              {provincias.map((provincia) => (
                <MenuItem key={provincia.id} value={provincia.id}>
                  {provincia.nombre}
                </MenuItem>
              ))}
            </TextField>
          </div>

          <TextField
            label="Ciudad o localidad"
            name="ciudad"
            value={valores.ciudad}
            onChange={cambiarValor}
            autoComplete="address-level2"
            fullWidth
          />

          <div className="formulario-colectivo-acciones">
            <Button
              component={Link}
              to={editando ? `/colectivos/${id}` : "/"}
              disabled={enviando}
              color="inherit"
            >
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={enviando}>
              {enviando
                ? "Guardando..."
                : editando
                  ? "Guardar cambios"
                  : "Registrar organización"}
            </Button>
          </div>
        </form>
      </Card>
    </section>
  )
}

export default FormularioColectivo
