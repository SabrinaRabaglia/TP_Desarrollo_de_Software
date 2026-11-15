import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Alert, Button } from "@mui/material"
import { LuLogIn } from "react-icons/lu"
import Cargando from "../../components/cargando/Cargando"
import MensajeDeError from "../../components/mensajeDeError/MensajeDeError"
import ValorDelMedio from "../../components/valorDelMedio/ValorDelMedio"
import { useAuth } from "../../context/AuthContext"
import { mensajeDeError } from "../../service/api"
import {
  obtenerMediosDeContacto,
  TIPOS_DE_MEDIO,
} from "../../service/colaboradorasService"
import "./DatosDeContacto.css"

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
        <Button
          variant="outlined"
          size="small"
          component={Link}
          to="/login"
          state={{ desde: location }}
          startIcon={<LuLogIn aria-hidden="true" />}
        >
          Ingresá para ver los datos de contacto
        </Button>
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
      return (
        <p className="datos-de-contacto-vacio">
          Esta persona no cargó medios de contacto.
        </p>
      )
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
