import { fuenteTexto, fuenteTitulos } from "./tokens"

// Títulos en Fraunces y el resto en Geist. body1 queda en 1rem.
export const typography = {
  fontFamily: fuenteTexto,
  htmlFontSize: 16,
  fontSize: 16 * 0.875, // MUI calcula rem a partir de 14; esto deja body1 = 1rem
  h1: {
    fontFamily: fuenteTitulos,
    fontWeight: 600,
    fontSize: "clamp(1.75rem, 1.3rem + 1.8vw, 2.5rem)",
    lineHeight: 1.15,
    letterSpacing: "-0.01em",
  },
  h2: {
    fontFamily: fuenteTitulos,
    fontWeight: 600,
    fontSize: "clamp(1.375rem, 1.15rem + 0.9vw, 1.75rem)",
    lineHeight: 1.2,
  },
  h3: {
    fontFamily: fuenteTitulos,
    fontWeight: 600,
    fontSize: "1.25rem",
    lineHeight: 1.25,
  },
  h4: {
    fontFamily: fuenteTexto,
    fontWeight: 600,
    fontSize: "1.0625rem",
    lineHeight: 1.3,
  },
  h5: {
    fontFamily: fuenteTexto,
    fontWeight: 600,
    fontSize: "1rem",
    lineHeight: 1.4,
  },
  h6: {
    fontFamily: fuenteTexto,
    fontWeight: 600,
    fontSize: "0.9375rem",
    lineHeight: 1.4,
  },
  subtitle1: { fontSize: "1rem", fontWeight: 600, lineHeight: 1.5 },
  subtitle2: { fontSize: "0.875rem", fontWeight: 600, lineHeight: 1.5 },
  body1: { fontSize: "1rem", lineHeight: 1.5 },
  body2: { fontSize: "0.875rem", lineHeight: 1.5 },
  caption: { fontSize: "0.78rem", lineHeight: 1.4 },
  overline: {
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.08em",
    lineHeight: 1.5,
  },
  button: {
    fontSize: "0.9375rem",
    fontWeight: 600,
    textTransform: "none",
    lineHeight: 1.2,
  },
}
