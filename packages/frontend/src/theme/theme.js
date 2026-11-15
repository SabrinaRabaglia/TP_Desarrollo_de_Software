import { createTheme } from "@mui/material/styles"
import avisos from "./componentes/avisos"
import base from "./componentes/base"
import datos from "./componentes/datos"
import formularios from "./componentes/formularios"
import navegacion from "./componentes/navegacion"
import { colorSchemes } from "./paleta"
import { typography } from "./tipografia"
import { RADIO, sombras } from "./tokens"

// Estilo B · "Colectivo". Este archivo solo arma el tema:
// - tokens.js: colores, fuentes, radios y sombras
// - paleta.js y tipografia.js: cómo MUI usa esos tokens
// - componentes/: cómo se ve cada componente de MUI, agrupados por tipo

const theme = createTheme({
  cssVariables: true, // genera --mui-palette-*, --mui-shape-*, --mui-shadows-*
  colorSchemes,

  breakpoints: {
    // md y lg coinciden con los cortes del CSS (768 y 1024)
    values: { xs: 0, sm: 480, md: 768, lg: 1024, xl: 1280 },
  },

  spacing: 8, // theme.spacing(1) = 8px · usar 0.5 para 4px

  shape: { borderRadius: RADIO },

  shadows: sombras,

  typography,

  components: {
    ...base,
    ...formularios,
    ...navegacion,
    ...datos,
    ...avisos,
  },
})

export default theme
