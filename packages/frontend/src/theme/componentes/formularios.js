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
      }),
      input: { minHeight: 24, paddingBlock: 10 },
    },
  },

  MuiFormHelperText: {
    styleOverrides: {
      root: { marginInline: 0, marginTop: 6, fontSize: "0.82rem" },
    },
  },

  MuiFormLabel: {
    styleOverrides: { root: { fontWeight: 600, fontSize: "0.9rem" } },
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
