import { v, RADIO, RADIO_GRANDE } from "../tokens"

// Alertas, avisos, diálogos y tooltips
const componentes = {
  MuiAlert: {
    styleOverrides: { root: { borderRadius: RADIO, alignItems: "center" } },
    variants: [
      ["Success", "success", "exitoFondo"],
      ["Warning", "warning", "advertenciaFondo"],
      ["Error", "error", "errorFondo"],
      ["Info", "info", "infoFondo"],
    ].map(([, severity, fondo]) => ({
      props: { variant: "standard", severity },
      style: ({ theme }) => ({
        backgroundColor: v(theme).palette.estado[fondo],
        color: v(theme).palette.text.primary,
        "& .MuiAlert-icon": { color: v(theme).palette[severity].main },
      }),
    })),
  },

  MuiSnackbarContent: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: RADIO,
        backgroundColor: v(theme).palette.text.primary,
        boxShadow: v(theme).shadows[8],
      }),
    },
  },

  MuiDialog: {
    styleOverrides: {
      paper: ({ theme }) => ({
        borderRadius: RADIO_GRANDE,
        boxShadow: v(theme).shadows[24],
      }),
      paperFullScreen: { borderRadius: 0 },
    },
  },

  MuiTooltip: {
    defaultProps: { arrow: true },
    styleOverrides: {
      tooltip: ({ theme }) => ({
        backgroundColor: v(theme).palette.text.primary,
        fontSize: "0.8125rem",
        borderRadius: 8,
        padding: "6px 10px",
      }),
      arrow: ({ theme }) => ({ color: v(theme).palette.text.primary }),
    },
  },
}

export default componentes
