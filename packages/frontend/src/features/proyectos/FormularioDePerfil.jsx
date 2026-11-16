import { useEffect, useState } from "react"
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormHelperText,
  MenuItem,
  TextField,
  useMediaQuery,
} from "@mui/material"
import { useTheme } from "@mui/material/styles"
import Cargando from "../../components/cargando/Cargando"
import MensajeDeError from "../../components/mensajeDeError/MensajeDeError"
import SelectorDeHabilidades from "../../components/selectorDeHabilidades/SelectorDeHabilidades"
import { mensajeDeError } from "../../service/api"
import { obtenerHabilidades } from "../../service/habilidadesService"
import {
  agregarPerfil,
  MODALIDADES,
  modificarPerfil,
  UNIDADES_DE_COMPROMISO,
} from "../../service/proyectosService"
import "./FormularioDePerfil.css"

const OPCIONES_DE_MODALIDAD = Object.entries(MODALIDADES).map(
  ([id, titulo]) => ({ id, titulo }),
)

const dosDigitos = (numero) => String(numero).padStart(2, "0")

// El valor de un <input type="date"> para el día local de esa fecha.
const aDiaLocal = (fecha) =>
  `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`

// La búsqueda queda abierta hasta que termina el día elegido, en hora local.
const finDelDia = (diaLocal) => {
  const [anio, mes, dia] = diaLocal.split("-").map(Number)
  return new Date(anio, mes - 1, dia, 23, 59, 59)
}

const textoDe = (numero) => (numero == null ? "" : String(numero))

const PERFIL_VACIO = {
  nombre: "",
  descripcion: "",
  cantidadHoras: "",
  unidadCompromiso: "",
  modalidadesColaboracion: [],
  habilidadesRequeridas: [],
  habilidadesOpcionales: [],
  limiteColaboraciones: "",
  busquedaAbiertaHasta: "",
}

const aFormulario = (perfil) => ({
  nombre: perfil.nombre ?? "",
  descripcion: perfil.descripcion ?? "",
  cantidadHoras: textoDe(perfil.cantidadHoras),
  unidadCompromiso: perfil.unidadCompromiso ?? "",
  modalidadesColaboracion: perfil.modalidadesColaboracion,
  habilidadesRequeridas: perfil.habilidadesRequeridas.map(({ id }) => id),
  habilidadesOpcionales: perfil.habilidadesOpcionales.map(({ id }) => id),
  limiteColaboraciones: textoDe(perfil.limiteColaboraciones),
  busquedaAbiertaHasta: perfil.busquedaAbiertaHasta
    ? aDiaLocal(perfil.busquedaAbiertaHasta)
    : "",
})

// Cómo viaja al back cada campo del formulario. Las claves son las del back.
const VALOR_PARA_EL_BACK = {
  nombre: (texto) => texto.trim(),
  descripcion: (texto) => texto.trim(),
  cantidadHoras: Number,
  unidadCompromiso: (unidad) => unidad,
  modalidadesColaboracion: (modalidades) => modalidades,
  habilidadesRequeridas: (ids) => ids,
  habilidadesOpcionales: (ids) => ids,
  limiteColaboraciones: (texto) => (texto === "" ? null : Number(texto)),
  busquedaAbiertaHasta: (diaLocal) =>
    diaLocal === "" ? null : finDelDia(diaLocal).toISOString(),
}

const paraElBack = (datos) =>
  Object.fromEntries(
    Object.entries(VALOR_PARA_EL_BACK).map(([campo, convertir]) => [
      campo,
      convertir(datos[campo]),
    ]),
  )

const sonIguales = (a, b) =>
  Array.isArray(a)
    ? a.length === b.length && a.every((id) => b.includes(id))
    : a === b

// Al editar solo viaja lo que la persona cambió. Reenviar un campo sin tocar
// puede hacer que el back rechace todo, como una fecha límite que ya venció.
const cambiosEntre = (inicial, actual) =>
  Object.fromEntries(
    Object.entries(paraElBack(actual)).filter(
      ([campo]) => !sonIguales(inicial[campo], actual[campo]),
    ),
  )

// Lo que no puede faltar para guardar. Las reglas del negocio (horas, límite,
// fecha futura) las decide el back y se muestra su mensaje.
const MENSAJE_SI_FALTA = {
  nombre: "El nombre no puede quedar vacío.",
  descripcion: "La descripción no puede quedar vacía.",
  cantidadHoras: "Indicá la cantidad de horas.",
  unidadCompromiso: "Elegí la unidad de compromiso.",
  modalidadesColaboracion: "Elegí al menos una modalidad de colaboración.",
  habilidadesRequeridas: "Elegí al menos una habilidad requerida.",
}

const estaVacio = (valor) =>
  Array.isArray(valor) ? valor.length === 0 : valor.trim() === ""

const faltantesDe = (datos) =>
  Object.fromEntries(
    Object.entries(MENSAJE_SI_FALTA).filter(([campo]) =>
      estaVacio(datos[campo]),
    ),
  )

// Con `perfil` edita ese perfil; sin `perfil` agrega uno nuevo al proyecto.
// En los dos casos avisa con alGuardar(nombre) cuando el back lo guardó.
const FormularioDePerfil = ({ perfil, proyectoId, alCerrar, alGuardar }) => {
  const inicial = perfil ? aFormulario(perfil) : PERFIL_VACIO
  const textos = perfil
    ? {
        titulo: `Editar el perfil ${perfil.nombre}`,
        guardar: "Guardar",
        enviando: "Guardando...",
      }
    : {
        titulo: "Agregar un perfil",
        guardar: "Agregar perfil",
        enviando: "Agregando...",
      }

  const [datos, setDatos] = useState(inicial)
  const [habilidades, setHabilidades] = useState(null)
  const [errorDeCarga, setErrorDeCarga] = useState(null)
  const [intento, setIntento] = useState(0)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)
  // Los faltantes se marcan recién cuando la persona intenta guardar.
  const [revisado, setRevisado] = useState(false)

  const theme = useTheme()
  const pantallaChica = useMediaQuery(theme.breakpoints.down("md"))

  useEffect(() => {
    let vigente = true
    setErrorDeCarga(null)
    obtenerHabilidades()
      .then((catalogo) => vigente && setHabilidades(catalogo))
      .catch((e) => vigente && setErrorDeCarga(mensajeDeError(e)))

    return () => {
      vigente = false
    }
  }, [intento])

  const faltantes = revisado ? faltantesDe(datos) : {}
  const hayFaltantes = Object.keys(faltantes).length > 0

  const cambiar = (campo) => (valor) => {
    setDatos({ ...datos, [campo]: valor })
  }

  const escribir = (campo) => (e) => cambiar(campo)(e.target.value)

  const cerrar = () => {
    // Mientras se envía no se cierra: si no, no se vería si salió bien.
    if (!enviando) {
      alCerrar()
    }
  }

  const guardar = async (evento) => {
    evento.preventDefault()
    if (Object.keys(faltantesDe(datos)).length > 0) {
      setRevisado(true)
      return
    }

    const cambios = cambiosEntre(inicial, datos)
    if (perfil && Object.keys(cambios).length === 0) {
      alCerrar()
      return
    }

    setEnviando(true)
    setError(null)
    try {
      if (perfil) {
        await modificarPerfil(proyectoId, perfil.id, cambios)
      } else {
        await agregarPerfil(proyectoId, paraElBack(datos))
      }
    } catch (e) {
      setError(mensajeDeError(e))
      setEnviando(false)
      return
    }
    alGuardar(datos.nombre.trim())
  }

  const aviso =
    error ??
    (hayFaltantes ? "Completá los campos marcados para poder guardar." : null)

  return (
    <Dialog
      open
      onClose={cerrar}
      fullWidth
      maxWidth="sm"
      fullScreen={pantallaChica}
      // Sin la validación del navegador: un valor que el negocio no acepta
      // llega al back y se muestra su mensaje.
      slotProps={{
        paper: { component: "form", onSubmit: guardar, noValidate: true },
      }}
    >
      <DialogTitle>{textos.titulo}</DialogTitle>
      <DialogContent className="formulario-de-perfil">
        {errorDeCarga && (
          <MensajeDeError
            mensaje={errorDeCarga}
            alReintentar={() => setIntento(intento + 1)}
          />
        )}
        {!errorDeCarga && !habilidades && (
          <Cargando texto="Cargando las habilidades..." />
        )}
        {habilidades && (
          <>
            <TextField
              label="Nombre"
              value={datos.nombre}
              onChange={escribir("nombre")}
              error={Boolean(faltantes.nombre)}
              helperText={
                faltantes.nombre ?? "Por ejemplo: Desarrollo frontend"
              }
              required
              fullWidth
              margin="dense"
            />
            <TextField
              label="Descripción"
              value={datos.descripcion}
              onChange={escribir("descripcion")}
              error={Boolean(faltantes.descripcion)}
              helperText={
                faltantes.descripcion ??
                "Contá qué va a hacer la persona que lo ocupe"
              }
              multiline
              minRows={3}
              required
              fullWidth
            />
            <div className="formulario-de-perfil-par">
              <TextField
                label="Cantidad de horas"
                type="number"
                value={datos.cantidadHoras}
                onChange={escribir("cantidadHoras")}
                error={Boolean(faltantes.cantidadHoras)}
                helperText={faltantes.cantidadHoras}
                slotProps={{ htmlInput: { min: 1 } }}
                required
                fullWidth
              />
              <TextField
                select
                label="Unidad de compromiso"
                value={datos.unidadCompromiso}
                onChange={escribir("unidadCompromiso")}
                error={Boolean(faltantes.unidadCompromiso)}
                helperText={faltantes.unidadCompromiso}
                required
                fullWidth
              >
                {Object.entries(UNIDADES_DE_COMPROMISO).map(
                  ([valor, etiqueta]) => (
                    <MenuItem key={valor} value={valor}>
                      {etiqueta}
                    </MenuItem>
                  ),
                )}
              </TextField>
            </div>
            <div>
              <SelectorDeHabilidades
                titulo="Modalidades de colaboración"
                habilidades={OPCIONES_DE_MODALIDAD}
                elegidas={datos.modalidadesColaboracion}
                alCambiar={cambiar("modalidadesColaboracion")}
              />
              {faltantes.modalidadesColaboracion && (
                <FormHelperText error>
                  {faltantes.modalidadesColaboracion}
                </FormHelperText>
              )}
            </div>
            <div>
              <SelectorDeHabilidades
                titulo="Habilidades requeridas"
                habilidades={habilidades}
                elegidas={datos.habilidadesRequeridas}
                alCambiar={cambiar("habilidadesRequeridas")}
              />
              {faltantes.habilidadesRequeridas && (
                <FormHelperText error>
                  {faltantes.habilidadesRequeridas}
                </FormHelperText>
              )}
            </div>
            <SelectorDeHabilidades
              titulo="Habilidades opcionales"
              habilidades={habilidades}
              elegidas={datos.habilidadesOpcionales}
              alCambiar={cambiar("habilidadesOpcionales")}
            />
            <div className="formulario-de-perfil-par">
              <TextField
                label="Límite de colaboraciones"
                type="number"
                value={datos.limiteColaboraciones}
                onChange={escribir("limiteColaboraciones")}
                helperText="Vacío, el perfil no tiene límite"
                slotProps={{ htmlInput: { min: 1 } }}
                fullWidth
              />
              <TextField
                label="Fecha límite de búsqueda"
                type="date"
                value={datos.busquedaAbiertaHasta}
                onChange={escribir("busquedaAbiertaHasta")}
                helperText="Vacía, la búsqueda no tiene fecha límite"
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
            </div>
          </>
        )}
      </DialogContent>
      {/* Fuera del contenido, que tiene scroll: así el aviso siempre se ve. */}
      {aviso && (
        <div className="formulario-de-perfil-aviso">
          <MensajeDeError mensaje={aviso} />
        </div>
      )}
      <DialogActions>
        <Button onClick={cerrar} disabled={enviando}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={!habilidades || enviando}
        >
          {enviando ? textos.enviando : textos.guardar}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default FormularioDePerfil
