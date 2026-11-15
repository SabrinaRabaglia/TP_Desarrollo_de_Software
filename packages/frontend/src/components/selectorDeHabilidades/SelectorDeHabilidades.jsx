import { Checkbox, FormControlLabel } from "@mui/material"
import "./SelectorDeHabilidades.css"

const SelectorDeHabilidades = ({
  titulo,
  habilidades,
  elegidas,
  alCambiar,
}) => {
  const alternar = (id) => {
    alCambiar(
      elegidas.includes(id)
        ? elegidas.filter((elegida) => elegida !== id)
        : [...elegidas, id],
    )
  }

  return (
    <fieldset>
      <legend>{titulo}</legend>
      <div className="selector-de-habilidades">
        {habilidades.map((habilidad) => (
          <FormControlLabel
            key={habilidad.id}
            label={habilidad.titulo}
            control={
              <Checkbox
                checked={elegidas.includes(habilidad.id)}
                onChange={() => alternar(habilidad.id)}
              />
            }
          />
        ))}
      </div>
    </fieldset>
  )
}

export default SelectorDeHabilidades
