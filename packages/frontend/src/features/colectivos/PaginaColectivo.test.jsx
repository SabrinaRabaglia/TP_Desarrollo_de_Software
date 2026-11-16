import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { AuthProvider } from "../../context/AuthContext"
import { obtenerColectivo } from "../../service/colectivosService"
import PaginaColectivo from "./PaginaColectivo"

jest.mock("../../service/colectivosService")

const colectivo = {
  id: "c1",
  nombre: "Huerta del Sur",
  descripcion: "Huerta comunitaria del barrio",
  tipo: "Asamblea",
  ubicacion: "Lanús, Buenos Aires, Argentina",
}

const iniciarSesionComoColectivo = (id) => {
  localStorage.setItem(
    "sesion",
    JSON.stringify({
      token: "token",
      usuario: { id: "u1", rol: "COLECTIVO", entidad: { id, nombre: "X" } },
    }),
  )
}

const renderizar = () =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/colectivos/c1"]}>
        <Routes>
          <Route path="/colectivos/:id" element={<PaginaColectivo />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )

const enlaceParaEditar = () =>
  screen.queryByRole("link", { name: "Editar mi colectivo" })

beforeEach(() => {
  obtenerColectivo.mockResolvedValue(colectivo)
})

afterEach(() => {
  localStorage.clear()
})

describe("PaginaColectivo", () => {
  test("sin sesión muestra el nombre, el tipo, la descripción y la ubicación", async () => {
    renderizar()

    expect(
      await screen.findByRole("heading", { name: "Huerta del Sur", level: 1 }),
    ).toBeInTheDocument()
    expect(screen.getByText("Asamblea")).toBeInTheDocument()
    expect(
      screen.getByText("Huerta comunitaria del barrio"),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Lanús, Buenos Aires, Argentina/),
    ).toBeInTheDocument()
    expect(obtenerColectivo).toHaveBeenCalledWith("c1")
    expect(enlaceParaEditar()).not.toBeInTheDocument()
  })

  test("sin ubicación cargada no muestra ese dato", async () => {
    obtenerColectivo.mockResolvedValue({ ...colectivo, ubicacion: null })

    renderizar()

    await screen.findByRole("heading", { name: "Huerta del Sur" })
    expect(screen.queryByText(/Ubicación/)).not.toBeInTheDocument()
  })

  test("al colectivo dueño le ofrece editar su colectivo", async () => {
    iniciarSesionComoColectivo("c1")

    renderizar()

    await screen.findByRole("heading", { name: "Huerta del Sur" })
    expect(enlaceParaEditar()).toHaveAttribute("href", "/mi-colectivo")
  })

  test("a otro colectivo no le ofrece editarla", async () => {
    iniciarSesionComoColectivo("c2")

    renderizar()

    await screen.findByRole("heading", { name: "Huerta del Sur" })
    expect(enlaceParaEditar()).not.toBeInTheDocument()
  })

  test("si el colectivo no existe lo dice", async () => {
    obtenerColectivo.mockRejectedValue({ response: { status: 404 } })

    renderizar()

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Colectivo no encontrado",
    )
  })
})
