import { render, screen, within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { obtenerNombresDelPerfil } from "../../service/proyectosService"
import Migas from "./Migas"

jest.mock("../../service/proyectosService")

const renderizar = () =>
  render(
    <MemoryRouter>
      <Migas proyectoId="pr1" perfilId="pf1" actual="Postulaciones" />
    </MemoryRouter>,
  )

describe("Migas", () => {
  test("muestra el camino hasta la pantalla actual", async () => {
    obtenerNombresDelPerfil.mockResolvedValue({
      proyecto: "Sitio web de la huerta",
      perfil: "Tester",
    })

    renderizar()

    const migas = screen.getByRole("navigation", { name: "Ubicación" })
    expect(
      await within(migas).findByRole("link", {
        name: "Sitio web de la huerta",
      }),
    ).toHaveAttribute("href", "/proyectos/pr1")
    expect(
      within(migas).getByRole("link", { name: "Proyectos" }),
    ).toHaveAttribute("href", "/")
    expect(within(migas).getByText("Tester")).toBeInTheDocument()
    expect(within(migas).getByText("Postulaciones")).toHaveAttribute(
      "aria-current",
      "page",
    )
    expect(obtenerNombresDelPerfil).toHaveBeenCalledWith("pr1", "pf1")
  })

  test("si no llegan los nombres igual permite volver al proyecto", async () => {
    obtenerNombresDelPerfil.mockRejectedValue(new Error("sin red"))

    renderizar()

    expect(
      await screen.findByRole("link", { name: "Proyecto" }),
    ).toHaveAttribute("href", "/proyectos/pr1")
    expect(screen.getByText("Perfil")).toBeInTheDocument()
  })
})
