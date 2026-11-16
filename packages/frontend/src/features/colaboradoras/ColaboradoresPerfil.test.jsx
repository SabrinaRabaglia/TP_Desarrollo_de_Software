import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { obtenerColaboradoresPerfil } from "../../service/colaboradorasService"
import { obtenerResumenDelPerfil } from "../../service/proyectosService"
import ColaboradoresPerfil from "./ColaboradoresPerfil"

jest.mock("../../service/colaboradorasService")
jest.mock("../../service/proyectosService")

const hornero = {
  id: "p1",
  esAnonima: false,
  nombreFantasia: "Hornero",
  nombreCompleto: null,
  presentacion: "Pruebas de punta a punta y de servicios",
  cuentas: [],
}

const renderizar = () =>
  render(
    <MemoryRouter
      initialEntries={["/proyectos/pr1/perfiles/pf1/colaboradores"]}
    >
      <Routes>
        <Route
          path="/proyectos/:proyectoId/perfiles/:perfilId/colaboradores"
          element={<ColaboradoresPerfil />}
        />
      </Routes>
    </MemoryRouter>,
  )

beforeEach(() => {
  obtenerResumenDelPerfil.mockResolvedValue({
    proyecto: { id: "pr1", titulo: "Portal de voluntariados" },
    perfil: { nombre: "QA Automation", limite: 3, aceptadas: 0 },
  })
})

describe("ColaboradoresPerfil", () => {
  test("si el perfil no tiene colaboradores lo dice en vez de dejar la pantalla vacía", async () => {
    obtenerColaboradoresPerfil.mockResolvedValue([])

    renderizar()

    expect(
      await screen.findByRole("heading", {
        name: "Todavía no hay colaboradores en este perfil",
      }),
    ).toBeInTheDocument()
  })

  test("lista a quienes colaboran y no muestra ningún dato de las contribuciones anónimas", async () => {
    const errores = jest.spyOn(console, "error").mockImplementation(() => {})
    obtenerColaboradoresPerfil.mockResolvedValue([
      hornero,
      { esAnonima: true },
      { esAnonima: true },
    ])

    renderizar()

    expect(await screen.findByText("Hornero")).toBeInTheDocument()
    expect(screen.getAllByText("Colaborador anónimo")).toHaveLength(2)
    expect(
      screen.queryByRole("heading", {
        name: "Todavía no hay colaboradores en este perfil",
      }),
    ).not.toBeInTheDocument()
    // Dos anónimas seguidas no pueden compartir la key de React.
    expect(errores).not.toHaveBeenCalled()
    errores.mockRestore()
  })

  test("si el backend falla muestra el error y deja reintentar", async () => {
    obtenerColaboradoresPerfil.mockRejectedValue(new Error("falló"))

    renderizar()

    expect(await screen.findByRole("alert")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Reintentar" }),
    ).toBeInTheDocument()
  })
})
