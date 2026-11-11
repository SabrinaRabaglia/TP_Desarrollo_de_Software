import { useRef } from "react"
import { Button, IconButton, MenuItem, TextField } from "@mui/material"
import { FaPlus, FaTrashAlt } from "react-icons/fa"
import "./FilasTipoValor.css"

const FilasTipoValor = ({
  titulo,
  ayuda,
  tipos,
  filas,
  alCambiar,
  etiquetaValor,
  nombreFila,
}) => {
  const botonAgregar = useRef(null)

  const cambiarFila = (indice, campo) => (e) => {
    alCambiar(
      filas.map((fila, i) =>
        i === indice ? { ...fila, [campo]: e.target.value } : fila,
      ),
    )
  }

  const quitarFila = (indice) => {
    alCambiar(filas.filter((_fila, i) => i !== indice))
    botonAgregar.current.focus()
  }

  const agregarFila = () => {
    alCambiar([...filas, { tipo: Object.keys(tipos)[0], valor: "" }])
  }

  return (
    <fieldset className="filas-tipo-valor">
      <legend>{titulo}</legend>
      {ayuda && <p className="filas-tipo-valor-ayuda">{ayuda}</p>}

      {filas.map((fila, indice) => (
        <div key={indice} className="filas-tipo-valor-fila">
          <TextField
            select
            label="Tipo"
            value={fila.tipo}
            onChange={cambiarFila(indice, "tipo")}
            className="filas-tipo-valor-tipo"
          >
            {Object.entries(tipos).map(([valor, etiqueta]) => (
              <MenuItem key={valor} value={valor}>
                {etiqueta}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label={etiquetaValor}
            value={fila.valor}
            onChange={cambiarFila(indice, "valor")}
            required
            className="filas-tipo-valor-valor"
          />
          <IconButton
            aria-label={`Quitar ${nombreFila} ${indice + 1}`}
            onClick={() => quitarFila(indice)}
            className="filas-tipo-valor-quitar"
          >
            <FaTrashAlt aria-hidden="true" />
          </IconButton>
        </div>
      ))}

      <Button
        ref={botonAgregar}
        variant="outlined"
        startIcon={<FaPlus aria-hidden="true" />}
        onClick={agregarFila}
        className="filas-tipo-valor-agregar"
      >
        Agregar {nombreFila}
      </Button>
    </fieldset>
  )
}

export default FilasTipoValor
