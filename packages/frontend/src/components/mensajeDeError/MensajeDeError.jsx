import { Alert, Button } from "@mui/material"

const MensajeDeError = ({ mensaje, alReintentar }) => {
  const accion = alReintentar && (
    <Button color="inherit" size="small" onClick={alReintentar}>
      Reintentar
    </Button>
  )

  return (
    <Alert severity="error" action={accion}>
      {mensaje}
    </Alert>
  )
}

export default MensajeDeError
