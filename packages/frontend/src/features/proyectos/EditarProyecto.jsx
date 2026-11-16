import { useEffect, useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import Cargando from "../../components/cargando/Cargando"
import MensajeDeError from "../../components/mensajeDeError/MensajeDeError"
import { useAuth } from "../../context/AuthContext"
import { useAvisos } from "../../context/AvisosContext"
import { mensajeDeError } from "../../service/api"
import {
  modificarProyecto,
  obtenerProyecto,
} from "../../service/proyectosService"
import FormularioProyecto from "./FormularioProyecto"
import "./EditarProyecto.css"

const EditarProyecto = () => {
  const { id } = useParams()
  const { usuario } = useAuth()
  const { mostrarAviso } = useAvisos()
  const navigate = useNavigate()
  const rutaDelProyecto = `/proyectos/${id}`

  const [proyecto, setProyecto] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [errorDeCarga, setErrorDeCarga] = useState(null)
  const [intento, setIntento] = useState(0)

  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      setErrorDeCarga(null)
      try {
        setProyecto(await obtenerProyecto(id))
      } catch (e) {
        if (e.response?.status === 404) {
          setErrorDeCarga("Proyecto no encontrado")
        } else {
          setErrorDeCarga(mensajeDeError(e))
        }
      } finally {
        setCargando(false)
      }
    }

    cargar()
  }, [id, intento])

  const guardar = async (datos) => {
    // Solo viaja lo que cambió, igual que al editar un perfil.
    const cambios = Object.fromEntries(
      Object.entries(datos).filter(
        ([campo, valor]) => valor !== proyecto[campo],
      ),
    )
    if (Object.keys(cambios).length === 0) {
      navigate(rutaDelProyecto)
      return
    }

    setEnviando(true)
    setError(null)
    try {
      await modificarProyecto(id, cambios)
      mostrarAviso(`Guardaste los cambios del proyecto ${datos.titulo}.`)
      navigate(rutaDelProyecto)
    } catch (e) {
      setError(mensajeDeError(e))
      setEnviando(false)
    }
  }

  const renderFormulario = () => {
    if (cargando) {
      return <Cargando texto="Cargando el proyecto..." />
    }

    if (errorDeCarga) {
      return (
        <MensajeDeError
          mensaje={errorDeCarga}
          alReintentar={() => setIntento(intento + 1)}
        />
      )
    }

    // El back solo acepta cambios del colectivo dueño: a otro colectivo no
    // tiene sentido mostrarle el formulario.
    if (usuario.entidad?.id !== proyecto.colectivo.id) {
      return <Navigate to={rutaDelProyecto} replace />
    }

    return (
      <FormularioProyecto
        datosIniciales={proyecto}
        textoBoton="Guardar cambios"
        textoEnviando="Guardando..."
        rutaCancelar={rutaDelProyecto}
        enviando={enviando}
        error={error}
        alGuardar={guardar}
      />
    )
  }

  return (
    <section className="editar-proyecto">
      <h1>Editar el proyecto</h1>
      {renderFormulario()}
    </section>
  )
}

export default EditarProyecto
