import { v, RADIO_PILL } from "../tokens"

// Barra, menú, pestañas, migas, enlaces y paginación
const componentes = {
  MuiAppBar: {
    defaultProps: { elevation: 0, color: "inherit", position: "sticky" },
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: v(theme).palette.background.paper,
        borderBottom: `1px solid ${v(theme).palette.divider}`,
      }),
    },
  },

  MuiToolbar: {
    styleOverrides: { root: { minHeight: 64, gap: 12 } },
  },

  MuiDrawer: {
    styleOverrides: {
      paper: ({ theme }) => ({
        backgroundColor: v(theme).palette.background.default,
        width: "min(320px, 85vw)",
      }),
    },
  },

  MuiTabs: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderBottom: `1px solid ${v(theme).palette.divider}`,
      }),
      indicator: { height: 3, borderRadius: 3 },
    },
  },

  MuiTab: {
    styleOverrides: {
      root: {
        textTransform: "none",
        fontWeight: 600,
        fontSize: "0.9375rem",
        minHeight: 48,
      },
    },
  },

  MuiBreadcrumbs: {
    styleOverrides: {
      root: ({ theme }) => ({
        fontSize: "0.875rem",
        color: v(theme).palette.text.secondary,
      }),
    },
  },

  MuiLink: {
    defaultProps: { underline: "always" },
    styleOverrides: {
      root: ({ theme }) => ({
        color: v(theme).palette.enlace.main,
        textUnderlineOffset: 3,
        textDecorationColor: "currentColor",
      }),
    },
  },

  MuiPaginationItem: {
    styleOverrides: {
      root: { borderRadius: RADIO_PILL, minWidth: 40, height: 40 },
    },
  },

  MuiStepIcon: {
    styleOverrides: { text: { fontWeight: 600 } },
  },
}

export default componentes
