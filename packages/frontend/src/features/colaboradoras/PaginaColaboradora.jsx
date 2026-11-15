import { useEffect, useState } from "react"
import { Link as RouterLink, useParams } from "react-router-dom"
import { Avatar, Button } from "@mui/material"
import { LuGithub, LuGitlab, LuPencil } from "react-icons/lu"
import Cargando from "../../components/cargando/Cargando"
import ListaDeHabilidades from "../../components/listaDeHabilidades/ListaDeHabilidades"
import MensajeDeError from "../../components/mensajeDeError/MensajeDeError"
import { useAuth } from "../../context/AuthContext"
import { mensajeDeError } from "../../service/api"
import {
  obtenerColaboradora,
  TIPOS_DE_CUENTA,
} from "../../service/colaboradorasService"
import DatosDeContacto from "./DatosDeContacto"
import "./PaginaColaboradora.css"

// A qué perfil público lleva cada cuenta de código.
const CUENTAS = {
  GITHUB: { Icono: LuGithub, url: "https://github.com/" },
  GITLAB: { Icono: LuGitlab, url: "https://gitlab.com/" },
}

const iniciales = (nombre) =>
  nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0].toUpperCase())
    .join("")

const Cuenta = ({ cuenta }) => {
  const { Icono, url } = CUENTAS[cuenta.tipo] ?? {}
  const tipo = TIPOS_DE_CUENTA[cuenta.tipo] ?? cuenta.tipo

  return (
    <li className="pagina-colaboradora-cuenta">
      {Icono && <Icono aria-hidden="true" />}
      <span className="pagina-colaboradora-cuenta-tipo">{tipo}</span>
      {url ? (
        <a
          href={`${url}${encodeURIComponent(cuenta.usuario)}`}
          target="_blank"
          rel="noreferrer"
        >
          {cuenta.usuario}
        </a>
      ) : (
        cuenta.usuario
      )}
    </li>
  )
}

const PaginaColaboradora = () => {
  const { id } = useParams()
  const { usuario } = useAuth()
  const esSuPerfil =
    usuario?.rol === "PERSONA_COLABORADORA" && usuario.entidad?.id === id

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
        <Avatar className="pagina-colaboradora-avatar" aria-hidden="true">
          {iniciales(colaboradora.nombreFantasia)}
        </Avatar>
        <div className="pagina-colaboradora-identidad">
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
        </div>
        {esSuPerfil && (
          <Button
            variant="outlined"
            size="small"
            component={RouterLink}
            to="/mi-perfil"
            startIcon={<LuPencil aria-hidden="true" />}
            className="pagina-colaboradora-editar"
          >
            Editar mi perfil
          </Button>
        )}
      </header>

      <div className="pagina-colaboradora-cuerpo">
        <div className="pagina-colaboradora-principal">
          {colaboradora.presentacion && (
            <p className="texto-lectura">{colaboradora.presentacion}</p>
          )}

          <section
            className="pagina-colaboradora-seccion"
            aria-labelledby="titulo-habilidades"
          >
            <h2 id="titulo-habilidades">Habilidades</h2>
            {colaboradora.habilidades.length === 0 ? (
              <p>Todavía no cargó habilidades.</p>
            ) : (
              <ListaDeHabilidades habilidades={colaboradora.habilidades} />
            )}
          </section>

          <section
            className="pagina-colaboradora-seccion"
            aria-labelledby="titulo-cuentas"
          >
            <h2 id="titulo-cuentas">Cuentas de código</h2>
            {colaboradora.cuentas.length === 0 ? (
              <p>Todavía no cargó cuentas de código.</p>
            ) : (
              <ul className="pagina-colaboradora-cuentas">
                {colaboradora.cuentas.map((cuenta) => (
                  <Cuenta
                    key={`${cuenta.tipo}-${cuenta.usuario}`}
                    cuenta={cuenta}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>

        <DatosDeContacto personaId={id} />
      </div>
    </article>
  )
}

export default PaginaColaboradora
