import { Route, Routes } from "react-router-dom"
import { ThemeProvider } from "@mui/material"
import theme from "./theme"
import { AuthProvider } from "./context/AuthContext"
import Layout from "./features/layout/Layout"
import Inicio from "./features/inicio/Inicio"
import Login from "./features/auth/Login"
import RutaPrivada from "./features/auth/RutaPrivada"
import MiCuenta from "./features/cuenta/MiCuenta"
import RegistroColaboradora from "./features/colaboradoras/RegistroColaboradora"
import PaginaColaboradora from "./features/colaboradoras/PaginaColaboradora"
import PaginaProyecto from "./features/proyectos/PaginaProyecto"
import NoEncontrado from "./features/noEncontrado/NoEncontrado"

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Inicio />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/colaboradoras/nueva"
              element={<RegistroColaboradora />}
            />
            <Route path="/colaboradoras/:id" element={<PaginaColaboradora />} />
            <Route path="/proyectos/:id" element={<PaginaProyecto />} />
            <Route element={<RutaPrivada />}>
              <Route path="/mi-cuenta" element={<MiCuenta />} />
            </Route>
            <Route path="*" element={<NoEncontrado />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
