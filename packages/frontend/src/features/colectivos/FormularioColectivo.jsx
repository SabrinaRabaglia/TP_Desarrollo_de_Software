import { useEffect, useRef, useState } from "react"
import { Alert, Button, MenuItem, TextField } from "@mui/material"
import "./FormularioColectivo.css"

const LARGO_MAXIMO_DESCRIPCION = 500

const COLECTIVO_VACIO = {
  nombre: "",
  descripcion: "",
  tipo: "",
  pais: "",
  provincia: "",
  ciudad: "",
}

const FormularioColectivo = ({
  datosIniciales = COLECTIVO_VACIO,
  catalogos,
  textoBoton,
  enviando,
  error,
  exito,
  alGuardar,
  children,
}) => {
  const [datos, setDatos] = useState(datosIniciales)
  const aviso = useRef(null)

  useEffect(() => {
    if (error || exito) {
      aviso.current.focus()
    }
  }, [error, exito])

  const setValorDe = (campo) => (e) => {
    setDatos({ ...datos, [campo]: e.target.value })
  }

  // Una provincia es de un país: al cambiarlo, la que estaba elegida deja de
  // valer.
  const elegirPais = (e) => {
    setDatos({ ...datos, pais: e.target.value, provincia: "" })
  }

  const guardar = (evento) => {
    evento.preventDefault()
    alGuardar(datos)
  }

  return (
    <form onSubmit={guardar} className="formulario-colectivo">
      {children}

      <fieldset className="formulario-colectivo-seccion">
        <legend>Sobre el colectivo</legend>
        <TextField
          label="Nombre del colectivo"
          value={datos.nombre}
          onChange={setValorDe("nombre")}
          autoComplete="organization"
          helperText="Es el nombre público con el que la van a ver"
          required
          fullWidth
        />
        <TextField
          select
          label="Tipo de colectivo"
          value={datos.tipo}
          onChange={setValorDe("tipo")}
          required
          fullWidth
        >
          {catalogos.tipos.map((tipo) => (
            <MenuItem key={tipo.id} value={tipo.nombre}>
              {tipo.nombre}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Descripción"
          value={datos.descripcion}
          onChange={setValorDe("descripcion")}
          helperText={`Contá a qué se dedica. ${datos.descripcion.length} de ${LARGO_MAXIMO_DESCRIPCION} caracteres`}
          slotProps={{
            htmlInput: { minLength: 2, maxLength: LARGO_MAXIMO_DESCRIPCION },
          }}
          multiline
          minRows={3}
          required
          fullWidth
        />
      </fieldset>

      <fieldset
        className="formulario-colectivo-seccion"
        aria-describedby="formulario-colectivo-ayuda-ubicacion"
      >
        <legend>Ubicación</legend>
        <p
          id="formulario-colectivo-ayuda-ubicacion"
          className="formulario-colectivo-ayuda"
        >
          Es opcional. Completá lo que quieras mostrar.
        </p>
        <div className="formulario-colectivo-region">
          <TextField
            select
            label="País"
            value={datos.pais}
            onChange={elegirPais}
            fullWidth
          >
            <MenuItem value="">Sin especificar</MenuItem>
            {catalogos.paises.map((pais) => (
              <MenuItem key={pais.id} value={pais.id}>
                {pais.nombre}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Provincia"
            value={datos.provincia}
            onChange={setValorDe("provincia")}
            disabled={!datos.pais}
            helperText={datos.pais ? undefined : "Elegí primero un país"}
            fullWidth
          >
            <MenuItem value="">Sin especificar</MenuItem>
            {catalogos.provincias.map((provincia) => (
              <MenuItem key={provincia.id} value={provincia.id}>
                {provincia.nombre}
              </MenuItem>
            ))}
          </TextField>
        </div>
        <TextField
          label="Ciudad o localidad"
          value={datos.ciudad}
          onChange={setValorDe("ciudad")}
          autoComplete="address-level2"
          fullWidth
        />
      </fieldset>

      {(error || exito) && (
        <Alert ref={aviso} tabIndex={-1} severity={error ? "error" : "success"}>
          {error ?? exito}
        </Alert>
      )}

      <Button
        type="submit"
        variant="contained"
        disabled={enviando}
        className="formulario-colectivo-enviar"
      >
        {enviando ? "Guardando..." : textoBoton}
      </Button>
    </form>
  )
}

export default FormularioColectivo
