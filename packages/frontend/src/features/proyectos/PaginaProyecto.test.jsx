import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { AuthProvider } from "../../context/AuthContext"
import { ProveedorDeAvisos } from "../../context/AvisosContext"
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
      postulacionesAceptadas: [],
      limiteColaboraciones: null,
    },
  ],
  hitos: [
    {
      id: "h1",
      descripcion: "Diseño aprobado",
      fecha: new Date("2026-03-10T12:00:00Z"),
      porcentaje: 20,
    },
    {
      id: "h2",
      descripcion: "Calendario publicado",
      fecha: new Date("2026-05-02T12:00:00Z"),
      porcentaje: 50,
    },
  ],
  avance: 50,
  enlaceSistema: "https://huerta.example.org",
  enlaceRepositorio: null,
}

// Muestra la query actual para poder verificar que la pestaña queda en la URL
const UbicacionActual = () => {
  const { search } = useLocation()
  return <div aria-label="Búsqueda actual">{search}</div>
}

const renderizarEn = (ruta) =>
  render(
    <AuthProvider>
      <ProveedorDeAvisos>
        <MemoryRouter initialEntries={[ruta]}>
          <Routes>
            <Route
              path="/proyectos/:id"
              element={
                <>
                  <PaginaProyecto />
                  <UbicacionActual />
                </>
              }
            />
          </Routes>
        </MemoryRouter>
      </ProveedorDeAvisos>
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
    expect(screen.getByRole("tab", { name: "Perfiles (1)" })).toHaveAttribute(
      "aria-selected",
      "true",
    )
    expect(
      screen.getByRole("heading", { name: "Desarrollo frontend" }),
    ).toBeInTheDocument()
    expect(screen.getByText("4 horas por semana")).toBeInTheDocument()
    expect(screen.getByText("React")).toBeInTheDocument()
  })

  test("muestra la concreción actual y solo los enlaces que tiene", async () => {
    obtenerProyecto.mockResolvedValue(proyecto)

    renderizarEn("/proyectos/abc")

    expect(
      await screen.findByRole("progressbar", {
        name: "Concreción del proyecto",
      }),
    ).toHaveAttribute("aria-valuenow", "50")
    expect(
      screen.getByRole("link", { name: "Ver el sistema funcionando" }),
    ).toHaveAttribute("href", "https://huerta.example.org")
    expect(
      screen.queryByRole("link", { name: "Ver el código" }),
    ).not.toBeInTheDocument()
  })

  test("al elegir la pestaña de logros los muestra y la deja en la URL", async () => {
    obtenerProyecto.mockResolvedValue(proyecto)

    renderizarEn("/proyectos/abc")

    userEvent.click(await screen.findByRole("tab", { name: "Logros (2)" }))

    const panel = screen.getByRole("tabpanel")
    const logros = within(panel).getAllByRole("listitem")
    expect(logros).toHaveLength(2)
    expect(logros[0]).toHaveTextContent("Diseño aprobado")
    expect(logros[1]).toHaveTextContent("Calendario publicado")
    expect(
      screen.queryByRole("heading", { name: "Desarrollo frontend" }),
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText("Búsqueda actual")).toHaveTextContent(
      "?tab=avance",
    )
  })

  test("abre directo en la pestaña que dice la URL", async () => {
    obtenerProyecto.mockResolvedValue({ ...proyecto, hitos: [], avance: 0 })

    renderizarEn("/proyectos/abc?tab=avance")

    expect(
      await screen.findByRole("tab", { name: "Logros (0)" }),
    ).toHaveAttribute("aria-selected", "true")
    expect(
      screen.getByRole("heading", { name: "Todavía no hay logros" }),
    ).toBeInTheDocument()
  })

  test("mientras carga avisa que está cargando", () => {
    obtenerProyecto.mockReturnValue(new Promise(() => {}))

    renderizarEn("/proyectos/abc")

    expect(screen.getByRole("status")).toHaveTextContent(
      "Cargando el proyecto...",
    )
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
