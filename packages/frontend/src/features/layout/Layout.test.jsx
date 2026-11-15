import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { AuthProvider } from "../../context/AuthContext"
import Layout from "./Layout"

const renderizar = () =>
  render(
    <AuthProvider>
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<h1>Inicio</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )

describe("Layout", () => {
  test("lo primero que se alcanza con el teclado es el enlace para saltar al contenido", async () => {
    renderizar()

    await userEvent.tab()

    const saltar = screen.getByRole("link", { name: "Saltar al contenido" })
    expect(saltar).toHaveFocus()
    expect(saltar).toHaveAttribute("href", "#contenido")
    expect(screen.getByRole("main")).toHaveAttribute("id", "contenido")
  })
})
