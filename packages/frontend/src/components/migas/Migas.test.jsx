import { render, screen, within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import Migas from "./Migas"

const renderizar = (props = {}) =>
  render(
    <MemoryRouter>
      <Migas
        proyectoId="pr1"
        proyecto="Sitio web de la huerta"
        perfil="Tester"
        actual="Postulaciones"
        {...props}
      />
    </MemoryRouter>,
  )

describe("Migas", () => {
  test("muestra el camino hasta la pantalla actual", () => {
    renderizar()

    const migas = screen.getByRole("navigation", { name: "Ubicación" })
    expect(
      within(migas).getByRole("link", { name: "Proyectos" }),
    ).toHaveAttribute("href", "/")
    expect(
      within(migas).getByRole("link", { name: "Sitio web de la huerta" }),
    ).toHaveAttribute("href", "/proyectos/pr1")
    expect(within(migas).getByText("Tester")).toBeInTheDocument()
    expect(within(migas).getByText("Postulaciones")).toHaveAttribute(
      "aria-current",
      "page",
    )
  })

  test("mientras cargan los nombres ya permite volver al proyecto", () => {
    renderizar({ proyecto: undefined, perfil: undefined, cargando: true })

    expect(screen.getAllByLabelText("Cargando")).toHaveLength(2)
    expect(screen.getByRole("link", { name: "Cargando" })).toHaveAttribute(
      "href",
      "/proyectos/pr1",
    )
  })

  test("si no llegaron los nombres usa unos genéricos", () => {
    renderizar({ proyecto: undefined, perfil: undefined })

    expect(screen.getByRole("link", { name: "Proyecto" })).toHaveAttribute(
      "href",
      "/proyectos/pr1",
    )
    expect(screen.getByText("Perfil")).toBeInTheDocument()
  })
})
