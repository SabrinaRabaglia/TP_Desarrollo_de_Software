import { v, RADIO } from "../tokens"

// Campos de formulario
const componentes = {
  MuiTextField: { defaultProps: { fullWidth: true } },

  MuiOutlinedInput: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: RADIO,
        backgroundColor: v(theme).palette.background.paper,
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: v(theme).palette.bordeControl.main,
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: v(theme).palette.text.primary,
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: v(theme).palette.enlace.main,
          borderWidth: 1,
        },
        "&.Mui-focused": {
          boxShadow: `0 0 0 3px color-mix(in srgb, ${v(theme).palette.enlace.main} 25%, transparent)`,
        },
        "&.Mui-error .MuiOutlinedInput-notchedOutline": {
          borderColor: v(theme).palette.error.main,
        },
        "&.Mui-error.Mui-focused": {
          boxShadow: `0 0 0 3px ${v(theme).palette.estado.errorFondo}`,
        },
        "&.Mui-disabled": {
          backgroundColor: v(theme).palette.superficie.alt,
        },
        // La etiqueta achicada va arriba del borde y no sobre él (ver
        // MuiInputLabel), así que el borde no deja hueco: la línea sigue entera.
        "& .MuiOutlinedInput-notchedOutline legend": {
          maxWidth: 0.01,
        },
      }),
      input: { minHeight: 24, paddingBlock: 10 },
      // El relleno ya lo pone el texto: así la primera línea queda a la
      // altura de la etiqueta, como en los campos de una línea.
      multiline: { paddingBlock: 0 },
    },
  },

  // MUI le da al select una altura propia de 23px: se iguala a los campos de
  // texto para que una fila "tipo + valor" quede pareja.
  MuiSelect: {
    styleOverrides: { select: { minHeight: 24, lineHeight: "24px" } },
  },

  MuiFormHelperText: {
    styleOverrides: {
      root: { marginInline: 0, marginTop: 6, fontSize: "0.82rem" },
    },
  },

  MuiFormLabel: {
    styleOverrides: { root: { fontWeight: 600, fontSize: "0.9rem" } },
  },

  // MUI ubica la etiqueta para un campo de 56px con letra de 1rem; los
  // nuestros miden 44px (24 de texto + 10 arriba y abajo) y la etiqueta va en
  // 0.9rem. Centrada adentro del campo y, achicada, apoyada arriba del borde
  // para que la línea no la cruce.
  MuiInputLabel: {
    styleOverrides: {
      outlined: {
        transform: "translate(14px, 12px) scale(1)",
        "&.MuiInputLabel-shrink": {
          transform: "translate(14px, -17px) scale(0.75)",
        },
      },
    },
  },

  MuiAutocomplete: {
    styleOverrides: {
      paper: ({ theme }) => ({
        borderRadius: RADIO,
        border: `1px solid ${v(theme).palette.divider}`,
        boxShadow: v(theme).shadows[8],
      }),
    },
  },
}

export default componentes
