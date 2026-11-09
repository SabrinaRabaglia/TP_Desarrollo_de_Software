import { createTheme } from "@mui/material"

const theme = createTheme({
  cssVariables: true,
  palette: {
    primary: { main: "#1f6f5c" },
    secondary: { main: "#d9692b" },
    background: { default: "#f7f5f0", paper: "#ffffff" },
    text: { primary: "#1f2328", secondary: "#57606a" },
  },
  typography: {
    fontFamily:
      "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    button: { textTransform: "none" },
  },
  shape: { borderRadius: 8 },
})

export default theme
