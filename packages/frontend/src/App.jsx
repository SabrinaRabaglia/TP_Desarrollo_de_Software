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
import MiPerfil from "./features/colaboradoras/MiPerfil"
import PaginaProyecto from "./features/proyectos/PaginaProyecto"
import PaginaMensajes from "./features/mensajes/PaginaMensajes"
import PaginaCandidatas from "./features/contacto/PaginaCandidatas"
import NoEncontrado from "./features/noEncontrado/NoEncontrado"
import PaginaPostulaciones from "./features/postulaciones/PaginaPostulaciones.jsx"
import PostulacionesPerfil from "./features/postulaciones/PostulacionesPerfil.jsx"
import ColaboradoresPerfil from "./features/colaboradoras/ColaboradoresPerfil.jsx"

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
            <Route element={<RutaPrivada rol="PERSONA_COLABORADORA" />}>
              <Route path="/postulaciones" element={<PaginaPostulaciones />} />
            </Route>
            <Route element={<RutaPrivada rol="COLECTIVO" />}>
              <Route
                path="/proyectos/:proyectoId/perfiles/:perfilId/postulaciones"
                element={<PostulacionesPerfil />}
              />
            </Route>
            <Route element={<RutaPrivada />}>
              <Route path="/mi-cuenta" element={<MiCuenta />} />
              <Route path="/mensajes" element={<PaginaMensajes />} />
            </Route>
            <Route element={<RutaPrivada rol="PERSONA_COLABORADORA" />}>
              <Route path="/mi-perfil" element={<MiPerfil />} />
            </Route>
            <Route element={<RutaPrivada rol="COLECTIVO" />}>
              <Route
                path="/proyectos/:id/perfiles/:perfilId/candidatas"
                element={<PaginaCandidatas />}
              />
            </Route>
            <Route
              path="/proyectos/:proyectoId/perfiles/:perfilId/colaboradores"
              element={<ColaboradoresPerfil />}
            />
            <Route path="*" element={<NoEncontrado />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
