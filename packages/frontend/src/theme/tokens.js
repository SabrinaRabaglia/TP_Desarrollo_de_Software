import { createTheme } from "@mui/material/styles"

// Estilo B · "Colectivo" — fuente de verdad del diseño.
// Todo color, radio o sombra del proyecto sale de acá (vía CSS variables).

export const tokens = {
  fondo: "#faf7f2",
  superficie: "#ffffff",
  superficieAlt: "#f3ede4",
  borde: "#e6ddd0", // separadores y tarjetas (decorativo)
  bordeControl: "#8f857c", // inputs, botones outlined, checkboxes: contraste 3.6:1 (WCAG 1.4.11)
  texto: "#1f1a17",
  textoSecundario: "#5c534c",
  textoDeshabilitado: "#9c928a",

  primario: "#b4441f", // terracota
  primarioOscuro: "#9a3818",
  primarioClaro: "#d0603a",
  primarioFondo: "#f6e3da",

  secundario: "#2f6b4f", // verde huerta (antes "acento")
  secundarioOscuro: "#24543e",
  secundarioClaro: "#4f8a6c",

  enlace: "#2f4b7c",

  error: "#b42318",
  errorFondo: "#fdecea",
  advertencia: "#8a5a00",
  advertenciaFondo: "#fdf3dc",
  exito: "#2f6b4f",
  exitoFondo: "#e5f2eb",
  info: "#2f4b7c",
  infoFondo: "#e8edf6",

  skeleton: "#efe8dd",
}

export const fuenteTexto =
  '"Geist", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
export const fuenteTitulos = '"Fraunces", Georgia, "Times New Roman", serif'

export const RADIO = 14
export const RADIO_GRANDE = 22
export const RADIO_PILL = 999

const base = createTheme()
export const sombras = [...base.shadows]
sombras[1] = "0 1px 2px rgba(31,26,23,.05)"
sombras[2] = "0 1px 2px rgba(31,26,23,.05), 0 8px 24px rgba(31,26,23,.06)" // tarjetas
sombras[8] = "0 12px 32px rgba(31,26,23,.14)" // menús, popovers, toasts
sombras[24] = "0 20px 50px rgba(31,26,23,.18)" // diálogos

// Para los overrides: con cssVariables, theme.vars da las referencias
// var(--mui-...); si no está, se usan los valores directos del tema.
export const v = (theme) => theme.vars || theme
