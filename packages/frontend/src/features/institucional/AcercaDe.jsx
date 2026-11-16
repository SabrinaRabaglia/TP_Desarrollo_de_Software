import { Link } from "react-router-dom"
import { Button, Chip } from "@mui/material"
import { LuFolderOpen, LuUserPlus } from "react-icons/lu"
import { useAuth } from "../../context/AuthContext"
import { GRUPO, INTEGRANTES } from "./integrantes"
import "./Institucional.css"

const AcercaDe = () => {
  const { usuario } = useAuth()

  return (
    <article className="institucional">
      <header className="institucional-encabezado">
        <h1>Acerca de Código a Voluntad</h1>
        <p className="institucional-bajada">
          Un repositorio de proyectos de software para colectivos sociales,
          abierto a quienes quieran sumar su tiempo y sus habilidades.
        </p>
      </header>

      <section aria-labelledby="acerca-objetivo">
        <h2 id="acerca-objetivo">Para qué existe</h2>
        <p>
          Muchas organizaciones sociales necesitan software (una página, un
          sistema de turnos, un mapa) y no tienen cómo pagarlo. Del otro lado
          hay personas que programan, diseñan o prueban y quieren aportar a una
          causa. Código a Voluntad reúne en un solo lugar los proyectos de esos
          colectivos, para que cualquiera pueda encontrarlos y sumarse.
        </p>
      </section>

      <section aria-labelledby="acerca-colectivos">
        <h2 id="acerca-colectivos">Si sos un colectivo</h2>
        <ul>
          <li>Publicás tus proyectos y los perfiles que te faltan cubrir.</li>
          <li>
            Buscás personas con las habilidades que pide cada perfil y les
            escribís desde el sitio.
          </li>
          <li>Revisás quiénes se postularon y elegís con quién avanzar.</li>
        </ul>
      </section>

      <section aria-labelledby="acerca-personas">
        <h2 id="acerca-personas">Si querés colaborar</h2>
        <ul>
          <li>
            Buscás proyectos según tus habilidades y la modalidad de
            colaboración que te queda cómoda.
          </li>
          <li>
            Te postulás a los perfiles que te interesan, con tu nombre o de
            forma anónima.
          </li>
          <li>
            Recibís los mensajes de los colectivos y elegís por dónde te
            avisamos.
          </li>
        </ul>
      </section>

      <section aria-labelledby="acerca-equipo">
        <h2 id="acerca-equipo">Quiénes lo hicimos</h2>
        <p>
          Somos el {GRUPO} de Desarrollo de Software (UTN FRBA, 2026). El sitio
          es un trabajo práctico con fines educativos: mirá los{" "}
          <Link to="/terminos">Términos y Condiciones</Link>.
        </p>
        <ul className="institucional-integrantes" aria-label="Integrantes">
          {INTEGRANTES.map((integrante) => (
            <li key={integrante}>
              <Chip label={integrante} variant="outlined" />
            </li>
          ))}
        </ul>
      </section>

      <div className="institucional-acciones">
        <Button
          variant="contained"
          component={Link}
          to="/"
          startIcon={<LuFolderOpen aria-hidden="true" />}
        >
          Ver proyectos
        </Button>
        {!usuario && (
          <Button
            variant="outlined"
            color="inherit"
            component={Link}
            to="/colaboradoras/nueva"
            startIcon={<LuUserPlus aria-hidden="true" />}
          >
            Quiero colaborar
          </Button>
        )}
      </div>
    </article>
  )
}

export default AcercaDe
