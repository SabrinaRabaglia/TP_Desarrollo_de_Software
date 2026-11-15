import api from "./api"
import {
  darDeBajaPostulacion,
  obtenerPostulacionesColaborador,
} from "./postulacionesService"

jest.mock("./api", () => ({
  __esModule: true,
  default: { get: jest.fn(), patch: jest.fn() },
}))

afterEach(() => jest.clearAllMocks())

describe("darDeBajaPostulacion", () => {
  it("pide la baja de la postulación y devuelve lo que cambió", async () => {
    api.patch.mockResolvedValue({
      data: {
        id: "postulacion-1",
        estado: "BAJA",
        fechaPostulacion: "2026-10-01T00:00:00.000Z",
        fechaRevision: "2026-10-02T00:00:00.000Z",
        fechaBaja: "2026-10-05T00:00:00.000Z",
        origenBaja: "PERSONA_COLABORADORA",
        esAnonima: false,
        personaColaboradora: "persona-1",
        perfil: "perfil-1",
      },
    })

    const baja = await darDeBajaPostulacion("postulacion-1")

    expect(api.patch).toHaveBeenCalledWith("/postulaciones/postulacion-1/baja")
    expect(baja).toEqual({
      id: "postulacion-1",
      estado: "BAJA",
      fechaBaja: "2026-10-05T00:00:00.000Z",
      origenBaja: "PERSONA_COLABORADORA",
    })
  })

  it("propaga el error del back", async () => {
    const error = new Error(
      "Solo se pueden dar de baja postulaciones aceptadas",
    )
    api.patch.mockRejectedValue(error)

    await expect(darDeBajaPostulacion("postulacion-1")).rejects.toBe(error)
  })
})

describe("obtenerPostulacionesColaborador", () => {
  it("incluye la fecha y el origen de la baja", async () => {
    api.get.mockResolvedValue({
      data: [
        {
          _id: "postulacion-1",
          proyecto: { id: "proyecto-1", titulo: "Mapa de humedales" },
          perfil: { id: "perfil-1", nombre: "Desarrollo del mapa" },
          estado: "BAJA",
          fechaPostulacion: "2026-10-01T00:00:00.000Z",
          fechaRevision: "2026-10-02T00:00:00.000Z",
          fechaBaja: "2026-10-05T00:00:00.000Z",
          origenBaja: "COLECTIVO",
          esAnonima: false,
        },
        {
          _id: "postulacion-2",
          proyecto: null,
          perfil: null,
          estado: "ACEPTADA",
          fechaPostulacion: "2026-10-01T00:00:00.000Z",
          fechaRevision: "2026-10-02T00:00:00.000Z",
          esAnonima: true,
        },
      ],
    })

    const [dadaDeBaja, aceptada] = await obtenerPostulacionesColaborador()

    expect(dadaDeBaja).toMatchObject({
      id: "postulacion-1",
      estado: "BAJA",
      fechaBaja: "2026-10-05T00:00:00.000Z",
      origenBaja: "COLECTIVO",
    })
    expect(aceptada).toMatchObject({ fechaBaja: null, origenBaja: null })
  })
})
