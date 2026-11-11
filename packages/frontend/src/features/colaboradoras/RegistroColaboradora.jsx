import { useEffect, useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { TextField } from "@mui/material"
import Cargando from "../../components/cargando/Cargando"
import MensajeDeError from "../../components/mensajeDeError/MensajeDeError"
import { useAuth } from "../../context/AuthContext"
import { mensajeDeError } from "../../service/api"
import { registrarColaboradora } from "../../service/colaboradorasService"
import { obtenerHabilidades } from "../../service/habilidadesService"
import FormularioColaboradora from "./FormularioColaboradora"
import "./RegistroColaboradora.css"

const RegistroColaboradora = () => {
  const { usuario, login } = useAuth()

  const [habilidades, setHabilidades] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorDeCarga, setErrorDeCarga] = useState(null)
  const [intento, setIntento] = useState(0)

  const [email, setEmail] = useState("")
  const [contrasena, setContrasena] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      setErrorDeCarga(null)
      try {
        setHabilidades(await obtenerHabilidades())
      } catch (e) {
        setErrorDeCarga(mensajeDeError(e))
      } finally {
        setCargando(false)
      }
    }

    cargar()
  }, [intento])

  if (usuario) {
    return <Navigate to="/mi-cuenta" replace />
  }

  const registrarse = async (persona) => {
    setEnviando(true)
    setError(null)
    try {
      await registrarColaboradora({ email, contrasena, persona })
      await login(email, contrasena)
    } catch (e) {
      setError(mensajeDeError(e))
      setEnviando(false)
    }
  }

  const renderFormulario = () => {
    if (cargando) {
      return <Cargando texto="Cargando el formulario..." />
    }

    if (errorDeCarga) {
      return (
        <MensajeDeError
          mensaje={errorDeCarga}
          alReintentar={() => setIntento(intento + 1)}
        />
      )
    }

    return (
      <FormularioColaboradora
        habilidades={habilidades}
        textoBoton="Crear cuenta"
        enviando={enviando}
        error={error}
        alGuardar={registrarse}
      >
        <fieldset className="registro-colaboradora-cuenta">
          <legend>Tu cuenta</legend>
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
            autoComplete="new-password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            helperText="Mínimo 8 caracteres"
            slotProps={{ htmlInput: { minLength: 8 } }}
            required
            fullWidth
          />
        </fieldset>
      </FormularioColaboradora>
    )
  }

  return (
    <section className="registro-colaboradora">
      <header className="registro-colaboradora-encabezado">
        <h1>Crear cuenta de colaboradora</h1>
        <p>
          ¿Ya tenés cuenta? <Link to="/login">Ingresá</Link>
        </p>
      </header>
      {renderFormulario()}
    </section>
  )
}

export default RegistroColaboradora
