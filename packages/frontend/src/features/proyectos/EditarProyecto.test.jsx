import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { AuthProvider } from "../../context/AuthContext"
import { ProveedorDeAvisos } from "../../context/AvisosContext"
import {
  modificarProyecto,
  obtenerProyecto,
} from "../../service/proyectosService"
import EditarProyecto from "./EditarProyecto"

jest.mock("../../service/proyectosService")

const proyecto = {
  id: "abc",
  titulo: "Sitio web de la huerta",
  descripcion: "Publicar el calendario de talleres y cosechas",
  estado: "PUBLICADO",
  colectivo: { id: "c1", nombre: "Huerta Comunitaria Sur" },
  perfiles: [],
  hitos: [],
  avance: 0,
  enlaceSistema: "https://huerta.example.org",
  enlaceRepositorio: null,
}

const iniciarSesionComoColectivo = (id) =>
  localStorage.setItem(
    "sesion",
    JSON.stringify({
      token: "token",
      usuario: { id: `usuario-${id}`, rol: "COLECTIVO", entidad: { id } },
    }),
  )

const renderizar = () =>
  render(
    <AuthProvider>
      <ProveedorDeAvisos>
        <MemoryRouter initialEntries={["/proyectos/abc/edicion"]}>
          <Routes>
            <Route path="/proyectos/:id/edicion" element={<EditarProyecto />} />
            <Route
              path="/proyectos/:id"
              element={<h1>Página del proyecto</h1>}
            />
          </Routes>
        </MemoryRouter>
      </ProveedorDeAvisos>
    </AuthProvider>,
  )

const guardar = () =>
  userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }))

beforeEach(() => {
  iniciarSesionComoColectivo("c1")
  obtenerProyecto.mockResolvedValue(proyecto)
  modificarProyecto.mockResolvedValue()
})

afterEach(() => {
  localStorage.clear()
})

describe("EditarProyecto", () => {
  test("mientras carga lo avisa y después muestra los datos actuales", async () => {
    renderizar()

    expect(screen.getByRole("status")).toHaveTextContent(
      "Cargando el proyecto...",
    )
    expect(await screen.findByLabelText(/^Título/)).toHaveValue(
      "Sitio web de la huerta",
    )
    expect(obtenerProyecto).toHaveBeenCalledWith("abc")
    expect(screen.getByLabelText(/^Descripción/)).toHaveValue(
      "Publicar el calendario de talleres y cosechas",
    )
    expect(
      screen.getByLabelText("Enlace al sistema en funcionamiento"),
    ).toHaveValue("https://huerta.example.org")
    expect(screen.getByLabelText("Enlace al código fuente")).toHaveValue("")
  })

  test("manda solo lo que cambió y vuelve a la página del proyecto", async () => {
    renderizar()

    const titulo = await screen.findByLabelText(/^Título/)
    userEvent.clear(titulo)
    userEvent.type(titulo, "Sitio de la huerta")
    userEvent.type(
      screen.getByLabelText("Enlace al código fuente"),
      "https://git.example.org/huerta",
    )
    guardar()

    expect(
      await screen.findByRole("heading", { name: "Página del proyecto" }),
    ).toBeInTheDocument()
    expect(modificarProyecto).toHaveBeenCalledWith("abc", {
      titulo: "Sitio de la huerta",
      enlaceRepositorio: "https://git.example.org/huerta",
    })
    expect(
      screen.getByText(
        "Guardaste los cambios del proyecto Sitio de la huerta.",
      ),
    ).toBeInTheDocument()
  })

  test("un enlace que se vacía viaja como null para quitarlo", async () => {
    renderizar()

    userEvent.clear(
      await screen.findByLabelText("Enlace al sistema en funcionamiento"),
    )
    guardar()

    await screen.findByRole("heading", { name: "Página del proyecto" })
    expect(modificarProyecto).toHaveBeenCalledWith("abc", {
      enlaceSistema: null,
    })
  })

  test("sin cambios vuelve al proyecto sin llamar al back", async () => {
    renderizar()

    await screen.findByLabelText(/^Título/)
    guardar()

    expect(
      await screen.findByRole("heading", { name: "Página del proyecto" }),
    ).toBeInTheDocument()
    expect(modificarProyecto).not.toHaveBeenCalled()
  })

  test("si el back rechaza el cambio muestra su mensaje y conserva lo escrito", async () => {
    modificarProyecto.mockRejectedValue({
      response: {
        status: 409,
        data: { message: "Ya existe un proyecto con ese título" },
      },
    })
    renderizar()

    const titulo = await screen.findByLabelText(/^Título/)
    userEvent.clear(titulo)
    userEvent.type(titulo, "Mapa de humedales")
    guardar()

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ya existe un proyecto con ese título",
    )
    expect(titulo).toHaveValue("Mapa de humedales")
    expect(
      screen.getByRole("button", { name: "Guardar cambios" }),
    ).toBeEnabled()
  })

  test("a un colectivo que no es el dueño lo devuelve a la página del proyecto", async () => {
    iniciarSesionComoColectivo("c2")
    renderizar()

    expect(
      await screen.findByRole("heading", { name: "Página del proyecto" }),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText(/^Título/)).not.toBeInTheDocument()
  })

  test("si no puede cargar el proyecto muestra el error y permite reintentar", async () => {
    obtenerProyecto
      .mockRejectedValueOnce({ response: { status: 404 } })
      .mockResolvedValueOnce(proyecto)
    renderizar()

    expect(
      await screen.findByText("Proyecto no encontrado"),
    ).toBeInTheDocument()

    userEvent.click(screen.getByRole("button", { name: "Reintentar" }))

    expect(await screen.findByLabelText(/^Título/)).toHaveValue(
      "Sitio web de la huerta",
    )
  })
})
