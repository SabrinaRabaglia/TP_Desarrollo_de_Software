import { Link } from "react-router-dom"

const NoEncontrado = () => {
  return (
    <section>
      <h1>Página no encontrada</h1>
      <p>
        La dirección que abriste no existe. <Link to="/">Volver al inicio</Link>
      </p>
    </section>
  )
}

export default NoEncontrado
