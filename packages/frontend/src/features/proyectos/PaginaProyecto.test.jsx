import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { AuthProvider } from "../../context/AuthContext"
import { obtenerProyecto } from "../../service/proyectosService"
import PaginaProyecto from "./PaginaProyecto"

jest.mock("../../service/proyectosService")

const proyecto = {
  id: "abc",
  titulo: "Sitio web de la huerta",
  descripcion: "Publicar el calendario de talleres y cosechas",
  estado: "PUBLICADO",
  colectivo: { id: "c1", nombre: "Huerta Comunitaria Sur" },
  perfiles: [
    {
      id: "p1",
      nombre: "Desarrollo frontend",
      descripcion: "Maquetar el sitio",
      compromiso: "4 horas por semana",
      modalidades: ["Gratuita"],
      habilidadesRequeridas: ["React"],
      habilidadesOpcionales: ["TypeScript"],
    },
  ],
}

const renderizarEn = (ruta) =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path="/proyectos/:id" element={<PaginaProyecto />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )

describe("PaginaProyecto", () => {
  test("muestra el proyecto de la URL con sus perfiles", async () => {
    obtenerProyecto.mockResolvedValue(proyecto)

    renderizarEn("/proyectos/abc")

    expect(
      await screen.findByRole("heading", { name: "Sitio web de la huerta" }),
    ).toBeInTheDocument()
    expect(obtenerProyecto).toHaveBeenCalledWith("abc")
    expect(
      screen.getByRole("heading", { name: "Desarrollo frontend" }),
    ).toBeInTheDocument()
    expect(screen.getByText("4 horas por semana")).toBeInTheDocument()
    expect(screen.getByText("React")).toBeInTheDocument()
  })

  test("si no puede cargarlo muestra el error y permite reintentar", async () => {
    obtenerProyecto
      .mockRejectedValueOnce({ response: { status: 404 } })
      .mockResolvedValueOnce(proyecto)

    renderizarEn("/proyectos/abc")

    expect(
      await screen.findByText("Proyecto no encontrado"),
    ).toBeInTheDocument()

    userEvent.click(screen.getByRole("button", { name: "Reintentar" }))

    expect(
      await screen.findByRole("heading", { name: "Sitio web de la huerta" }),
    ).toBeInTheDocument()
  })
})
