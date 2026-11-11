import { useEffect, useRef, useState } from "react"
import {
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
} from "@mui/material"
import FilasTipoValor from "../../components/filasTipoValor/FilasTipoValor"
import {
  TIPOS_DE_CUENTA,
  TIPOS_DE_MEDIO,
} from "../../service/colaboradorasService"
import "./FormularioColaboradora.css"

const PERSONA_VACIA = {
  nombreFantasia: "",
  nombre: "",
  apellido: "",
  pronombres: "",
  presentacion: "",
  habilidades: [],
  cuentas: [],
  mediosDeContacto: [],
  aceptaMensajeriaInterna: false,
}

const FormularioColaboradora = ({
  datosIniciales = PERSONA_VACIA,
  habilidades,
  textoBoton,
  enviando,
  error,
  alGuardar,
  children,
}) => {
  const [datos, setDatos] = useState(datosIniciales)
  const alerta = useRef(null)

  useEffect(() => {
    if (error) {
      alerta.current.focus()
    }
  }, [error])

  const setValorDe = (campo) => (e) => {
    setDatos({ ...datos, [campo]: e.target.value })
  }

  const setFilasDe = (campo) => (filas) => {
    setDatos({ ...datos, [campo]: filas })
  }

  const alternarHabilidad = (id) => {
    const habilidadesElegidas = datos.habilidades.includes(id)
      ? datos.habilidades.filter((elegida) => elegida !== id)
      : [...datos.habilidades, id]
    setDatos({ ...datos, habilidades: habilidadesElegidas })
  }

  const guardar = (evento) => {
    evento.preventDefault()
    alGuardar(datos)
  }

  return (
    <form onSubmit={guardar} className="formulario-colaboradora">
      {children}

      <fieldset className="formulario-colaboradora-seccion">
        <legend>Sobre vos</legend>
        <TextField
          label="Nombre de fantasía"
          value={datos.nombreFantasia}
          onChange={setValorDe("nombreFantasia")}
          helperText="Es el nombre público con el que te van a ver"
          required
          fullWidth
        />
        <div className="formulario-colaboradora-nombre">
          <TextField
            label="Nombre"
            value={datos.nombre}
            onChange={setValorDe("nombre")}
            autoComplete="given-name"
            fullWidth
          />
          <TextField
            label="Apellido"
            value={datos.apellido}
            onChange={setValorDe("apellido")}
            autoComplete="family-name"
            fullWidth
          />
        </div>
        <TextField
          label="Pronombres"
          value={datos.pronombres}
          onChange={setValorDe("pronombres")}
          helperText="Separalos con comas"
          fullWidth
        />
        <TextField
          label="Presentación"
          value={datos.presentacion}
          onChange={setValorDe("presentacion")}
          multiline
          minRows={3}
          fullWidth
        />
      </fieldset>

      <fieldset className="formulario-colaboradora-seccion">
        <legend>Habilidades</legend>
        <div className="formulario-colaboradora-habilidades">
          {habilidades.map((habilidad) => (
            <FormControlLabel
              key={habilidad.id}
              label={habilidad.titulo}
              control={
                <Checkbox
                  checked={datos.habilidades.includes(habilidad.id)}
                  onChange={() => alternarHabilidad(habilidad.id)}
                />
              }
            />
          ))}
        </div>
      </fieldset>

      <FilasTipoValor
        titulo="Cuentas de código"
        tipos={TIPOS_DE_CUENTA}
        filas={datos.cuentas}
        alCambiar={setFilasDe("cuentas")}
        etiquetaValor="Usuario"
        nombreFila="cuenta"
      />

      <FilasTipoValor
        titulo="Medios de contacto"
        ayuda="No se muestran públicamente. Solo los ve un colectivo con el que colabores."
        tipos={TIPOS_DE_MEDIO}
        filas={datos.mediosDeContacto}
        alCambiar={setFilasDe("mediosDeContacto")}
        etiquetaValor="Dato de contacto"
        nombreFila="medio de contacto"
      />

      <FormControlLabel
        label="Acepto que los colectivos me contacten por la mensajería interna"
        control={
          <Checkbox
            checked={datos.aceptaMensajeriaInterna}
            onChange={(e) =>
              setDatos({ ...datos, aceptaMensajeriaInterna: e.target.checked })
            }
          />
        }
      />

      {error && (
        <Alert ref={alerta} tabIndex={-1} severity="error">
          {error}
        </Alert>
      )}

      <Button
        type="submit"
        variant="contained"
        disabled={enviando}
        className="formulario-colaboradora-enviar"
      >
        {enviando ? "Guardando..." : textoBoton}
      </Button>
    </form>
  )
}

export default FormularioColaboradora
