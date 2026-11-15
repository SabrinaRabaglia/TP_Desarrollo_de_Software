import { Button, Checkbox, FormControlLabel } from "@mui/material"
import { Link } from "react-router-dom"
import Coincidencia from "../../components/coincidencia/Coincidencia"
import ListaDeHabilidades from "../../components/listaDeHabilidades/ListaDeHabilidades"
import "./Candidata.css"

const opcionalesCubiertas = (cantidad) =>
  cantidad === 1
    ? "Tiene 1 habilidad opcional"
    : `Tiene ${cantidad} habilidades opcionales`

const Candidata = ({ candidata, seleccionada, alSeleccionar, alContactar }) => (
  <article className="candidata">
    <header className="candidata-encabezado">
      <div className="candidata-titulo">
        <h2>{candidata.nombreFantasia}</h2>
        <Coincidencia nivel={candidata.coincidencia} />
      </div>
      {candidata.presentacion && (
        <p className="candidata-presentacion">{candidata.presentacion}</p>
      )}
    </header>

    <div className="candidata-coincidencias">
      <h3>Habilidades que coinciden</h3>
      <ListaDeHabilidades habilidades={candidata.habilidadesCoincidentes} />
      {candidata.opcionalesCubiertas > 0 && (
        <p className="candidata-aclaracion">
          {opcionalesCubiertas(candidata.opcionalesCubiertas)}
        </p>
      )}
    </div>

    {!candidata.aceptaMensajeriaInterna && (
      <p className="candidata-aclaracion">No acepta mensajes internos.</p>
    )}

    <div className="candidata-acciones">
      <FormControlLabel
        control={
          <Checkbox
            checked={seleccionada}
            onChange={(e) => alSeleccionar(candidata, e.target.checked)}
          />
        }
        label={`Seleccionar a ${candidata.nombreFantasia}`}
      />
      <Link to={`/colaboradoras/${candidata.id}`}>Ver perfil</Link>
      <Button
        variant="outlined"
        size="small"
        onClick={() => alContactar(candidata)}
      >
        Enviar mensaje
      </Button>
    </div>
  </article>
)

export default Candidata
