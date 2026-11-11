import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import Cargando from "../../components/cargando/Cargando"
import ListaDeHabilidades from "../../components/listaDeHabilidades/ListaDeHabilidades"
import MensajeDeError from "../../components/mensajeDeError/MensajeDeError"
import { mensajeDeError } from "../../service/api"
import {
  obtenerColaboradora,
  TIPOS_DE_CUENTA,
} from "../../service/colaboradorasService"
import DatosDeContacto from "./DatosDeContacto"
import "./PaginaColaboradora.css"

const PaginaColaboradora = () => {
  const { id } = useParams()

  const [colaboradora, setColaboradora] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      setError(null)
      try {
        setColaboradora(await obtenerColaboradora(id))
      } catch (e) {
        if (e.response?.status === 404) {
          setError("Persona no encontrada")
        } else {
          setError(mensajeDeError(e))
        }
      } finally {
        setCargando(false)
      }
    }

    cargar()
  }, [id, intento])

  if (cargando) {
    return <Cargando texto="Cargando el perfil..." />
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
    <article className="pagina-colaboradora">
      <header className="pagina-colaboradora-encabezado">
        <h1>{colaboradora.nombreFantasia}</h1>
        {colaboradora.nombreCompleto && (
          <p className="pagina-colaboradora-nombre">
            {colaboradora.nombreCompleto}
          </p>
        )}
        {colaboradora.pronombres.length > 0 && (
          <p className="pagina-colaboradora-pronombres">
            Pronombres: {colaboradora.pronombres.join(", ")}
          </p>
        )}
      </header>

      {colaboradora.presentacion && <p>{colaboradora.presentacion}</p>}

      <section className="pagina-colaboradora-seccion">
        <h2>Habilidades</h2>
        {colaboradora.habilidades.length === 0 ? (
          <p>Todavía no cargó habilidades.</p>
        ) : (
          <ListaDeHabilidades habilidades={colaboradora.habilidades} />
        )}
      </section>

      <section className="pagina-colaboradora-seccion">
        <h2>Cuentas de código</h2>
        {colaboradora.cuentas.length === 0 ? (
          <p>Todavía no cargó cuentas de código.</p>
        ) : (
          <ul className="pagina-colaboradora-cuentas">
            {colaboradora.cuentas.map((cuenta) => (
              <li key={`${cuenta.tipo}-${cuenta.usuario}`}>
                <span className="pagina-colaboradora-cuenta-tipo">
                  {TIPOS_DE_CUENTA[cuenta.tipo]}
                </span>{" "}
                {cuenta.usuario}
              </li>
            ))}
          </ul>
        )}
      </section>

      <DatosDeContacto personaId={id} />
    </article>
  )
}

export default PaginaColaboradora
