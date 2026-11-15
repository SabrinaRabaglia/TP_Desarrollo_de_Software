import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { AuthProvider } from "../../context/AuthContext"
import {
  obtenerEnviados,
  obtenerRecibidos,
} from "../../service/mensajesService"
import PaginaMensajes from "./PaginaMensajes"

jest.mock("../../service/mensajesService")

const mensaje = {
  id: "m1",
  fecha: new Date("2026-11-13T21:30:00.000Z"),
  contenido: "Hola! Tu perfil encaja con nuestro proyecto",
  colectivo: "Huerta Comunitaria Sur",
  destinataria: null,
  proyecto: { id: "pr1", titulo: "Sitio web de la huerta" },
  perfil: "Frontend",
}

const iniciarSesionCon = (usuario) => {
  localStorage.setItem("sesion", JSON.stringify({ token: "token", usuario }))
}

const iniciarSesionComoPersona = () =>
  iniciarSesionCon({
    id: "u2",
    email: "ana@ejemplo.com",
    rol: "PERSONA_COLABORADORA",
    entidad: { id: "p1", nombre: "anag" },
  })

const iniciarSesionComoColectivo = () =>
  iniciarSesionCon({
    id: "u1",
    email: "huerta@colectivo.test",
    rol: "COLECTIVO",
    entidad: { id: "c1", nombre: "Huerta Comunitaria Sur" },
  })

const renderizar = () =>
  render(
    <AuthProvider>
      <MemoryRouter>
        <PaginaMensajes />
      </MemoryRouter>
    </AuthProvider>,
  )

afterEach(() => {
  localStorage.clear()
})

describe("PaginaMensajes", () => {
  test("mientras carga lo avisa y después lista los mensajes recibidos por la persona", async () => {
    iniciarSesionComoPersona()
    obtenerRecibidos.mockResolvedValue([mensaje])

    renderizar()

    expect(screen.getByRole("status")).toHaveTextContent(
      "Cargando los mensajes...",
    )
    expect(
      await screen.findByRole("heading", { name: "Mensajes recibidos" }),
    ).toBeInTheDocument()
    expect(obtenerRecibidos).toHaveBeenCalledWith("p1")
    expect(screen.getAllByRole("listitem")).toHaveLength(1)
    expect(
      screen.getByRole("heading", { name: "De Huerta Comunitaria Sur" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "Sitio web de la huerta" }),
    ).toHaveAttribute("href", "/proyectos/pr1")
    expect(screen.getByText("Frontend")).toBeInTheDocument()
    expect(screen.getByText(mensaje.contenido)).toBeInTheDocument()
  })

  test("el colectivo ve sus enviados con la destinataria, y sin link si el proyecto se eliminó", async () => {
    iniciarSesionComoColectivo()
    obtenerEnviados.mockResolvedValue([
      {
        ...mensaje,
        destinataria: "anag",
        proyecto: { id: null, titulo: "Proyecto eliminado" },
      },
    ])

    renderizar()

    expect(
      await screen.findByRole("heading", { name: "Mensajes enviados" }),
    ).toBeInTheDocument()
    expect(obtenerEnviados).toHaveBeenCalledWith("c1")
    expect(
      screen.getByRole("heading", { name: "Para anag" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Proyecto eliminado")).toBeInTheDocument()
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })

  test("sin mensajes muestra el estado vacío", async () => {
    iniciarSesionComoPersona()
    obtenerRecibidos.mockResolvedValue([])

    renderizar()

    expect(
      await screen.findByText("Todavía no recibiste mensajes."),
    ).toBeInTheDocument()
    expect(screen.queryByRole("list")).not.toBeInTheDocument()
  })

  test("si no puede cargarlos muestra el error y permite reintentar", async () => {
    iniciarSesionComoPersona()
    obtenerRecibidos
      .mockRejectedValueOnce({
        response: { data: { message: "No se pudieron cargar" } },
      })
      .mockResolvedValueOnce([mensaje])

    renderizar()

    expect(await screen.findByText("No se pudieron cargar")).toBeInTheDocument()

    userEvent.click(screen.getByRole("button", { name: "Reintentar" }))

    expect(
      await screen.findByRole("heading", { name: "De Huerta Comunitaria Sur" }),
    ).toBeInTheDocument()
    expect(obtenerRecibidos).toHaveBeenCalledTimes(2)
  })
})
