import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { AuthProvider } from "../../context/AuthContext"
import RutaPrivada from "./RutaPrivada"

const iniciarSesionComo = (rol) => {
  localStorage.setItem(
    "sesion",
    JSON.stringify({
      token: "token",
      usuario: { id: "u1", rol, entidad: { id: "e1", nombre: "Alguien" } },
    }),
  )
}

const renderizarEn = (ruta) =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path="/" element={<h1>Inicio</h1>} />
          <Route path="/login" element={<h1>Ingresar</h1>} />
          <Route element={<RutaPrivada rol="PERSONA_COLABORADORA" />}>
            <Route path="/mi-perfil" element={<h1>Mi perfil</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )

afterEach(() => {
  localStorage.clear()
})

describe("RutaPrivada con rol", () => {
  test("una sesión de colectivo que entra a /mi-perfil termina en el inicio", () => {
    iniciarSesionComo("COLECTIVO")

    renderizarEn("/mi-perfil")

    expect(screen.getByRole("heading", { name: "Inicio" })).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Mi perfil" }),
    ).not.toBeInTheDocument()
  })

  test("una sesión con el rol pedido ve la página", () => {
    iniciarSesionComo("PERSONA_COLABORADORA")

    renderizarEn("/mi-perfil")

    expect(
      screen.getByRole("heading", { name: "Mi perfil" }),
    ).toBeInTheDocument()
  })

  test("sin sesión manda a ingresar", () => {
    renderizarEn("/mi-perfil")

    expect(
      screen.getByRole("heading", { name: "Ingresar" }),
    ).toBeInTheDocument()
  })
})
