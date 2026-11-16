import api from "./api"
import {
  contarRecibidosSinLeer,
  marcarRecibidosComoLeidos,
  obtenerEnviados,
  obtenerRecibidos,
} from "./mensajesService"

jest.mock("./api", () => ({
  __esModule: true,
  default: { get: jest.fn(), patch: jest.fn() },
}))

afterEach(() => jest.clearAllMocks())

const mensajeBack = {
  id: "m1",
  fecha: "2026-11-13T21:30:00.000Z",
  contenido: "Hola",
  colectivo: { id: "c1", nombre: "Huerta" },
  proyecto: { id: "pr1", titulo: "Web" },
  perfil: { id: "pe1", nombre: "Frontend" },
}

describe("obtenerRecibidos", () => {
  it("marca como no leídos los que el back devuelve sin leer", async () => {
    api.get.mockResolvedValue({
      data: [
        { ...mensajeBack, id: "m1", leida: false },
        { ...mensajeBack, id: "m2", leida: true },
      ],
    })

    const mensajes = await obtenerRecibidos("p1")

    expect(api.get).toHaveBeenCalledWith(
      "/personas-colaboradoras/p1/notificaciones",
    )
    expect(mensajes.map((mensaje) => mensaje.noLeido)).toEqual([true, false])
  })
})

describe("obtenerEnviados", () => {
  it("los enviados nunca figuran como no leídos: el colectivo no lo sabe", async () => {
    api.get.mockResolvedValue({
      data: [{ ...mensajeBack, personaColaboradora: { nombreFantasia: "a" } }],
    })

    const [mensaje] = await obtenerEnviados("c1")

    expect(mensaje.noLeido).toBe(false)
  })
})

describe("marcarRecibidosComoLeidos", () => {
  it("pide marcar toda la bandeja y devuelve cuántos estaban sin leer", async () => {
    api.patch.mockResolvedValue({ data: { marcadas: 3 } })

    expect(await marcarRecibidosComoLeidos("p1")).toBe(3)
    expect(api.patch).toHaveBeenCalledWith(
      "/personas-colaboradoras/p1/notificaciones",
      { leida: true },
    )
  })
})

describe("contarRecibidosSinLeer", () => {
  it("pide la cantidad sin leer de la persona", async () => {
    api.get.mockResolvedValue({ data: { cantidad: 4 } })

    expect(await contarRecibidosSinLeer("p1")).toBe(4)
    expect(api.get).toHaveBeenCalledWith(
      "/personas-colaboradoras/p1/notificaciones/sin-leer",
    )
  })
})
