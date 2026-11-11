import "./ListaDeHabilidades.css"

const ListaDeHabilidades = ({ habilidades }) => {
  return (
    <ul className="lista-de-habilidades">
      {habilidades.map((habilidad) => (
        <li key={habilidad} className="lista-de-habilidades-item">
          {habilidad}
        </li>
      ))}
    </ul>
  )
}

export default ListaDeHabilidades
