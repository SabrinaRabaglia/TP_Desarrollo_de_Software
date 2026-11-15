import { tokens } from "./tokens"

// Paleta de MUI armada con los tokens.
export const colorSchemes = {
  light: {
    palette: {
      primary: {
        main: tokens.primario,
        dark: tokens.primarioOscuro,
        light: tokens.primarioClaro,
        contrastText: "#ffffff",
      },
      secondary: {
        main: tokens.secundario,
        dark: tokens.secundarioOscuro,
        light: tokens.secundarioClaro,
        contrastText: "#ffffff",
      },
      error: { main: tokens.error, contrastText: "#ffffff" },
      warning: { main: tokens.advertencia, contrastText: "#ffffff" },
      success: { main: tokens.exito, contrastText: "#ffffff" },
      info: { main: tokens.info, contrastText: "#ffffff" },
      background: { default: tokens.fondo, paper: tokens.superficie },
      text: {
        primary: tokens.texto,
        secondary: tokens.textoSecundario,
        disabled: tokens.textoDeshabilitado,
      },
      divider: tokens.borde,

      // Claves propias: MUI también las publica como CSS variables
      // (--mui-palette-superficie-alt, --mui-palette-estado-exitoFondo, …)
      superficie: { alt: tokens.superficieAlt },
      bordeControl: { main: tokens.bordeControl },
      enlace: { main: tokens.enlace },
      primarioFondo: { main: tokens.primarioFondo },
      estado: {
        errorFondo: tokens.errorFondo,
        advertenciaFondo: tokens.advertenciaFondo,
        exitoFondo: tokens.exitoFondo,
        infoFondo: tokens.infoFondo,
      },
      skeleton: { main: tokens.skeleton },
    },
  },
}
