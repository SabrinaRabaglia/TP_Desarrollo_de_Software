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

const fuenteTexto =
  '"Geist", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
const fuenteTitulos = '"Fraunces", Georgia, "Times New Roman", serif'

const RADIO = 14
const RADIO_GRANDE = 22
const RADIO_PILL = 999

const base = createTheme()
const sombras = [...base.shadows]
sombras[1] = "0 1px 2px rgba(31,26,23,.05)"
sombras[2] = "0 1px 2px rgba(31,26,23,.05), 0 8px 24px rgba(31,26,23,.06)" // tarjetas
sombras[8] = "0 12px 32px rgba(31,26,23,.14)" // menús, popovers, toasts
sombras[24] = "0 20px 50px rgba(31,26,23,.18)" // diálogos

const v = (theme) => theme.vars || theme

const theme = createTheme({
  cssVariables: true, // genera --mui-palette-*, --mui-shape-*, --mui-shadows-*
  colorSchemes: {
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
  },

  breakpoints: {
    // md y lg coinciden con los cortes del CSS (768 y 1024)
    values: { xs: 0, sm: 480, md: 768, lg: 1024, xl: 1280 },
  },

  spacing: 8, // theme.spacing(1) = 8px · usar 0.5 para 4px

  shape: { borderRadius: RADIO },

  shadows: sombras,

  typography: {
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
  },

  components: {
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

    MuiChip: {
      styleOverrides: {
        root: { borderRadius: RADIO_PILL, fontWeight: 500 },
        sizeSmall: { fontSize: "0.78rem", fontWeight: 600, height: 24 },
        outlined: ({ theme }) => ({
          borderColor: v(theme).palette.divider,
          backgroundColor: v(theme).palette.superficie.alt,
        }),
      },
      variants: [
        // Estados (postulaciones, hitos, proyectos): <Chip variant="suave" color="success" />
        ...[
          ["success", "exito", "exitoFondo"],
          ["warning", "advertencia", "advertenciaFondo"],
          ["error", "error", "errorFondo"],
          ["info", "info", "infoFondo"],
        ].map(([color, , fondo]) => ({
          props: { variant: "suave", color },
          style: ({ theme }) => ({
            backgroundColor: v(theme).palette.estado[fondo],
            color: v(theme).palette[color].main,
            border: "1px solid transparent",
          }),
        })),
        {
          props: { variant: "suave", color: "default" },
          style: ({ theme }) => ({
            backgroundColor: v(theme).palette.superficie.alt,
            color: v(theme).palette.text.primary,
            border: `1px solid ${v(theme).palette.divider}`,
          }),
        },
      ],
    },

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

    MuiSkeleton: {
      defaultProps: { animation: "wave" },
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: v(theme).palette.skeleton.main,
        }),
        rounded: { borderRadius: RADIO },
      },
    },

    MuiLinearProgress: {
      defaultProps: { color: "secondary", variant: "determinate" },
      styleOverrides: {
        root: ({ theme }) => ({
          height: 8,
          borderRadius: RADIO_PILL,
          backgroundColor: v(theme).palette.superficie.alt,
        }),
        bar: { borderRadius: RADIO_PILL },
      },
    },

    MuiAvatar: {
      styleOverrides: {
        root: ({ theme }) => ({
          width: 36,
          height: 36,
          fontSize: "0.8125rem",
          fontWeight: 600,
          backgroundColor: v(theme).palette.superficie.alt,
          color: v(theme).palette.text.primary,
          border: `1px solid ${v(theme).palette.divider}`,
        }),
      },
    },

    MuiBadge: {
      styleOverrides: { badge: { fontWeight: 600 } },
    },

    MuiPaginationItem: {
      styleOverrides: {
        root: { borderRadius: RADIO_PILL, minWidth: 40, height: 40 },
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

    MuiStepIcon: {
      styleOverrides: { text: { fontWeight: 600 } },
    },
  },
})

export default theme
