import ListaDeHabilidades from "../../components/listaDeHabilidades/ListaDeHabilidades"
import ConfirmarAccion from "../../components/confirmarAccion/ConfirmarAccion.jsx"
import "./PerfilRequerido.css"
import { crearPostulacion } from "../../service/postulacionesService.js"
import { mensajeDeError } from "../../service/api.js"
import { useState } from "react"
import { useAuth } from "../../context/AuthContext.jsx"
import { useNavigate } from "react-router-dom"

const GrupoDeHabilidades = ({ titulo, habilidades }) => {
  if (habilidades.length === 0) {
    return null
  }

  return (
    <div className="perfil-habilidades">
      <h4>{titulo}</h4>
      <ListaDeHabilidades habilidades={habilidades} />
    </div>
  )
}

const PerfilRequerido = ({ perfil, proyectoId }) => {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState(false)
  const [error, setError] = useState(null)

  const verPostulaciones = () => {
   navigate(`/proyectos/${proyectoId}/perfiles/${perfil.id}/postulaciones`)
  }

  const postularse = async (esAnonima) => {
    try {
      setEnviando(true)
      setError(null)
      setExito(false)

      await crearPostulacion(proyectoId, perfil.id, esAnonima)

      setExito(true)
      setDialogoAbierto(false)
    } catch (error) {
      setError(mensajeDeError(error))
    } finally {
      setEnviando(false)
    }
  }
  return (
    <article className="perfil">
      <h3>{perfil.nombre}</h3>
      <p>{perfil.descripcion}</p>
      <dl className="perfil-datos">
        <dt>Compromiso</dt>
        <dd>{perfil.compromiso}</dd>
        <dt>Modalidades</dt>
        <dd>{perfil.modalidades.join(", ")}</dd>
      </dl>
      <GrupoDeHabilidades
        titulo="Habilidades requeridas"
        habilidades={perfil.habilidadesRequeridas}
      />
      <GrupoDeHabilidades
        titulo="Habilidades opcionales"
        habilidades={perfil.habilidadesOpcionales}
      />
      {usuario?.rol === "PERSONA_COLABORADORA" && (
      <button type="button" 
        onClick={() => {
          setError(null)
          setExito(false)
          setDialogoAbierto(true)
        }}
        disabled={enviando}
        >
        Postularme
      </button>)}
      {exito && <p>Tu postulación fue enviada.</p>}

        {error && <p role="alert">{error}</p>}

        <ConfirmarAccion
          abierto={dialogoAbierto}
          titulo="Enviar postulación"
          mensaje="¿Querés que tu contribución permanezca anónima en la plataforma?"
          textoConfirmar="Sí, anónima"
          textoAlternativo="No, pública"
          alConfirmar={() => postularse(true)}
          alAlternativo={() => postularse(false)}
          alCancelar={() => setDialogoAbierto(false)}
        />
        {usuario?.rol === "COLECTIVO" &&(
          <button type="button"
            onClick={verPostulaciones}>
            Revisar Postulaciones
          </button>
        )}
    </article>
  )
}

export default PerfilRequerido
