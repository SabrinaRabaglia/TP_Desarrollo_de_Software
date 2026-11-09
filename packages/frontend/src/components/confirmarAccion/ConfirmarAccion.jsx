import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material"

const ConfirmarAccion = ({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = "Confirmar",
  alConfirmar,
  alCancelar,
}) => {
  return (
    <Dialog open={abierto} onClose={alCancelar}>
      <DialogTitle>{titulo}</DialogTitle>
      <DialogContent>
        <DialogContentText>{mensaje}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={alCancelar} autoFocus>
          Cancelar
        </Button>
        <Button onClick={alConfirmar} color="error" variant="contained">
          {textoConfirmar}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ConfirmarAccion
