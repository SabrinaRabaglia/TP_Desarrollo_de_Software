import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { AuthProvider } from "../../context/AuthContext"
import { ProveedorDeAvisos } from "../../context/AvisosContext"
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
  "La baja es permanente: vas a dejar de colaborar en el perfil Desarrollo frontend y no vas a poder volver a postularte. Esta acción no se puede deshacer."

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
      <ProveedorDeAvisos>
        <MemoryRouter>
          <PaginaPostulaciones />
        </MemoryRouter>
      </ProveedorDeAvisos>
    </AuthProvider>,
  )
}

const tarjetaDe = async (titulo) =>
  (await screen.findByText(titulo)).closest("li")

// El estado se lee en el chip (la palabra "Baja" también es una fecha)
const estadoEn = (tarjeta, estado) =>
  within(tarjeta).getByText(estado, { selector: ".MuiChip-label" })

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
    expect(estadoEn(delColectivo, "Baja")).toBeInTheDocument()
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
      within(dialogo).getByRole("button", { name: "Sí, darme de baja" }),
    )

    expect(darDeBajaPostulacion).toHaveBeenCalledWith("po1")
    const tarjeta = await tarjetaDe("Sitio web de la huerta")
    expect(
      await within(tarjeta).findByText("Te diste de baja"),
    ).toBeInTheDocument()
    expect(estadoEn(tarjeta, "Baja")).toBeInTheDocument()
    // Conserva el proyecto y el perfil, que la respuesta de la baja no trae.
    expect(tarjeta).toHaveTextContent("Perfil: Desarrollo frontend")
    expect(
      screen.getByText("Te diste de baja del perfil Desarrollo frontend."),
    ).toBeInTheDocument()
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
      estadoEn(await tarjetaDe("Sitio web de la huerta"), "Aceptada"),
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
        name: "Sí, darme de baja",
      }),
    )

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Solo se pueden dar de baja postulaciones aceptadas",
    )
    expect(
      estadoEn(await tarjetaDe("Sitio web de la huerta"), "Aceptada"),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Darme de baja" })).toBeEnabled()
  })

  test("marca las anónimas y lleva al proyecto de cada una", async () => {
    obtenerPostulacionesColaborador.mockResolvedValue([
      { ...pendiente, esAnonima: true },
    ])

    renderizar()

    const tarjeta = await tarjetaDe("API de donaciones")
    expect(within(tarjeta).getByText("Anónima")).toBeInTheDocument()
    expect(estadoEn(tarjeta, "Pendiente")).toBeInTheDocument()
    expect(
      within(tarjeta).getByRole("link", { name: "API de donaciones" }),
    ).toHaveAttribute("href", "/proyectos/pr2")
  })

  test("mientras carga avisa que está cargando", () => {
    obtenerPostulacionesColaborador.mockReturnValue(new Promise(() => {}))

    renderizar()

    expect(screen.getByRole("status")).toHaveTextContent(
      "Cargando tus postulaciones...",
    )
  })

  test("sin postulaciones invita a ver proyectos", async () => {
    obtenerPostulacionesColaborador.mockResolvedValue([])

    renderizar()

    expect(
      await screen.findByRole("heading", { name: "Todavía no te postulaste" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Ver proyectos" })).toHaveAttribute(
      "href",
      "/",
    )
  })
})
