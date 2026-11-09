import { useState } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { Alert, Button, Card, TextField } from "@mui/material"
import { useAuth } from "../../context/AuthContext"
import { mensajeDeError } from "../../service/api"
import "./Login.css"

const Login = () => {
  const { usuario, login } = useAuth()
  const location = useLocation()

  const [email, setEmail] = useState("")
  const [contrasena, setContrasena] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  if (usuario) {
    return <Navigate to={location.state?.desde ?? "/"} replace />
  }

  const ingresar = async (evento) => {
    evento.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      await login(email, contrasena)
    } catch (e) {
      setError(mensajeDeError(e))
      setEnviando(false)
    }
  }

  return (
    <div className="login">
      <Card className="login-tarjeta">
        <h1>Ingresar</h1>

        {error && <Alert severity="error">{error}</Alert>}

        <form onSubmit={ingresar} className="login-formulario">
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            required
            fullWidth
          />
          <Button type="submit" variant="contained" disabled={enviando}>
            {enviando ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>
      </Card>
    </div>
  )
}

export default Login
