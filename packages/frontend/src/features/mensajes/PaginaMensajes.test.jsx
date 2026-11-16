import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { AuthProvider } from "../../context/AuthContext"
import { ProveedorDeAvisos } from "../../context/AvisosContext"
import {
  ProveedorDeMensajesSinLeer,
  useMensajesSinLeer,
} from "../../context/MensajesSinLeerContext"
import {
  contarRecibidosSinLeer,
  marcarRecibidosComoLeidos,
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
  noLeido: false,
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

// Hace de navbar: muestra lo que tiene el contador de sin leer.
const Contador = () => <p>Contador: {useMensajesSinLeer().sinLeer}</p>

const renderizar = () =>
  render(
    <AuthProvider>
      <ProveedorDeAvisos>
        <MemoryRouter>
          <ProveedorDeMensajesSinLeer>
            <Contador />
            <PaginaMensajes />
          </ProveedorDeMensajesSinLeer>
        </MemoryRouter>
      </ProveedorDeAvisos>
    </AuthProvider>,
  )

const contador = () => screen.getByText(/^Contador:/)

beforeEach(() => {
  contarRecibidosSinLeer.mockResolvedValue(0)
})

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

  test("la persona ve cuáles no leyó y los marca todos como leídos con el botón", async () => {
    iniciarSesionComoPersona()
    obtenerRecibidos.mockResolvedValue([
      { ...mensaje, id: "m1", noLeido: true },
      { ...mensaje, id: "m2", noLeido: true },
      { ...mensaje, id: "m3" },
    ])
    marcarRecibidosComoLeidos.mockResolvedValue(2)

    renderizar()

    expect(
      await screen.findByText("Tenés 2 mensajes sin leer."),
    ).toBeInTheDocument()
    const [primero, segundo, tercero] = screen.getAllByRole("listitem")
    expect(within(primero).getByText("Sin leer")).toBeInTheDocument()
    expect(within(segundo).getByText("Sin leer")).toBeInTheDocument()
    expect(within(tercero).queryByText("Sin leer")).not.toBeInTheDocument()

    await userEvent.click(
      screen.getByRole("button", { name: "Marcar todos como leídos" }),
    )

    expect(marcarRecibidosComoLeidos).toHaveBeenCalledWith("p1")
    expect(
      await screen.findByText("Marcaste 2 mensajes como leídos."),
    ).toBeInTheDocument()
    expect(screen.queryByText("Sin leer")).not.toBeInTheDocument()
    expect(screen.getByText("Leíste todos tus mensajes.")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Marcar todos como leídos" }),
    ).not.toBeInTheDocument()
  })

  test("el contador de la navbar sigue a la bandeja y vuelve a cero al marcarlos", async () => {
    iniciarSesionComoPersona()
    contarRecibidosSinLeer.mockResolvedValue(2)
    obtenerRecibidos.mockResolvedValue([
      { ...mensaje, id: "m1", noLeido: true },
      { ...mensaje, id: "m2", noLeido: true },
    ])
    marcarRecibidosComoLeidos.mockResolvedValue(2)

    renderizar()

    await screen.findByText("Tenés 2 mensajes sin leer.")
    expect(contador()).toHaveTextContent("2")

    await userEvent.click(
      screen.getByRole("button", { name: "Marcar todos como leídos" }),
    )

    await waitFor(() => expect(contador()).toHaveTextContent("0"))
  })

  test.each([
    [1, "Marcaste 1 mensaje como leído."],
    [0, "Tus mensajes ya estaban leídos."],
  ])("si el back marcó %i, el aviso lo dice bien", async (marcadas, aviso) => {
    iniciarSesionComoPersona()
    obtenerRecibidos.mockResolvedValue([{ ...mensaje, noLeido: true }])
    marcarRecibidosComoLeidos.mockResolvedValue(marcadas)

    renderizar()

    await userEvent.click(
      await screen.findByRole("button", {
        name: "Marcar todos como leídos",
      }),
    )

    expect(await screen.findByText(aviso)).toBeInTheDocument()
  })

  test("abrir la bandeja no marca nada como leído", async () => {
    iniciarSesionComoPersona()
    obtenerRecibidos.mockResolvedValue([{ ...mensaje, noLeido: true }])

    renderizar()

    expect(
      await screen.findByText("Tenés 1 mensaje sin leer."),
    ).toBeInTheDocument()
    expect(marcarRecibidosComoLeidos).not.toHaveBeenCalled()
  })

  test("si no se pueden marcar, muestra el error y siguen sin leer", async () => {
    iniciarSesionComoPersona()
    obtenerRecibidos.mockResolvedValue([{ ...mensaje, noLeido: true }])
    marcarRecibidosComoLeidos.mockRejectedValue({
      response: { data: { message: "No se pudo marcar" } },
    })

    renderizar()

    await userEvent.click(
      await screen.findByRole("button", { name: "Marcar todos como leídos" }),
    )

    expect(await screen.findByText("No se pudo marcar")).toBeInTheDocument()
    expect(screen.getByText("Sin leer")).toBeInTheDocument()
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Marcar todos como leídos" }),
      ).toBeEnabled(),
    )
  })

  test("el colectivo no tiene nada para marcar como leído", async () => {
    iniciarSesionComoColectivo()
    obtenerEnviados.mockResolvedValue([{ ...mensaje, destinataria: "anag" }])

    renderizar()

    expect(
      await screen.findByRole("heading", { name: "Para anag" }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Marcar todos como leídos" }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/sin leer/i)).not.toBeInTheDocument()
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
