import { createContext, useCallback, useContext, useState } from "react"
import { Alert, Snackbar, useMediaQuery } from "@mui/material"
import { useTheme } from "@mui/material/styles"

const AvisosContext = createContext(null)

const DURACION = 6000

// Avisos globales para confirmar que algo salió bien ("Te diste de baja",
// "Postulación aceptada"). Los errores no van acá: se muestran en pantalla,
// al lado de la acción que falló.
export const ProveedorDeAvisos = ({ children }) => {
  const [aviso, setAviso] = useState(null)
  const theme = useTheme()
  const desdeTablet = useMediaQuery(theme.breakpoints.up("md"))

  const mostrarAviso = useCallback((texto, { severidad = "success" } = {}) => {
    // La clave nueva hace que un aviso reemplace al anterior y reinicie el tiempo.
    setAviso({ texto, severidad, clave: Date.now() })
  }, [])

  const cerrar = (_evento, motivo) => {
    if (motivo === "clickaway") {
      return
    }
    setAviso(null)
  }

  return (
    <AvisosContext.Provider value={{ mostrarAviso }}>
      {children}
      <Snackbar
        key={aviso?.clave}
        open={aviso !== null}
        autoHideDuration={DURACION}
        onClose={cerrar}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: desdeTablet ? "right" : "center",
        }}
      >
        {aviso && (
          <Alert
            severity={aviso.severidad}
            role="status"
            onClose={cerrar}
            className="aviso"
            sx={{ boxShadow: 8 }}
          >
            {aviso.texto}
          </Alert>
        )}
      </Snackbar>
    </AvisosContext.Provider>
  )
}

export const useAvisos = () => useContext(AvisosContext)
