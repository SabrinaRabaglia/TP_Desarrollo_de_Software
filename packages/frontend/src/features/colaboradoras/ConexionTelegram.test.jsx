import { act, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  crearEnlaceDeTelegram,
  eliminarMedioDeContacto,
  obtenerMediosDeContacto,
} from "../../service/colaboradorasService"
import ConexionTelegram from "./ConexionTelegram"

jest.mock("../../service/colaboradorasService")

const enlace = "https://t.me/codigo_a_voluntad_bot?start=abc123"
const telegram = { id: "m9", tipo: "TELEGRAM", valor: "555" }

const renderizar = (props = {}) => {
  const alCambiar = jest.fn()
  render(
    <ConexionTelegram
      personaId="p1"
      medio={null}
      alCambiar={alCambiar}
      {...props}
    />,
  )
  return alCambiar
}

const pasar = (ms) =>
  act(async () => {
    jest.advanceTimersByTime(ms)
  })

const conectar = async () => {
  userEvent.click(screen.getByRole("button", { name: "Conectar Telegram" }))
  await screen.findByRole("link", { name: "Abrir Telegram" })
}

beforeEach(() => {
  jest.useFakeTimers()
  jest.spyOn(window, "open").mockImplementation(() => null)
  crearEnlaceDeTelegram.mockResolvedValue({
    enlace,
    venceEn: "2026-11-15T12:00:00.000Z",
  })
  obtenerMediosDeContacto.mockResolvedValue([])
  eliminarMedioDeContacto.mockResolvedValue()
})

afterEach(() => {
  jest.useRealTimers()
  jest.restoreAllMocks()
})

describe("ConexionTelegram", () => {
  test("sin medio ofrece conectar y explica para qué sirve", () => {
    renderizar()

    expect(screen.getByRole("group", { name: "Telegram" })).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Conectar Telegram" }),
    ).toBeInTheDocument()
  })

  test("al conectar pide el enlace, abre Telegram y deja un link por si el navegador bloquea la ventana", async () => {
    renderizar()

    await conectar()

    expect(crearEnlaceDeTelegram).toHaveBeenCalledWith("p1")
    expect(window.open).toHaveBeenCalledWith(enlace, "_blank", "noopener")
    expect(
      screen.getByRole("link", { name: "Abrir Telegram" }),
    ).toHaveAttribute("href", enlace)
    expect(screen.getByText(/Tocá Iniciar en el chat del bot/)).toBeVisible()
  })

  test("cuando aparece el medio de Telegram avisa para actualizar la pantalla", async () => {
    const alCambiar = renderizar()
    await conectar()
    obtenerMediosDeContacto.mockResolvedValue([
      { id: "m1", tipo: "EMAIL", valor: "ana@example.com" },
      telegram,
    ])

    await pasar(3000)

    expect(obtenerMediosDeContacto).toHaveBeenCalledWith("p1")
    expect(alCambiar).toHaveBeenCalledWith(telegram)
    expect(
      screen.queryByRole("link", { name: "Abrir Telegram" }),
    ).not.toBeInTheDocument()
  })

  test("con el medio ya conectado lo dice y no ofrece conectar", () => {
    renderizar({ medio: telegram })

    expect(screen.getByRole("status")).toHaveTextContent("Telegram conectado")
    expect(
      screen.queryByRole("button", { name: "Conectar Telegram" }),
    ).not.toBeInTheDocument()
  })

  test("si pasan dos minutos sin conexión vuelve al botón con un aviso", async () => {
    renderizar()
    await conectar()

    await pasar(2 * 60 * 1000)

    expect(
      screen.getByText("No detectamos la conexión. Probá de nuevo."),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Conectar Telegram" }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: "Abrir Telegram" }),
    ).not.toBeInTheDocument()
    const consultas = obtenerMediosDeContacto.mock.calls.length
    await pasar(10000)
    expect(obtenerMediosDeContacto).toHaveBeenCalledTimes(consultas)
  })

  test("cancelar corta la espera", async () => {
    renderizar()
    await conectar()

    userEvent.click(screen.getByRole("button", { name: "Cancelar" }))
    await pasar(10000)

    expect(
      screen.getByRole("button", { name: "Conectar Telegram" }),
    ).toBeInTheDocument()
    expect(obtenerMediosDeContacto).not.toHaveBeenCalled()
  })

  test("desconectar pide confirmación, elimina el medio y avisa", async () => {
    const alCambiar = renderizar({ medio: telegram })

    userEvent.click(screen.getByRole("button", { name: "Desconectar" }))
    expect(eliminarMedioDeContacto).not.toHaveBeenCalled()
    const dialogo = await screen.findByRole("dialog")
    userEvent.click(
      within(dialogo).getByRole("button", { name: "Desconectar" }),
    )

    await act(async () => {})
    expect(eliminarMedioDeContacto).toHaveBeenCalledWith("p1", "m9")
    expect(alCambiar).toHaveBeenCalledWith(null)
  })

  test("si el backend no puede dar el enlace muestra su mensaje y deja reintentar", async () => {
    crearEnlaceDeTelegram.mockRejectedValueOnce({
      response: { data: { message: "Telegram no está configurado" } },
    })
    renderizar()

    userEvent.click(screen.getByRole("button", { name: "Conectar Telegram" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Telegram no está configurado",
    )
    await conectar()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })
})
