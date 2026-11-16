import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { Alert, Button, TextField } from "@mui/material"
import "./FormularioProyecto.css"

const PROYECTO_VACIO = {
  titulo: "",
  descripcion: "",
  enlaceSistema: null,
  enlaceRepositorio: null,
}

const aFormulario = (proyecto) => ({
  titulo: proyecto.titulo,
  descripcion: proyecto.descripcion,
  enlaceSistema: proyecto.enlaceSistema ?? "",
  enlaceRepositorio: proyecto.enlaceRepositorio ?? "",
})

// Lo que sale del formulario tiene la forma del proyecto: los textos sin
// espacios de más y un enlace vacío como null.
const aProyecto = (datos) => ({
  titulo: datos.titulo.trim(),
  descripcion: datos.descripcion.trim(),
  enlaceSistema: datos.enlaceSistema.trim() || null,
  enlaceRepositorio: datos.enlaceRepositorio.trim() || null,
})

const obligatorio = (mensaje) => (valor) => (valor === "" ? mensaje : null)

// El back rechaza un enlace mal escrito sin decir cuál es ni por qué, así que
// se revisa acá. Solo http y https: el enlace se muestra como un link.
const enlaceOpcional = (valor) => {
  if (valor === null) {
    return null
  }
  try {
    if (["http:", "https:"].includes(new URL(valor).protocol)) {
      return null
    }
  } catch {
    // No es una URL: cae en el mensaje de abajo.
  }
  return "Tiene que ser una dirección web completa, como https://ejemplo.org"
}

const VALIDACIONES = {
  titulo: obligatorio("El título no puede quedar vacío."),
  descripcion: obligatorio("La descripción no puede quedar vacía."),
  enlaceSistema: enlaceOpcional,
  enlaceRepositorio: enlaceOpcional,
}

const erroresDe = (proyecto) =>
  Object.fromEntries(
    Object.entries(VALIDACIONES)
      .map(([campo, validar]) => [campo, validar(proyecto[campo])])
      .filter(([, mensaje]) => mensaje !== null),
  )

// Los datos de un proyecto, para crearlo o para editarlo. `alGuardar` recibe
// { titulo, descripcion, enlaceSistema, enlaceRepositorio } ya revisados, con
// los enlaces en null si quedaron vacíos.
const FormularioProyecto = ({
  datosIniciales = PROYECTO_VACIO,
  textoBoton,
  textoEnviando,
  rutaCancelar,
  enviando,
  error,
  alGuardar,
}) => {
  const [datos, setDatos] = useState(() => aFormulario(datosIniciales))
  // Los errores se marcan recién cuando la persona intenta guardar.
  const [revisado, setRevisado] = useState(false)
  const entradas = useRef({})
  const aviso = useRef(null)

  const errores = revisado ? erroresDe(aProyecto(datos)) : {}

  useEffect(() => {
    if (error) {
      aviso.current.focus()
    }
  }, [error])

  const campo = (nombre) => ({
    value: datos[nombre],
    onChange: (e) => setDatos({ ...datos, [nombre]: e.target.value }),
    error: Boolean(errores[nombre]),
    inputRef: (entrada) => {
      entradas.current[nombre] = entrada
    },
  })

  const guardar = (evento) => {
    evento.preventDefault()
    const proyecto = aProyecto(datos)
    // El foco va al primer campo con error: ahí se lee qué hay que corregir.
    const [primeroConError] = Object.keys(erroresDe(proyecto))
    if (primeroConError) {
      setRevisado(true)
      entradas.current[primeroConError].focus()
      return
    }
    alGuardar(proyecto)
  }

  return (
    // Sin la validación del navegador: los errores se muestran con los
    // mismos textos y en el mismo lugar en todos los navegadores.
    <form onSubmit={guardar} className="formulario-proyecto" noValidate>
      <TextField
        label="Título"
        {...campo("titulo")}
        helperText={
          errores.titulo ?? "Es el nombre con el que se va a ver el proyecto"
        }
        required
        fullWidth
      />
      <TextField
        label="Descripción"
        {...campo("descripcion")}
        helperText={
          errores.descripcion ??
          "Contá qué necesita el colectivo y para qué va a servir"
        }
        multiline
        minRows={4}
        required
        fullWidth
      />

      <fieldset className="formulario-proyecto-enlaces">
        <legend>Enlaces (opcionales)</legend>
        <TextField
          label="Enlace al sistema en funcionamiento"
          type="url"
          {...campo("enlaceSistema")}
          helperText={
            errores.enlaceSistema ?? "Si ya se puede usar, dónde se lo ve"
          }
          placeholder="https://"
          slotProps={{ inputLabel: { shrink: true } }}
          fullWidth
        />
        <TextField
          label="Enlace al código fuente"
          type="url"
          {...campo("enlaceRepositorio")}
          helperText={
            errores.enlaceRepositorio ?? "El repositorio, si es público"
          }
          placeholder="https://"
          slotProps={{ inputLabel: { shrink: true } }}
          fullWidth
        />
      </fieldset>

      {error && (
        <Alert ref={aviso} tabIndex={-1} severity="error">
          {error}
        </Alert>
      )}

      <div className="formulario-proyecto-acciones">
        <Button type="submit" variant="contained" disabled={enviando}>
          {enviando ? textoEnviando : textoBoton}
        </Button>
        <Button component={Link} to={rutaCancelar} color="inherit">
          Cancelar
        </Button>
      </div>
    </form>
  )
}

export default FormularioProyecto
