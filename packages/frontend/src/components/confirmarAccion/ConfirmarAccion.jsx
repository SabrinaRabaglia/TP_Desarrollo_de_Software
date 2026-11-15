import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useMediaQuery,
} from "@mui/material"
import { useTheme } from "@mui/material/styles"

const ConfirmarAccion = ({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = "Confirmar",
  textoAlternativo,
  alConfirmar,
  alAlternativo,
  alCancelar,
  // Rojo para lo que no se puede deshacer (baja, rechazo). Para una elección
  // común, como el anonimato al postularse, va el color primario.
  peligrosa = true,
}) => {
  // En pantallas chicas el diálogo ocupa toda la pantalla: más lugar para leer
  // el mensaje y botones más fáciles de tocar.
  const theme = useTheme()
  const pantallaChica = useMediaQuery(theme.breakpoints.down("md"))

  return (
    <Dialog open={abierto} onClose={alCancelar} fullScreen={pantallaChica}>
      <DialogTitle>{titulo}</DialogTitle>
      <DialogContent>
        <DialogContentText>{mensaje}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={alCancelar} autoFocus>
          Cancelar
        </Button>
        {textoAlternativo && (
          <Button onClick={alAlternativo}>{textoAlternativo}</Button>
        )}
        <Button
          onClick={alConfirmar}
          color={peligrosa ? "error" : "primary"}
          variant="contained"
        >
          {textoConfirmar}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ConfirmarAccion
