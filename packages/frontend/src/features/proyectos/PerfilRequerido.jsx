import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Alert, Button, Chip } from "@mui/material"
import { LuLock, LuUserRound } from "react-icons/lu"
import ConfirmarAccion from "../../components/confirmarAccion/ConfirmarAccion"
import Cupos from "../../components/cupos/Cupos"
import ListaDeHabilidades from "../../components/listaDeHabilidades/ListaDeHabilidades"
import { useAuth } from "../../context/AuthContext"
import { useAvisos } from "../../context/AvisosContext"
import { mensajeDeError } from "../../service/api"
import { obtenerColaboradoresPerfil } from "../../service/colaboradorasService"
import {
  crearPostulacion,
  obtenerPostulacionesColaborador,
} from "../../service/postulacionesService"
import { modificarPerfil } from "../../service/proyectosService"
import EditarPerfil from "./EditarPerfil"
import "./PerfilRequerido.css"

const formatoDia = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})

const GrupoDeHabilidades = ({ titulo, habilidades, opcionales }) => {
  if (habilidades.length === 0) {
    return null
  }

  return (
    <div className="perfil-grupo">
      <h4>{titulo}</h4>
      <ListaDeHabilidades
        habilidades={habilidades.map((habilidad) => habilidad.titulo)}
        opcionales={opcionales}
      />
    </div>
  )
}

// Quiénes ya colaboran en el perfil. Las contribuciones anónimas no muestran
// ningún dato de la persona.
const Ocupantes = ({ ocupantes }) => {
  if (ocupantes.length === 0) {
    return null
  }

  return (
    <div className="perfil-grupo">
      <h4>{ocupantes.length === 1 ? "Lo ocupa" : "Lo ocupan"}</h4>
      <ul className="perfil-ocupantes">
        {ocupantes.map((ocupante, indice) => (
          <li key={ocupante.id ?? `anonima-${indice}`}>
            <LuUserRound aria-hidden="true" />
            {ocupante.esAnonima
              ? "Contribución anónima"
              : ocupante.nombreFantasia}
          </li>
        ))}
      </ul>
    </div>
  )
}

const PerfilRequerido = ({
  perfil,
  proyectoId,
  proyectoAbierto,
  esDueno,
  alModificar,
}) => {
  const { usuario } = useAuth()
  const { mostrarAviso } = useAvisos()
  // Qué diálogo está abierto: "POSTULARSE", "CERRAR_BUSQUEDA", "EDITAR" o null.
  const [dialogo, setDialogo] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)
  const [yaSePostulo, setYaSePostulo] = useState(false)
  const [ocupantes, setOcupantes] = useState([])

  const esColaboradora = usuario?.rol === "PERSONA_COLABORADORA"
  const cantidadAceptadas = perfil.postulacionesAceptadas.length
  const rutaDelPerfil = `/proyectos/${proyectoId}/perfiles/${perfil.id}`

  // La búsqueda de un perfil se cierra con el proyecto, a mano o cuando pasa
  // su fecha límite.
  const fechaLimite = perfil.busquedaAbiertaHasta
  const vencio = fechaLimite !== null && fechaLimite < new Date()
  const busquedaAbierta = proyectoAbierto && perfil.busquedaAbierta && !vencio
  const puedeGestionar = esDueno && proyectoAbierto

  // Solo una persona colaboradora tiene postulaciones propias para revisar.
  useEffect(() => {
    if (!esColaboradora) {
      return
    }

    let vigente = true
    obtenerPostulacionesColaborador()
      .then((postulaciones) => {
        if (vigente) {
          setYaSePostulo(
            postulaciones.some(
              (postulacion) =>
                postulacion.proyecto?.id === proyectoId &&
                postulacion.perfil?.id === perfil.id,
            ),
          )
        }
      })
      // Si falla, el botón queda habilitado y el back avisa si ya se postuló.
      .catch(() => {})

    return () => {
      vigente = false
    }
  }, [esColaboradora, proyectoId, perfil.id])

  useEffect(() => {
    if (cantidadAceptadas === 0) {
      return
    }

    let vigente = true
    obtenerColaboradoresPerfil(proyectoId, perfil.id)
      .then((colaboradoras) => vigente && setOcupantes(colaboradoras))
      // Quién ocupa el rol es un dato extra: si no llega, la tarjeta sigue.
      .catch(() => {})

    return () => {
      vigente = false
    }
  }, [cantidadAceptadas, proyectoId, perfil.id])

  const postularse = async (esAnonima) => {
    setEnviando(true)
    setError(null)
    try {
      await crearPostulacion(proyectoId, perfil.id, esAnonima)
      setYaSePostulo(true)
      setDialogo(null)
      mostrarAviso(
        "Tu postulación fue enviada. El colectivo la revisará a la brevedad.",
      )
    } catch (e) {
      // El error se muestra en la tarjeta, al lado de la acción.
      setDialogo(null)
      setError(mensajeDeError(e))
    } finally {
      setEnviando(false)
    }
  }

  const avisarYRefrescar = (aviso) => {
    setDialogo(null)
    mostrarAviso(aviso)
    return alModificar()
  }

  const cambiarBusqueda = async (cambios, aviso) => {
    setDialogo(null)
    setEnviando(true)
    setError(null)
    try {
      await modificarPerfil(proyectoId, perfil.id, cambios)
      await avisarYRefrescar(aviso)
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setEnviando(false)
    }
  }

  const cerrarBusqueda = () =>
    cambiarBusqueda(
      { busquedaAbierta: false },
      `Cerraste la búsqueda del perfil ${perfil.nombre}.`,
    )

  // Con la fecha límite vencida, abrirla a mano no alcanza: hay que quitarla.
  const reabrirBusqueda = () =>
    vencio
      ? cambiarBusqueda(
          { busquedaAbierta: true, busquedaAbiertaHasta: null },
          `Reabriste la búsqueda del perfil ${perfil.nombre}. Ya no tiene fecha límite.`,
        )
      : cambiarBusqueda(
          { busquedaAbierta: true },
          `Reabriste la búsqueda del perfil ${perfil.nombre}.`,
        )

  const motivoNoPuedePostularse = yaSePostulo
    ? "Ya te postulaste a este perfil."
    : !proyectoAbierto
      ? "La búsqueda de este proyecto está cerrada."
      : !busquedaAbierta
        ? "La búsqueda de este perfil está cerrada."
        : null

  return (
    <article className="perfil" aria-labelledby={`perfil-${perfil.id}`}>
      <header className="perfil-encabezado">
        <h3 id={`perfil-${perfil.id}`}>{perfil.nombre}</h3>
        {busquedaAbierta ? (
          <Cupos
            limite={perfil.limiteColaboraciones}
            aceptadas={cantidadAceptadas}
          />
        ) : (
          <Chip
            size="small"
            variant="suave"
            icon={<LuLock aria-hidden="true" />}
            label="Búsqueda cerrada"
          />
        )}
      </header>

      {busquedaAbierta && fechaLimite && (
        <p className="perfil-busqueda">
          Búsqueda abierta hasta el {formatoDia.format(fechaLimite)}
        </p>
      )}
      {proyectoAbierto && vencio && (
        <p className="perfil-busqueda">
          La búsqueda venció el {formatoDia.format(fechaLimite)}
        </p>
      )}

      {perfil.descripcion && <p>{perfil.descripcion}</p>}

      <dl className="perfil-datos">
        <dt>Compromiso</dt>
        <dd>{perfil.compromiso}</dd>
        <dt>Modalidades</dt>
        <dd>{perfil.modalidades.join(", ") || "Sin especificar"}</dd>
      </dl>

      <GrupoDeHabilidades
        titulo="Habilidades requeridas"
        habilidades={perfil.habilidadesRequeridas}
      />
      <GrupoDeHabilidades
        titulo="Habilidades opcionales"
        habilidades={perfil.habilidadesOpcionales}
        opcionales
      />
      <Ocupantes ocupantes={ocupantes} />

      <div className="perfil-acciones">
        {esColaboradora && (
          <Button
            variant="contained"
            size="small"
            onClick={() => {
              setError(null)
              setDialogo("POSTULARSE")
            }}
            disabled={enviando || motivoNoPuedePostularse !== null}
            aria-describedby={
              motivoNoPuedePostularse ? `motivo-${perfil.id}` : undefined
            }
          >
            Postularme
          </Button>
        )}
        {esDueno && (
          <Button
            variant="contained"
            size="small"
            component={Link}
            to={`${rutaDelPerfil}/postulaciones`}
          >
            Revisar postulaciones
          </Button>
        )}
        {esDueno && proyectoAbierto && (
          <Button
            variant="outlined"
            size="small"
            component={Link}
            to={`${rutaDelPerfil}/candidatas`}
          >
            Ver candidatas
          </Button>
        )}
        {puedeGestionar &&
          (busquedaAbierta ? (
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              onClick={() => setDialogo("CERRAR_BUSQUEDA")}
              disabled={enviando}
            >
              Cerrar búsqueda
            </Button>
          ) : (
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              onClick={reabrirBusqueda}
              disabled={enviando}
            >
              Reabrir búsqueda
            </Button>
          ))}
        {puedeGestionar && (
          <Button
            variant="outlined"
            color="inherit"
            size="small"
            onClick={() => {
              setError(null)
              setDialogo("EDITAR")
            }}
            disabled={enviando}
          >
            Editar perfil
          </Button>
        )}
        <Button
          variant="text"
          size="small"
          component={Link}
          to={`${rutaDelPerfil}/colaboradores`}
        >
          Ver colaboradores
        </Button>
      </div>

      {esColaboradora && motivoNoPuedePostularse && (
        <p id={`motivo-${perfil.id}`} className="perfil-motivo">
          {motivoNoPuedePostularse}
        </p>
      )}
      {error && <Alert severity="error">{error}</Alert>}

      <ConfirmarAccion
        abierto={dialogo === "POSTULARSE"}
        titulo="Enviar postulación"
        mensaje="¿Querés que tu contribución permanezca anónima en la plataforma? Si es anónima, en el proyecto no se va a mostrar tu nombre."
        textoConfirmar="Sí, anónima"
        textoAlternativo="No, pública"
        alConfirmar={() => postularse(true)}
        alAlternativo={() => postularse(false)}
        alCancelar={() => setDialogo(null)}
        peligrosa={false}
      />
      <ConfirmarAccion
        abierto={dialogo === "CERRAR_BUSQUEDA"}
        titulo="Cerrar búsqueda"
        mensaje={`Las personas no van a poder postularse al perfil ${perfil.nombre} mientras la búsqueda esté cerrada. Podés reabrirla cuando quieras.`}
        textoConfirmar="Cerrar búsqueda"
        alConfirmar={cerrarBusqueda}
        alCancelar={() => setDialogo(null)}
        peligrosa={false}
      />
      {dialogo === "EDITAR" && (
        <EditarPerfil
          perfil={perfil}
          proyectoId={proyectoId}
          alCerrar={() => setDialogo(null)}
          alGuardar={() =>
            avisarYRefrescar(
              `Guardaste los cambios del perfil ${perfil.nombre}.`,
            )
          }
        />
      )}
    </article>
  )
}

export default PerfilRequerido
