import { useEffect, useState } from "react"
import { Card, CardContent } from "@mui/material"
import Cargando from "../../components/cargando/Cargando"
import MensajeDeError from "../../components/mensajeDeError/MensajeDeError"
import { mensajeDeError } from "../../service/api"
import "./ColaboradoresPerfil.css"
import { useParams } from "react-router-dom"
import { obtenerColaboradoresPerfil } from "../../service/colaboradorasService.js"
import ListaDeCuentas from "../../components/listaDeCuentas/ListaDeCuentas.jsx"


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
  const { proyectoId , perfilId } = useParams()
  const [colaboradores, setColaboradores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      setError(null)
      try {
        setColaboradores(await obtenerColaboradoresPerfil(proyectoId, perfilId))
      } catch (e) {
        setError(mensajeDeError(e))
      } finally {
        setCargando(false)
      }
    }

    cargar()
  }, [intento ,proyectoId, perfilId])

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

    return (
      <ul className="todos-los-colaboradores">
        {colaboradores.map((colaborador) => (
          <li key={colaborador.id}>
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
                          {colaborador.presentacion ??
                            "Sin presentación"}
                        </div>
                      </div>
                    </div>

                    <div className="cuentas-colaborador">
                      <span className="cuentas-titulo">Cuentas: </span>
                      <GrupoDeCuentas
                        cuentas={colaborador.cuentas}
                      />
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
      <h1>Colaboradores Activos</h1>
      <p className="colaboradores-bajada">
        Aca veran todos los usuarios que ya estan colaborando en este perfil
      </p>
      <h2>Colaboradores</h2>
      {renderColaboradores()}
    </section>
  )
}

export default ColaboradoresPerfil
