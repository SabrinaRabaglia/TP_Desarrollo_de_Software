import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { AuthProvider } from "../../context/AuthContext"
import {
  darDeBajaPostulacion,
  obtenerPostulacionesColaborador,
} from "../../service/postulacionesService"
import PaginaPostulaciones from "./PaginaPostulaciones"

jest.mock("../../service/postulacionesService", () => ({
  ...jest.requireActual("../../service/postulacionesService"),
  obtenerPostulacionesColaborador: jest.fn(),
  darDeBajaPostulacion: jest.fn(),
}))

const ADVERTENCIA =
  "Vas a dejar de colaborar en este perfil y no vas a poder volver a postularte. Esta acción no se puede deshacer."

const postulacion = (datos) => ({
  proyecto: { id: "pr1", titulo: "Sitio web de la huerta" },
  perfil: { id: "pe1", nombre: "Desarrollo frontend" },
  fechaPostulacion: "2026-09-10T00:00:00.000Z",
  fechaRevision: "2026-09-12T12:00:00.000Z",
  fechaBaja: null,
  origenBaja: null,
  esAnonima: false,
  ...datos,
})

const aceptada = postulacion({ id: "po1", estado: "ACEPTADA" })
const pendiente = postulacion({
  id: "po2",
  estado: "PENDIENTE",
  proyecto: { id: "pr2", titulo: "API de donaciones" },
  fechaRevision: null,
})
const desanotada = postulacion({
  id: "po3",
  estado: "BAJA",
  proyecto: { id: "pr3", titulo: "Mapa de humedales" },
  fechaBaja: "2026-10-05T00:00:00.000Z",
  origenBaja: "COLECTIVO",
})

const renderizar = () => {
  localStorage.setItem(
    "sesion",
    JSON.stringify({
      token: "token",
      usuario: {
        id: "u2",
        email: "anag@persona.test",
        rol: "PERSONA_COLABORADORA",
        entidad: { id: "p1", nombre: "anag" },
      },
    }),
  )
  return render(
    <AuthProvider>
      <MemoryRouter>
        <PaginaPostulaciones />
      </MemoryRouter>
    </AuthProvider>,
  )
}

const tarjetaDe = async (titulo) =>
  (await screen.findByText(titulo)).closest("li")

afterEach(() => {
  localStorage.clear()
})

describe("PaginaPostulaciones", () => {
  test("lista las postulaciones y solo las aceptadas se pueden dar de baja", async () => {
    obtenerPostulacionesColaborador.mockResolvedValue([
      aceptada,
      pendiente,
      desanotada,
    ])

    renderizar()

    expect(await screen.findAllByRole("listitem")).toHaveLength(3)
    expect(
      within(await tarjetaDe("Sitio web de la huerta")).getByRole("button", {
        name: "Darme de baja",
      }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole("button", { name: "Darme de baja" }),
    ).toHaveLength(1)
  })

  test("las dadas de baja muestran el estado y quién la dio", async () => {
    obtenerPostulacionesColaborador.mockResolvedValue([
      desanotada,
      postulacion({
        id: "po4",
        estado: "BAJA",
        proyecto: { id: "pr4", titulo: "Radio comunitaria" },
        fechaBaja: "2026-10-07T00:00:00.000Z",
        origenBaja: "PERSONA_COLABORADORA",
      }),
    ])

    renderizar()

    const delColectivo = await tarjetaDe("Mapa de humedales")
    expect(within(delColectivo).getByText("Baja")).toBeInTheDocument()
    expect(
      within(delColectivo).getByText("Te desanotó el colectivo"),
    ).toBeInTheDocument()
    expect(
      within(delColectivo).getByText(
        new Date("2026-10-05T00:00:00.000Z").toLocaleDateString("es-AR"),
      ),
    ).toBeInTheDocument()
    expect(
      within(await tarjetaDe("Radio comunitaria")).getByText(
        "Te diste de baja",
      ),
    ).toBeInTheDocument()
  })

  test("al confirmar la baja, avisa que es irreversible y actualiza la postulación", async () => {
    obtenerPostulacionesColaborador.mockResolvedValue([aceptada])
    darDeBajaPostulacion.mockResolvedValue({
      id: "po1",
      estado: "BAJA",
      fechaBaja: "2026-11-15T10:00:00.000Z",
      origenBaja: "PERSONA_COLABORADORA",
    })

    renderizar()
    await userEvent.click(
      await screen.findByRole("button", { name: "Darme de baja" }),
    )

    const dialogo = screen.getByRole("dialog")
    expect(within(dialogo).getByText(ADVERTENCIA)).toBeInTheDocument()
    await userEvent.click(
      within(dialogo).getByRole("button", { name: "Darme de baja" }),
    )

    expect(darDeBajaPostulacion).toHaveBeenCalledWith("po1")
    const tarjeta = await tarjetaDe("Sitio web de la huerta")
    expect(
      await within(tarjeta).findByText("Te diste de baja"),
    ).toBeInTheDocument()
    expect(within(tarjeta).getByText("Baja")).toBeInTheDocument()
    // Conserva el proyecto y el perfil, que la respuesta de la baja no trae.
    expect(tarjeta).toHaveTextContent("Perfil: Desarrollo frontend")
    expect(
      within(tarjeta).queryByRole("button", { name: "Darme de baja" }),
    ).not.toBeInTheDocument()
  })

  test("al cancelar no da de baja nada", async () => {
    obtenerPostulacionesColaborador.mockResolvedValue([aceptada])

    renderizar()
    await userEvent.click(
      await screen.findByRole("button", { name: "Darme de baja" }),
    )
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }))

    expect(darDeBajaPostulacion).not.toHaveBeenCalled()
    expect(
      within(await tarjetaDe("Sitio web de la huerta")).getByText("Aceptada"),
    ).toBeInTheDocument()
  })

  test("si el back rechaza la baja, muestra su mensaje y la postulación sigue aceptada", async () => {
    obtenerPostulacionesColaborador.mockResolvedValue([aceptada])
    darDeBajaPostulacion.mockRejectedValue({
      isAxiosError: true,
      response: {
        data: { message: "Solo se pueden dar de baja postulaciones aceptadas" },
      },
    })

    renderizar()
    await userEvent.click(
      await screen.findByRole("button", { name: "Darme de baja" }),
    )
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Darme de baja",
      }),
    )

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Solo se pueden dar de baja postulaciones aceptadas",
    )
    expect(
      within(await tarjetaDe("Sitio web de la huerta")).getByText("Aceptada"),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Darme de baja" })).toBeEnabled()
  })
})
