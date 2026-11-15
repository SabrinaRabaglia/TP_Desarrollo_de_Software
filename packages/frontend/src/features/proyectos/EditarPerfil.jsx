import { useEffect, useState } from "react"
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  useMediaQuery,
} from "@mui/material"
import { useTheme } from "@mui/material/styles"
import Cargando from "../../components/cargando/Cargando"
import MensajeDeError from "../../components/mensajeDeError/MensajeDeError"
import SelectorDeHabilidades from "../../components/selectorDeHabilidades/SelectorDeHabilidades"
import { mensajeDeError } from "../../service/api"
import { obtenerHabilidades } from "../../service/habilidadesService"
import { modificarPerfil } from "../../service/proyectosService"
import "./EditarPerfil.css"

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

const aFormulario = (perfil) => ({
  descripcion: perfil.descripcion ?? "",
  cantidadHoras: textoDe(perfil.cantidadHoras),
  limiteColaboraciones: textoDe(perfil.limiteColaboraciones),
  busquedaAbiertaHasta: perfil.busquedaAbiertaHasta
    ? aDiaLocal(perfil.busquedaAbiertaHasta)
    : "",
  habilidadesRequeridas: perfil.habilidadesRequeridas.map(({ id }) => id),
  habilidadesOpcionales: perfil.habilidadesOpcionales.map(({ id }) => id),
})

// Cómo viaja al back cada campo del formulario. Las claves son las del PATCH.
const VALOR_PARA_EL_BACK = {
  descripcion: (texto) => texto,
  cantidadHoras: Number,
  limiteColaboraciones: (texto) => (texto === "" ? null : Number(texto)),
  busquedaAbiertaHasta: (diaLocal) =>
    diaLocal === "" ? null : finDelDia(diaLocal).toISOString(),
  habilidadesRequeridas: (ids) => ids,
  habilidadesOpcionales: (ids) => ids,
}

const sonIguales = (a, b) =>
  Array.isArray(a)
    ? a.length === b.length && a.every((id) => b.includes(id))
    : a === b

// Solo viaja lo que la persona cambió. Reenviar un campo sin tocar puede
// hacer que el back rechace todo, como una fecha límite que ya venció.
const cambiosEntre = (inicial, actual) =>
  Object.fromEntries(
    Object.keys(VALOR_PARA_EL_BACK)
      .filter((campo) => !sonIguales(inicial[campo], actual[campo]))
      .map((campo) => [campo, VALOR_PARA_EL_BACK[campo](actual[campo])]),
  )

const EditarPerfil = ({ perfil, proyectoId, alCerrar, alGuardar }) => {
  const inicial = aFormulario(perfil)
  const [datos, setDatos] = useState(inicial)
  const [habilidades, setHabilidades] = useState(null)
  const [errorDeCarga, setErrorDeCarga] = useState(null)
  const [intento, setIntento] = useState(0)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

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

  const sinDescripcion = datos.descripcion.trim() === ""

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
    const cambios = cambiosEntre(inicial, datos)
    if (Object.keys(cambios).length === 0) {
      alCerrar()
      return
    }

    setEnviando(true)
    setError(null)
    try {
      await modificarPerfil(proyectoId, perfil.id, cambios)
    } catch (e) {
      setError(mensajeDeError(e))
      setEnviando(false)
      return
    }
    alGuardar()
  }

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
      <DialogTitle>Editar el perfil {perfil.nombre}</DialogTitle>
      <DialogContent className="editar-perfil">
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
              label="Descripción"
              value={datos.descripcion}
              onChange={escribir("descripcion")}
              error={sinDescripcion}
              helperText={
                sinDescripcion ? "La descripción no puede quedar vacía." : null
              }
              multiline
              minRows={3}
              required
              fullWidth
              margin="dense"
            />
            <div className="editar-perfil-numeros">
              <TextField
                label="Cantidad de horas"
                type="number"
                value={datos.cantidadHoras}
                onChange={escribir("cantidadHoras")}
                fullWidth
              />
              <TextField
                label="Límite de colaboraciones"
                type="number"
                value={datos.limiteColaboraciones}
                onChange={escribir("limiteColaboraciones")}
                helperText="Vacío, el perfil no tiene límite"
                fullWidth
              />
            </div>
            <TextField
              label="Fecha límite de búsqueda"
              type="date"
              value={datos.busquedaAbiertaHasta}
              onChange={escribir("busquedaAbiertaHasta")}
              helperText="Vacía, la búsqueda no tiene fecha límite"
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <SelectorDeHabilidades
              titulo="Habilidades requeridas"
              habilidades={habilidades}
              elegidas={datos.habilidadesRequeridas}
              alCambiar={cambiar("habilidadesRequeridas")}
            />
            <SelectorDeHabilidades
              titulo="Habilidades opcionales"
              habilidades={habilidades}
              elegidas={datos.habilidadesOpcionales}
              alCambiar={cambiar("habilidadesOpcionales")}
            />
          </>
        )}
      </DialogContent>
      {/* Fuera del contenido, que tiene scroll: así el error siempre se ve. */}
      {error && (
        <div className="editar-perfil-error">
          <MensajeDeError mensaje={error} />
        </div>
      )}
      <DialogActions>
        <Button onClick={cerrar} disabled={enviando}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={!habilidades || sinDescripcion || enviando}
        >
          {enviando ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EditarPerfil
