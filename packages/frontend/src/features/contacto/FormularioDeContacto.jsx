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

const FormularioDeContacto = ({
  candidata,
  proyectoId,
  perfilId,
  alCerrar,
  alEnviar,
}) => {
  const [contenido, setContenido] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

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
    setError(null)
    try {
      await enviarMensaje({
        proyectoId,
        perfilId,
        personaId: candidata.id,
        contenido,
      })
      alEnviar(candidata)
    } catch (e) {
      setError(mensajeDeError(e))
      setEnviando(false)
    }
  }

  return (
    <Dialog
      open
      onClose={cerrar}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { component: "form", onSubmit: enviar } }}
    >
      <DialogTitle>Escribirle a {candidata.nombreFantasia}</DialogTitle>
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
        {error && <Alert severity="error">{error}</Alert>}
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
