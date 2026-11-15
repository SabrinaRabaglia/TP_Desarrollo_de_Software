import { v, RADIO, RADIO_PILL } from "../tokens"

// Chips, skeletons, progreso, avatar y badge
const componentes = {
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
}

export default componentes
