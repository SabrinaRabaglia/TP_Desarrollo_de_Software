import { Link } from "react-router-dom"
import { GRUPO, INTEGRANTES } from "./integrantes"
import "./Institucional.css"

const TerminosYCondiciones = () => {
  return (
    <article className="institucional">
      <header className="institucional-encabezado">
        <h1>Términos y Condiciones</h1>
        <p className="institucional-fecha">
          Última actualización: noviembre de 2026
        </p>
      </header>

      <section aria-labelledby="terminos-sitio">
        <h2 id="terminos-sitio">1. Qué es este sitio</h2>
        <p>
          Código a Voluntad es una página web desarrollada con fines educativos,
          como trabajo práctico de la materia Desarrollo de Software de la
          carrera Ingeniería en Sistemas de Información de la UTN FRBA (segundo
          cuatrimestre de 2026). No es un servicio comercial ni lo respalda
          ninguna organización.
        </p>
      </section>

      <section aria-labelledby="terminos-uso">
        <h2 id="terminos-uso">2. Uso permitido</h2>
        <p>
          Podés usar el sitio para conocerlo, probarlo y evaluarlo en el marco
          de la materia. No está permitido usarlo con fines comerciales: no
          podés vender, alquilar ni ofrecer el sitio, su código o sus contenidos
          como un servicio propio, ni usarlos para obtener un beneficio
          económico, sin la autorización por escrito de quienes lo
          desarrollamos.
        </p>
      </section>

      <section aria-labelledby="terminos-datos">
        <h2 id="terminos-datos">3. Los datos que cargás</h2>
        <ul>
          <li>
            Los proyectos, perfiles y cuentas que se ven son, en su mayoría,
            datos de prueba.
          </li>
          <li>
            No cargues información sensible ni datos personales reales que no
            quieras compartir: el sitio no está pensado para guardarlos.
          </li>
          <li>
            Un colectivo ve tus datos de contacto recién cuando acepta tu
            postulación. Si te postulás de forma anónima, tu nombre no aparece
            en el proyecto.
          </li>
          <li>
            La base de datos puede reiniciarse o borrarse en cualquier momento,
            sin aviso previo.
          </li>
        </ul>
      </section>

      <section aria-labelledby="terminos-acuerdos">
        <h2 id="terminos-acuerdos">4. Colectivos y personas colaboradoras</h2>
        <p>
          El sitio solo pone en contacto a los colectivos con las personas que
          quieren colaborar. Cualquier acuerdo que hagan entre ellos es
          responsabilidad de cada parte.
        </p>
      </section>

      <section aria-labelledby="terminos-garantias">
        <h2 id="terminos-garantias">5. Sin garantías</h2>
        <p>
          El sitio se ofrece tal como está. Puede tener errores, dejar de
          funcionar o cambiar sin aviso, y no nos hacemos responsables por la
          pérdida de datos ni por los daños que pueda causar su uso.
        </p>
      </section>

      <section aria-labelledby="terminos-autoria">
        <h2 id="terminos-autoria">6. Autoría</h2>
        <p>
          El sitio lo desarrolló el {GRUPO}, integrado por{" "}
          {INTEGRANTES.slice(0, -1).join(", ")} y {INTEGRANTES.at(-1)}. Para
          saber más, leé <Link to="/acerca-de">Acerca de</Link>.
        </p>
      </section>

      <section aria-labelledby="terminos-cambios">
        <h2 id="terminos-cambios">7. Cambios en estos términos</h2>
        <p>
          Podemos actualizar estos términos. Si seguís usando el sitio después
          de un cambio, entendemos que lo aceptás.
        </p>
      </section>
    </article>
  )
}

export default TerminosYCondiciones
