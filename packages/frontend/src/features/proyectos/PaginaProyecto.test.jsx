import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { AuthProvider } from "../../context/AuthContext"
import { ProveedorDeAvisos } from "../../context/AvisosContext"
import { obtenerHabilidades } from "../../service/habilidadesService"
import {
  agregarPerfil,
  modificarPerfil,
  obtenerProyecto,
} from "../../service/proyectosService"
import PaginaProyecto from "./PaginaProyecto"

jest.mock("../../service/habilidadesService")
jest.mock("../../service/proyectosService", () => ({
  ...jest.requireActual("../../service/proyectosService"),
  agregarPerfil: jest.fn(),
  modificarPerfil: jest.fn(),
  obtenerProyecto: jest.fn(),
}))

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
      cantidadHoras: 4,
      unidadCompromiso: "HORAS_SEMANALES",
      modalidades: ["Gratuita"],
      modalidadesColaboracion: ["GRATUITA"],
      habilidadesRequeridas: [{ id: "h1", titulo: "React" }],
      habilidadesOpcionales: [{ id: "h2", titulo: "TypeScript" }],
      postulacionesAceptadas: [],
      limiteColaboraciones: null,
      busquedaAbierta: true,
      busquedaAbiertaHasta: null,
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

const iniciarSesionComoColectivo = (id) =>
  localStorage.setItem(
    "sesion",
    JSON.stringify({
      token: "token",
      usuario: { id: `usuario-${id}`, rol: "COLECTIVO", entidad: { id } },
    }),
  )

afterEach(() => {
  localStorage.clear()
})

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

  test("cuando el colectivo dueño edita un perfil, la tarjeta muestra los datos nuevos", async () => {
    iniciarSesionComoColectivo("c1")
    obtenerHabilidades.mockResolvedValue([{ id: "h1", titulo: "React" }])
    modificarPerfil.mockResolvedValue()
    obtenerProyecto.mockResolvedValueOnce(proyecto).mockResolvedValueOnce({
      ...proyecto,
      perfiles: [{ ...proyecto.perfiles[0], limiteColaboraciones: 3 }],
    })

    renderizarEn("/proyectos/abc")

    expect(await screen.findByText("Sin límite de cupos")).toBeInTheDocument()
    userEvent.click(screen.getByRole("button", { name: "Editar perfil" }))
    const dialogo = await screen.findByRole("dialog")
    userEvent.type(
      await within(dialogo).findByLabelText("Límite de colaboraciones"),
      "3",
    )
    userEvent.click(within(dialogo).getByRole("button", { name: "Guardar" }))

    expect(
      await screen.findByText("3 cupos disponibles de 3"),
    ).toBeInTheDocument()
    expect(modificarPerfil).toHaveBeenCalledWith("abc", "p1", {
      limiteColaboraciones: 3,
    })
    expect(
      screen.getByRole("heading", { name: "Sitio web de la huerta" }),
    ).toBeInTheDocument()
  })

  test("quien no es el colectivo dueño no ve las acciones de gestión", async () => {
    iniciarSesionComoColectivo("c2")
    obtenerProyecto.mockResolvedValue(proyecto)

    renderizarEn("/proyectos/abc")

    expect(
      await screen.findByRole("heading", { name: "Desarrollo frontend" }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: "Editar proyecto" }),
    ).not.toBeInTheDocument()
    for (const accion of [
      "Cerrar proyecto",
      "Borrar proyecto",
      "Agregar un perfil",
      "Editar perfil",
      "Quitar perfil",
      "Cerrar búsqueda",
    ]) {
      expect(
        screen.queryByRole("button", { name: accion }),
      ).not.toBeInTheDocument()
    }
  })

  test("el colectivo dueño ve cómo editar, cerrar y borrar su proyecto", async () => {
    iniciarSesionComoColectivo("c1")
    obtenerProyecto.mockResolvedValue(proyecto)

    renderizarEn("/proyectos/abc")

    expect(
      await screen.findByRole("link", { name: "Editar proyecto" }),
    ).toHaveAttribute("href", "/proyectos/abc/edicion")
    expect(
      screen.getByRole("button", { name: "Cerrar proyecto" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Borrar proyecto" }),
    ).toBeInTheDocument()
  })

  test("el colectivo dueño agrega un perfil y lo ve en la página", async () => {
    iniciarSesionComoColectivo("c1")
    obtenerHabilidades.mockResolvedValue([{ id: "h1", titulo: "React" }])
    agregarPerfil.mockResolvedValue()
    const tester = {
      ...proyecto.perfiles[0],
      id: "p2",
      nombre: "Tester",
      descripcion: "Probar la app",
    }
    obtenerProyecto
      .mockResolvedValueOnce({ ...proyecto, perfiles: [] })
      .mockResolvedValueOnce({ ...proyecto, perfiles: [tester] })

    renderizarEn("/proyectos/abc")

    expect(
      await screen.findByText(
        "Este proyecto todavía no tiene perfiles. Agregá el primero para que las personas puedan postularse.",
      ),
    ).toBeInTheDocument()
    userEvent.click(screen.getByRole("button", { name: "Agregar un perfil" }))
    const dialogo = within(
      await screen.findByRole("dialog", { name: "Agregar un perfil" }),
    )
    userEvent.type(await dialogo.findByLabelText(/^Nombre/), "Tester")
    userEvent.type(dialogo.getByLabelText(/^Descripción/), "Probar la app")
    userEvent.type(dialogo.getByLabelText(/^Cantidad de horas/), "4")
    userEvent.click(
      dialogo.getByRole("combobox", { name: /^Unidad de compromiso/ }),
    )
    userEvent.click(screen.getByRole("option", { name: "horas por semana" }))
    userEvent.click(dialogo.getByRole("checkbox", { name: "Gratuita" }))
    userEvent.click(
      within(
        dialogo.getByRole("group", { name: "Habilidades requeridas" }),
      ).getByRole("checkbox", { name: "React" }),
    )
    userEvent.click(dialogo.getByRole("button", { name: "Agregar perfil" }))

    expect(
      await screen.findByRole("heading", { name: "Tester" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Agregaste el perfil Tester al proyecto."),
    ).toBeInTheDocument()
    expect(agregarPerfil).toHaveBeenCalledWith(
      "abc",
      expect.objectContaining({
        nombre: "Tester",
        habilidadesRequeridas: ["h1"],
      }),
    )
    expect(screen.getByRole("tab", { name: "Perfiles (1)" })).toBeVisible()
  })

  test("en un proyecto cerrado el dueño ya no puede cerrarlo ni agregarle perfiles", async () => {
    iniciarSesionComoColectivo("c1")
    obtenerProyecto.mockResolvedValue({ ...proyecto, estado: "CERRADO" })

    renderizarEn("/proyectos/abc")

    expect(
      await screen.findByRole("button", { name: "Borrar proyecto" }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Cerrar proyecto" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Agregar un perfil" }),
    ).not.toBeInTheDocument()
  })
})
