import { useEffect, useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { TextField } from "@mui/material"
import Cargando from "../../components/cargando/Cargando"
import MensajeDeError from "../../components/mensajeDeError/MensajeDeError"
import { useAuth } from "../../context/AuthContext"
import { useAvisos } from "../../context/AvisosContext"
import { mensajeDeError } from "../../service/api"
import {
  obtenerCatalogosDeColectivo,
  registrarColectivo,
} from "../../service/colectivosService"
import FormularioColectivo from "./FormularioColectivo"
import "./RegistroColectivo.css"

const RegistroColectivo = () => {
  const { usuario, login } = useAuth()
  const { mostrarAviso } = useAvisos()

  const [catalogos, setCatalogos] = useState(null)
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
        setCatalogos(await obtenerCatalogosDeColectivo())
      } catch (e) {
        setErrorDeCarga(mensajeDeError(e))
      } finally {
        setCargando(false)
      }
    }

    cargar()
  }, [intento])

  if (usuario) {
    const destino =
      usuario.rol === "COLECTIVO"
        ? `/colectivos/${usuario.entidad.id}`
        : "/mi-cuenta"
    return <Navigate to={destino} replace />
  }

  const registrarse = async (colectivo) => {
    setEnviando(true)
    setError(null)
    try {
      await registrarColectivo({ email, contrasena, colectivo })
      await login(email, contrasena)
      mostrarAviso("Creamos la cuenta de tu colectivo")
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
      <FormularioColectivo
        catalogos={catalogos}
        textoBoton="Crear cuenta"
        enviando={enviando}
        error={error}
        alGuardar={registrarse}
      >
        <fieldset className="registro-colectivo-cuenta">
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
      </FormularioColectivo>
    )
  }

  return (
    <section className="registro-colectivo">
      <header className="registro-colectivo-encabezado">
        <h1>Registrar un colectivo</h1>
        <p>
          Creá la cuenta de tu colectivo para publicar proyectos y sumar
          personas colaboradoras.
        </p>
        <p>
          ¿Ya tenés cuenta? <Link to="/login">Ingresá</Link>
        </p>
      </header>
      {renderFormulario()}
    </section>
  )
}

export default RegistroColectivo
