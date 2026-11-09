import { Route, Routes } from "react-router-dom"
import { ThemeProvider } from "@mui/material"
import theme from "./theme"
import Layout from "./features/layout/Layout"
import Inicio from "./features/inicio/Inicio"
import PaginaProyecto from "./features/proyectos/PaginaProyecto"
import NoEncontrado from "./features/noEncontrado/NoEncontrado"

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Inicio />} />
          <Route path="/proyectos/:id" element={<PaginaProyecto />} />
          <Route path="*" element={<NoEncontrado />} />
        </Route>
      </Routes>
    </ThemeProvider>
  )
}

export default App
