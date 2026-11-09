import "./PerfilRequerido.css"

const ListaDeHabilidades = ({ titulo, habilidades }) => {
  if (habilidades.length === 0) {
    return null
  }

  return (
    <div className="perfil-habilidades">
      <h4>{titulo}</h4>
      <ul>
        {habilidades.map((habilidad) => (
          <li key={habilidad} className="perfil-habilidad">
            {habilidad}
          </li>
        ))}
      </ul>
    </div>
  )
}

const PerfilRequerido = ({ perfil }) => {
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
      <ListaDeHabilidades
        titulo="Habilidades requeridas"
        habilidades={perfil.habilidadesRequeridas}
      />
      <ListaDeHabilidades
        titulo="Habilidades opcionales"
        habilidades={perfil.habilidadesOpcionales}
      />
    </article>
  )
}

export default PerfilRequerido
