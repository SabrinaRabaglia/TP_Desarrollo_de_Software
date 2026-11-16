import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { obtenerUsuarioActual } from "../../service/authService"
import MiCuenta from "./MiCuenta"

jest.mock("../../service/authService", () => ({
  ...jest.requireActual("../../service/authService"),
  obtenerUsuarioActual: jest.fn(),
}))

const renderizar = () =>
  render(
    <MemoryRouter>
      <MiCuenta />
    </MemoryRouter>,
  )

const enlaces = () =>
  screen
    .getAllByRole("link")
    .map((enlace) => [enlace.textContent, enlace.getAttribute("href")])

describe("MiCuenta", () => {
  test("un colectivo ve sus datos y llega a la página y a la edición de su colectivo", async () => {
    obtenerUsuarioActual.mockResolvedValue({
      id: "u1",
      email: "huerta@colectivo.test",
      rol: "COLECTIVO",
      entidad: { id: "c1", nombre: "Huerta del Sur" },
      nombre: "Huerta del Sur",
    })

    renderizar()

    expect(await screen.findByText("huerta@colectivo.test")).toBeInTheDocument()
    expect(screen.getByText("Colectivo")).toBeInTheDocument()
    expect(enlaces()).toEqual([
      ["Ver la página de mi colectivo", "/colectivos/c1"],
      ["Editar mi colectivo", "/mi-colectivo"],
    ])
  })

  test("una persona colaboradora llega a su perfil público y a editarlo", async () => {
    obtenerUsuarioActual.mockResolvedValue({
      id: "u2",
      email: "ana@persona.test",
      rol: "PERSONA_COLABORADORA",
      entidad: { id: "p1", nombre: "anag" },
      nombre: "anag",
    })

    renderizar()

    await screen.findByText("ana@persona.test")
    expect(enlaces()).toEqual([
      ["Ver mi perfil público", "/colaboradoras/p1"],
      ["Editar mi perfil", "/mi-perfil"],
    ])
  })
})
