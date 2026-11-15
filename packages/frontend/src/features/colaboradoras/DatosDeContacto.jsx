import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Alert } from "@mui/material"
import Cargando from "../../components/cargando/Cargando"
import MensajeDeError from "../../components/mensajeDeError/MensajeDeError"
import { useAuth } from "../../context/AuthContext"
import { mensajeDeError } from "../../service/api"
import {
  obtenerMediosDeContacto,
  TIPOS_DE_MEDIO,
} from "../../service/colaboradorasService"
import "./DatosDeContacto.css"

const ValorDelMedio = ({ medio }) => {
  if (medio.tipo === "TELEGRAM") {
    return "Conectado"
  }
  if (medio.tipo === "EMAIL") {
    return <a href={`mailto:${medio.valor}`}>{medio.valor}</a>
  }
  return medio.valor
}

const DatosDeContacto = ({ personaId }) => {
  const { usuario } = useAuth()
  const location = useLocation()

  const [medios, setMedios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [sinAcceso, setSinAcceso] = useState(null)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    if (!usuario) {
      return
    }

    const cargar = async () => {
      setCargando(true)
      setSinAcceso(null)
      setError(null)
      try {
        setMedios(await obtenerMediosDeContacto(personaId))
      } catch (e) {
        if (e.response?.status === 403) {
          setSinAcceso(mensajeDeError(e))
        } else {
          setError(mensajeDeError(e))
        }
      } finally {
        setCargando(false)
      }
    }

    cargar()
  }, [personaId, usuario, intento])

  const renderContenido = () => {
    if (!usuario) {
      return (
        <p>
          <Link to="/login" state={{ desde: location }}>
            Ingresá para ver los datos de contacto
          </Link>
        </p>
      )
    }

    if (cargando) {
      return <Cargando texto="Cargando los datos de contacto..." />
    }

    if (sinAcceso) {
      return <Alert severity="info">{sinAcceso}</Alert>
    }

    if (error) {
      return (
        <MensajeDeError
          mensaje={error}
          alReintentar={() => setIntento(intento + 1)}
        />
      )
    }

    if (medios.length === 0) {
      return <p>Esta persona no cargó medios de contacto.</p>
    }

    return (
      <dl className="datos-de-contacto-lista">
        {medios.map((medio) => (
          <div key={medio.id} className="datos-de-contacto-medio">
            <dt>{TIPOS_DE_MEDIO[medio.tipo]}</dt>
            <dd>
              <ValorDelMedio medio={medio} />
            </dd>
          </div>
        ))}
      </dl>
    )
  }

  return (
    <section
      className="datos-de-contacto"
      aria-labelledby="datos-de-contacto-titulo"
    >
      <h2 id="datos-de-contacto-titulo">Datos de contacto</h2>
      {renderContenido()}
    </section>
  )
}

export default DatosDeContacto
