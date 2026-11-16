import { Route, Routes } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import Layout from "./features/layout/Layout"
import Inicio from "./features/inicio/Inicio"
import Login from "./features/auth/Login"
import RutaPrivada from "./features/auth/RutaPrivada"
import MiCuenta from "./features/cuenta/MiCuenta"
import RegistroColaboradora from "./features/colaboradoras/RegistroColaboradora"
import PaginaColaboradora from "./features/colaboradoras/PaginaColaboradora"
import MiPerfil from "./features/colaboradoras/MiPerfil"
import RegistroColectivo from "./features/colectivos/RegistroColectivo"
import PaginaColectivo from "./features/colectivos/PaginaColectivo"
import MiColectivo from "./features/colectivos/MiColectivo"
import PaginaProyecto from "./features/proyectos/PaginaProyecto"
import NuevoProyecto from "./features/proyectos/NuevoProyecto"
import EditarProyecto from "./features/proyectos/EditarProyecto"
import PaginaMensajes from "./features/mensajes/PaginaMensajes"
import PaginaCandidatas from "./features/contacto/PaginaCandidatas"
import NoEncontrado from "./features/noEncontrado/NoEncontrado"
import BuscarProyectos from "./features/busqueda/BuscarProyectos"
import PaginaPostulaciones from "./features/postulaciones/PaginaPostulaciones.jsx"
import PostulacionesPerfil from "./features/postulaciones/PostulacionesPerfil.jsx"
import ColaboradoresPerfil from "./features/colaboradoras/ColaboradoresPerfil.jsx"

const App = () => {
  return (
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
          <Route path="/colectivos/nuevo" element={<RegistroColectivo />} />
          <Route path="/colectivos/:id" element={<PaginaColectivo />} />
          <Route path="/proyectos/:id" element={<PaginaProyecto />} />
          <Route element={<RutaPrivada rol="PERSONA_COLABORADORA" />}>
            <Route path="/postulaciones" element={<PaginaPostulaciones />} />
            <Route path="/buscar" element={<BuscarProyectos />} />
          </Route>
          <Route element={<RutaPrivada rol="COLECTIVO" />}>
            <Route path="/proyectos/nuevo" element={<NuevoProyecto />} />
            <Route path="/proyectos/:id/edicion" element={<EditarProyecto />} />
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
            <Route path="/mi-colectivo" element={<MiColectivo />} />
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
  )
}

export default App
