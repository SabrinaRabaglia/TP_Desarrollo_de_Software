import ListaDeHabilidades from "../../components/listaDeHabilidades/ListaDeHabilidades"
import "./PerfilRequerido.css"

const GrupoDeHabilidades = ({ titulo, habilidades }) => {
  if (habilidades.length === 0) {
    return null
  }

  return (
    <div className="perfil-habilidades">
      <h4>{titulo}</h4>
      <ListaDeHabilidades habilidades={habilidades} />
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
      <GrupoDeHabilidades
        titulo="Habilidades requeridas"
        habilidades={perfil.habilidadesRequeridas}
      />
      <GrupoDeHabilidades
        titulo="Habilidades opcionales"
        habilidades={perfil.habilidadesOpcionales}
      />
    </article>
  )
}

export default PerfilRequerido
