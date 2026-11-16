import { useEffect, useState } from "react"
import { Card, CardContent } from "@mui/material"
import { LuUsers } from "react-icons/lu"
import Cargando from "../../components/cargando/Cargando"
import EstadoVacio from "../../components/estadoVacio/EstadoVacio"
import MensajeDeError from "../../components/mensajeDeError/MensajeDeError"
import { mensajeDeError } from "../../service/api"
import "./ColaboradoresPerfil.css"
import { useParams } from "react-router-dom"
import { obtenerColaboradoresPerfil } from "../../service/colaboradorasService.js"
import { obtenerResumenDelPerfil } from "../../service/proyectosService"
import ListaDeCuentas from "../../components/listaDeCuentas/ListaDeCuentas.jsx"
import Migas from "../../components/migas/Migas"

const GrupoDeCuentas = ({ cuentas }) => {
  if (cuentas.length === 0) {
    return null
  }

  return (
    <div className="perfil-habilidades">
      <ListaDeCuentas cuentas={cuentas} />
    </div>
  )
}

const ColaboradoresPerfil = () => {
  const { proyectoId, perfilId } = useParams()
  const [colaboradores, setColaboradores] = useState([])
  // Nombres para las migas
  const [resumen, setResumen] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      setError(null)
      try {
        const [colaboradoresCargados, resumenCargado] = await Promise.all([
          obtenerColaboradoresPerfil(proyectoId, perfilId),
          // Las migas son un dato extra: si no llegan, la lista sigue.
          obtenerResumenDelPerfil(proyectoId, perfilId).catch(() => null),
        ])
        setColaboradores(colaboradoresCargados)
        setResumen(resumenCargado)
      } catch (e) {
        setError(mensajeDeError(e))
      } finally {
        setCargando(false)
      }
    }

    cargar()
  }, [intento, proyectoId, perfilId])

  const renderColaboradores = () => {
    if (cargando) {
      return <Cargando texto="Cargando colaboradores..." />
    }

    if (error) {
      return (
        <MensajeDeError
          mensaje={error}
          alReintentar={() => setIntento(intento + 1)}
        />
      )
    }

    if (colaboradores.length === 0) {
      return (
        <EstadoVacio
          icono={<LuUsers />}
          titulo="Todavía no hay colaboradores en este perfil"
          texto="Cuando el colectivo acepte una postulación, la persona va a aparecer acá."
        />
      )
    }

    return (
      <ul className="todos-los-colaboradores">
        {colaboradores.map((colaborador, indice) => (
          // Las contribuciones anónimas llegan sin id.
          <li key={colaborador.id ?? `anonima-${indice}`}>
            <Card variant="outlined" className="colaborador">
              <CardContent>
                {colaborador.esAnonima ? (
                  <p>Colaborador anónimo</p>
                ) : (
                  <div className="colaborador-carta">
                    <div className="colaborador-header">
                      <div className="nombre-colaborador">
                        <span>Nombre: </span>
                        {colaborador.nombreCompleto
                          ? colaborador.nombreCompleto
                          : colaborador.nombreFantasia}

                        <div>
                          {colaborador.presentacion ?? "Sin presentación"}
                        </div>
                      </div>
                    </div>

                    <div className="cuentas-colaborador">
                      <span className="cuentas-titulo">Cuentas: </span>
                      <GrupoDeCuentas cuentas={colaborador.cuentas} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <section className="colaboradores">
      <Migas
        proyectoId={proyectoId}
        proyecto={resumen?.proyecto.titulo}
        perfil={resumen?.perfil?.nombre}
        actual="Colaboradores"
        cargando={cargando && !resumen}
      />
      <h1>Colaboradores</h1>
      <p className="colaboradores-bajada">
        Las personas que ya están colaborando en este perfil.
      </p>
      {renderColaboradores()}
    </section>
  )
}

export default ColaboradoresPerfil
