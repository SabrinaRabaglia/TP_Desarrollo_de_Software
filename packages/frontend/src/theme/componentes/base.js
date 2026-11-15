import { v, RADIO_GRANDE, RADIO_PILL } from "../tokens"

// Base, botones y superficies (tarjetas, papel)
const componentes = {
  MuiCssBaseline: {
    styleOverrides: (theme) => ({
      body: { backgroundColor: v(theme).palette.background.default },
      "::selection": { backgroundColor: v(theme).palette.primarioFondo.main },
      "@media (prefers-reduced-motion: reduce)": {
        "*, *::before, *::after": {
          animationDuration: "0.01ms !important",
          transitionDuration: "0.01ms !important",
        },
      },
    }),
  },

  MuiButtonBase: {
    styleOverrides: {
      root: ({ theme }) => ({
        "&.Mui-focusVisible": {
          outline: `2px solid ${v(theme).palette.enlace.main}`,
          outlineOffset: 2,
        },
      }),
    },
  },

  MuiButton: {
    defaultProps: { disableElevation: true },
    styleOverrides: {
      root: {
        borderRadius: RADIO_PILL,
        minHeight: 44,
        paddingInline: 20,
        gap: 8,
      },
      sizeSmall: { minHeight: 36, paddingInline: 14, fontSize: "0.875rem" },
      sizeLarge: { minHeight: 52, paddingInline: 28, fontSize: "1rem" },
      outlined: ({ theme, ownerState }) =>
        ownerState.color === "inherit" || ownerState.color === undefined
          ? {}
          : { borderColor: v(theme).palette[ownerState.color]?.main },
      text: { paddingInline: 14 },
    },
    variants: [
      {
        // Botón neutro del mockup: <Button variant="outlined" color="inherit">
        props: { variant: "outlined", color: "inherit" },
        style: ({ theme }) => ({
          borderColor: v(theme).palette.bordeControl.main,
          backgroundColor: v(theme).palette.background.paper,
          "&:hover": { backgroundColor: v(theme).palette.superficie.alt },
        }),
      },
    ],
  },

  MuiIconButton: {
    styleOverrides: { root: { padding: 10 } }, // 44×44 de área táctil
  },

  MuiPaper: {
    defaultProps: { elevation: 0 },
    styleOverrides: {
      rounded: { borderRadius: RADIO_GRANDE },
      outlined: ({ theme }) => ({ borderColor: v(theme).palette.divider }),
    },
  },

  MuiCard: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: RADIO_GRANDE,
        border: `1px solid ${v(theme).palette.divider}`,
        boxShadow: v(theme).shadows[2],
      }),
    },
  },

  MuiCardContent: {
    styleOverrides: {
      root: ({ theme }) => ({
        padding: 20,
        "&:last-child": { paddingBottom: 20 },
        [theme.breakpoints.up("md")]: {
          padding: 32,
          "&:last-child": { paddingBottom: 32 },
        },
      }),
    },
  },
}

export default componentes
