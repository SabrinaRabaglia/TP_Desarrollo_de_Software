import { useState } from "react"
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material"
import { mensajeDeError } from "../../service/api"
import { enviarMensaje } from "../../service/mensajesService"
import "./FormularioDeContacto.css"

// Mismo máximo que valida el back.
const MAXIMO_DE_CARACTERES = 4096

const nombres = (candidatas) =>
  new Intl.ListFormat("es", { type: "conjunction" }).format(
    candidatas.map((candidata) => candidata.nombreFantasia),
  )

// El mismo mensaje sale una vez por destinataria. El back decide a quién se
// le puede escribir: las que rechaza vuelven con su motivo.
const FormularioDeContacto = ({
  candidatas,
  proyectoId,
  perfilId,
  alCerrar,
  alEnviar,
}) => {
  const [contenido, setContenido] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [rechazadas, setRechazadas] = useState([])

  const vacio = contenido.trim() === ""

  const cerrar = () => {
    // Mientras se envía no se cierra: si no, no se vería si salió bien.
    if (!enviando) {
      alCerrar()
    }
  }

  const enviar = async (evento) => {
    evento.preventDefault()
    setEnviando(true)
    setRechazadas([])
    const resultados = await Promise.allSettled(
      candidatas.map((candidata) =>
        enviarMensaje({
          proyectoId,
          perfilId,
          personaId: candidata.id,
          contenido,
        }),
      ),
    )
    const enviadas = candidatas.filter(
      (_candidata, indice) => resultados[indice].status === "fulfilled",
    )
    const sinEnviar = candidatas.flatMap((candidata, indice) =>
      resultados[indice].status === "rejected"
        ? [{ candidata, motivo: mensajeDeError(resultados[indice].reason) }]
        : [],
    )
    if (enviadas.length > 0) {
      alEnviar({ enviadas, rechazadas: sinEnviar })
      return
    }
    setRechazadas(sinEnviar)
    setEnviando(false)
  }

  return (
    <Dialog
      open
      onClose={cerrar}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { component: "form", onSubmit: enviar } }}
    >
      <DialogTitle>Escribirle a {nombres(candidatas)}</DialogTitle>
      <DialogContent className="formulario-de-contacto">
        <TextField
          label="Mensaje"
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          multiline
          minRows={5}
          fullWidth
          autoFocus
          margin="dense"
          helperText={`${contenido.length} de ${MAXIMO_DE_CARACTERES} caracteres`}
          slotProps={{ htmlInput: { maxLength: MAXIMO_DE_CARACTERES } }}
        />
        {rechazadas.map(({ candidata, motivo }) => (
          <Alert key={candidata.id} severity="error">
            No se envió a {candidata.nombreFantasia}: {motivo}
          </Alert>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={cerrar} disabled={enviando}>
          Cancelar
        </Button>
        <Button type="submit" variant="contained" disabled={vacio || enviando}>
          {enviando ? "Enviando..." : "Enviar"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default FormularioDeContacto
