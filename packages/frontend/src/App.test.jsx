import { render, screen } from "@testing-library/react"
import { MemoryRouter, useLocation } from "react-router-dom"
import { buscarProyectos } from "./service/proyectosService"
import App from "./App"

jest.mock("./service/proyectosService", () => ({
  ...jest.requireActual("./service/proyectosService"),
  buscarProyectos: jest.fn(),
}))

// Muestra la dirección actual para ver a dónde terminó la navegación.
const Direccion = () => <p>Dirección: {useLocation().pathname}</p>

describe("App", () => {
  test("/proyectos lleva al listado de proyectos del inicio", async () => {
    buscarProyectos.mockResolvedValue({ proyectos: [], totalPaginas: 1 })

    render(
      <MemoryRouter initialEntries={["/proyectos"]}>
        <App />
        <Direccion />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole("heading", { level: 2, name: "Proyectos" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Dirección: /")).toBeInTheDocument()
    expect(buscarProyectos).toHaveBeenCalled()
  })
})
