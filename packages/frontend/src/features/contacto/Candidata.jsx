import { Button } from "@mui/material"
import { Link } from "react-router-dom"
import ListaDeHabilidades from "../../components/listaDeHabilidades/ListaDeHabilidades"
import "./Candidata.css"

const Candidata = ({ candidata, alContactar }) => {
  const idDeLaAclaracion = `candidata-${candidata.id}-sin-mensajeria`

  return (
    <article className="candidata">
      <header className="candidata-encabezado">
        <h2>{candidata.nombreFantasia}</h2>
        {candidata.nombreCompleto && (
          <p className="candidata-nombre">{candidata.nombreCompleto}</p>
        )}
      </header>

      {candidata.habilidades.length > 0 && (
        <ListaDeHabilidades habilidades={candidata.habilidades} />
      )}

      <div className="candidata-acciones">
        <Link to={`/colaboradoras/${candidata.id}`}>Ver perfil</Link>
        <Button
          variant="contained"
          size="small"
          disabled={!candidata.aceptaMensajeriaInterna}
          aria-describedby={
            candidata.aceptaMensajeriaInterna ? undefined : idDeLaAclaracion
          }
          onClick={() => alContactar?.(candidata)}
        >
          Contactar
        </Button>
      </div>
      {!candidata.aceptaMensajeriaInterna && (
        <p id={idDeLaAclaracion} className="candidata-aclaracion">
          No acepta mensajes internos.
        </p>
      )}
    </article>
  )
}

export default Candidata
