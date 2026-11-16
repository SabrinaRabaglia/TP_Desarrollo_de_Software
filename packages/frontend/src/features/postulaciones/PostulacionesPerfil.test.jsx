import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { AuthProvider } from "../../context/AuthContext"
import { ProveedorDeAvisos } from "../../context/AvisosContext"
import {
  aceptarPostulacion,
  darDeBajaPostulacion,
  obtenerPostulacionesPerfil,
  rechazarPostulacion,
} from "../../service/postulacionesService"
import { obtenerResumenDelPerfil } from "../../service/proyectosService"
import PostulacionesPerfil from "./PostulacionesPerfil"

jest.mock("../../service/proyectosService", () => ({
  ...jest.requireActual("../../service/proyectosService"),
  obtenerResumenDelPerfil: jest.fn(),
}))

jest.mock("../../service/postulacionesService", () => ({
  ...jest.requireActual("../../service/postulacionesService"),
  obtenerPostulacionesPerfil: jest.fn(),
  aceptarPostulacion: jest.fn(),
  rechazarPostulacion: jest.fn(),
  darDeBajaPostulacion: jest.fn(),
}))

const ADVERTENCIA =
  "La persona deja de colaborar en este perfil y no podrá volver a postularse. Esta acción no se puede deshacer."

const postulacion = (datos) => ({
  id: "po1",
  proyecto: null,
  perfil: null,
  personaColaboradora: {
    id: "p1",
    nombreFantasia: "anag",
    nombreCompleto: "Ana Gómez",
    pronombres: [],
    presentacion: "Desarrolladora frontend",
    habilidades: ["JavaScript"],
    cuentas: [],
    mediosDeContacto: [
      { tipo: "EMAIL", valor: "ana.gomez@example.com" },
      { tipo: "TELEGRAM", valor: "987654321" },
    ],
  },
  estado: "ACEPTADA",
  fechaPostulacion: "2026-09-10T00:00:00.000Z",
  fechaRevision: "2026-09-12T12:00:00.000Z",
  fechaBaja: null,
  origenBaja: null,
  esAnonima: false,
  ...datos,
})

const aceptada = postulacion({})
const desanotada = postulacion({
  estado: "BAJA",
  fechaBaja: "2026-11-15T10:00:00.000Z",
  origenBaja: "COLECTIVO",
  personaColaboradora: {
    ...aceptada.personaColaboradora,
    mediosDeContacto: [],
  },
})
// Sin aceptar, el back no manda los medios de contacto
const pendiente = postulacion({
  id: "po2",
  estado: "PENDIENTE",
  fechaRevision: null,
  personaColaboradora: {
    ...aceptada.personaColaboradora,
    id: "p2",
    nombreFantasia: "Nube",
    nombreCompleto: null,
    mediosDeContacto: [],
  },
})

const renderizar = () => {
  localStorage.setItem(
    "sesion",
    JSON.stringify({
      token: "token",
      usuario: {
        id: "u1",
        email: "huerta@colectivo.test",
        rol: "COLECTIVO",
        entidad: { id: "c1", nombre: "Huerta Comunitaria Sur" },
      },
    }),
  )
  return render(
    <AuthProvider>
      <ProveedorDeAvisos>
        <MemoryRouter
          initialEntries={["/proyectos/pr1/perfiles/pe1/postulaciones"]}
        >
          <Routes>
            <Route
              path="/proyectos/:proyectoId/perfiles/:perfilId/postulaciones"
              element={<PostulacionesPerfil />}
            />
          </Routes>
        </MemoryRouter>
      </ProveedorDeAvisos>
    </AuthProvider>,
  )
}

const tarjetaDe = async (nombre) =>
  (await screen.findByRole("link", { name: nombre })).closest("li")

// El estado se lee en el chip ("Baja" también es el nombre de una fecha)
const estadoEn = (contenedor, estado) =>
  within(contenedor).getByText(estado, { selector: ".MuiChip-label" })

const elegir = async (boton) => {
  await userEvent.click(await screen.findByRole("button", { name: boton }))
  return screen.getByRole("dialog")
}

const esperarQueCierreElDialogo = () =>
  waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())

beforeEach(() => {
  obtenerResumenDelPerfil.mockResolvedValue({
    proyecto: { id: "pr1", titulo: "Sitio web de la huerta" },
    perfil: { nombre: "Frontend", limite: 1, aceptadas: 0 },
  })
})

afterEach(() => {
  localStorage.clear()
})

describe("PostulacionesPerfil", () => {
  test("muestra cada estado y solo las aceptadas se pueden desanotar", async () => {
    obtenerPostulacionesPerfil.mockResolvedValue([
      aceptada,
      pendiente,
      postulacion({ id: "po3", estado: "RECHAZADA" }),
      { ...desanotada, id: "po4" },
    ])

    renderizar()

    await screen.findByRole("link", { name: "Nube" })
    for (const estado of ["Aceptada", "Pendiente", "Rechazada", "Baja"]) {
      expect(estadoEn(document.body, estado)).toBeInTheDocument()
    }
    expect(obtenerPostulacionesPerfil).toHaveBeenCalledWith("pr1", "pe1")
    expect(screen.getAllByRole("button", { name: "Desanotar" })).toHaveLength(1)
    expect(screen.getAllByRole("button", { name: "Aceptar" })).toHaveLength(1)
  })

  test("con un solo pedido muestra las migas y los cupos del perfil", async () => {
    obtenerPostulacionesPerfil.mockResolvedValue([pendiente])

    renderizar()

    expect(
      await screen.findByText("1 cupo disponible de 1"),
    ).toBeInTheDocument()
    const migas = screen.getByRole("navigation", { name: "Ubicación" })
    expect(within(migas).getByText("Frontend")).toBeInTheDocument()
    expect(
      within(migas).getByRole("link", { name: "Sitio web de la huerta" }),
    ).toHaveAttribute("href", "/proyectos/pr1")
    expect(obtenerResumenDelPerfil).toHaveBeenCalledTimes(1)
    expect(obtenerResumenDelPerfil).toHaveBeenCalledWith("pr1", "pe1")
  })

  test("los datos de contacto aparecen solo en la aceptada y Telegram no muestra el id", async () => {
    obtenerPostulacionesPerfil.mockResolvedValue([aceptada, pendiente])

    renderizar()

    const deAna = await tarjetaDe("anag")
    expect(within(deAna).getByText("Ana Gómez")).toBeInTheDocument()
    expect(
      within(deAna).getByRole("link", { name: "ana.gomez@example.com" }),
    ).toHaveAttribute("href", "mailto:ana.gomez@example.com")
    expect(
      within(deAna).getByText("Solo para avisos de la plataforma"),
    ).toBeInTheDocument()
    expect(screen.queryByText(/987654321/)).not.toBeInTheDocument()

    const deNube = await tarjetaDe("Nube")
    expect(
      within(deNube).queryByRole("heading", { name: "Datos de contacto" }),
    ).not.toBeInTheDocument()
  })

  test("aceptar pide confirmación, avisa y recarga la lista", async () => {
    obtenerPostulacionesPerfil
      .mockResolvedValueOnce([pendiente])
      .mockResolvedValueOnce([{ ...pendiente, estado: "ACEPTADA" }])
    aceptarPostulacion.mockResolvedValue()

    renderizar()
    const dialogo = await elegir("Aceptar")
    expect(
      within(dialogo).getByRole("button", { name: "Sí, aceptar" }),
    ).toHaveClass("MuiButton-colorPrimary")
    await userEvent.click(
      within(dialogo).getByRole("button", { name: "Sí, aceptar" }),
    )

    expect(
      await screen.findByText(
        "Aceptaste a Nube. Ya podés ver sus datos de contacto.",
      ),
    ).toBeInTheDocument()
    expect(aceptarPostulacion).toHaveBeenCalledWith("po2")
    expect(obtenerPostulacionesPerfil).toHaveBeenCalledTimes(2)
    await esperarQueCierreElDialogo()
    expect(estadoEn(await tarjetaDe("Nube"), "Aceptada")).toBeInTheDocument()
  })

  test("si se llegó al límite, el error del back queda en la tarjeta", async () => {
    obtenerPostulacionesPerfil.mockResolvedValue([pendiente])
    aceptarPostulacion.mockRejectedValue({
      response: {
        data: {
          message: "Se alcanzó el límite de colaboradores para este perfil",
        },
      },
    })

    renderizar()
    const dialogo = await elegir("Aceptar")
    await userEvent.click(
      within(dialogo).getByRole("button", { name: "Sí, aceptar" }),
    )

    await esperarQueCierreElDialogo()
    const deNube = await tarjetaDe("Nube")
    expect(await within(deNube).findByRole("alert")).toHaveTextContent(
      "Se alcanzó el límite de colaboradores para este perfil",
    )
    expect(estadoEn(deNube, "Pendiente")).toBeInTheDocument()
    expect(screen.queryByText(/Aceptaste a/)).not.toBeInTheDocument()
    expect(obtenerPostulacionesPerfil).toHaveBeenCalledTimes(1)
  })

  test("rechazar avisa que no se puede deshacer", async () => {
    obtenerPostulacionesPerfil
      .mockResolvedValueOnce([pendiente])
      .mockResolvedValueOnce([{ ...pendiente, estado: "RECHAZADA" }])
    rechazarPostulacion.mockResolvedValue()

    renderizar()
    const dialogo = await elegir("Rechazar")
    expect(dialogo).toHaveTextContent(
      "Vas a rechazar la postulación de Nube. Esta acción no se puede deshacer.",
    )
    await userEvent.click(
      within(dialogo).getByRole("button", { name: "Sí, rechazar" }),
    )

    expect(
      await screen.findByText("Rechazaste la postulación de Nube."),
    ).toBeInTheDocument()
    expect(rechazarPostulacion).toHaveBeenCalledWith("po2")
  })

  test("desanotar pide confirmación avisando que es irreversible y recarga la lista", async () => {
    obtenerPostulacionesPerfil
      .mockResolvedValueOnce([aceptada])
      .mockResolvedValueOnce([desanotada])
    darDeBajaPostulacion.mockResolvedValue({
      id: "po1",
      estado: "BAJA",
      fechaBaja: desanotada.fechaBaja,
      origenBaja: "COLECTIVO",
    })

    renderizar()
    const dialogo = await elegir("Desanotar")
    expect(within(dialogo).getByText(ADVERTENCIA)).toBeInTheDocument()
    await userEvent.click(
      within(dialogo).getByRole("button", { name: "Desanotar" }),
    )

    expect(await screen.findByText("La desanotaste")).toBeInTheDocument()
    expect(
      screen.getByText("Desanotaste a anag del perfil."),
    ).toBeInTheDocument()
    expect(darDeBajaPostulacion).toHaveBeenCalledWith("po1")
    expect(aceptarPostulacion).not.toHaveBeenCalled()
    expect(rechazarPostulacion).not.toHaveBeenCalled()
    expect(obtenerPostulacionesPerfil).toHaveBeenCalledTimes(2)
    expect(estadoEn(await tarjetaDe("anag"), "Baja")).toBeInTheDocument()
    expect(
      screen.queryByText(/ana\.gomez@example\.com/),
    ).not.toBeInTheDocument()
  })

  test("al cancelar no desanota", async () => {
    obtenerPostulacionesPerfil.mockResolvedValue([aceptada])

    renderizar()
    await elegir("Desanotar")
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }))

    expect(darDeBajaPostulacion).not.toHaveBeenCalled()
    expect(obtenerPostulacionesPerfil).toHaveBeenCalledTimes(1)
  })

  test("si el back rechaza la desanotación, muestra su mensaje", async () => {
    obtenerPostulacionesPerfil.mockResolvedValue([aceptada])
    darDeBajaPostulacion.mockRejectedValue({
      response: {
        data: { message: "El proyecto no pertenece al colectivo autenticado" },
      },
    })

    renderizar()
    const dialogo = await elegir("Desanotar")
    await userEvent.click(
      within(dialogo).getByRole("button", { name: "Desanotar" }),
    )

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El proyecto no pertenece al colectivo autenticado",
    )
    await esperarQueCierreElDialogo()
    expect(obtenerPostulacionesPerfil).toHaveBeenCalledTimes(1)
    expect(estadoEn(await tarjetaDe("anag"), "Aceptada")).toBeInTheDocument()
  })

  test("una baja que dio la persona lo indica", async () => {
    obtenerPostulacionesPerfil.mockResolvedValue([
      { ...desanotada, origenBaja: "PERSONA_COLABORADORA" },
    ])

    renderizar()

    expect(await screen.findByText("Se dio de baja")).toBeInTheDocument()
  })

  test("mientras carga avisa que está cargando", () => {
    obtenerPostulacionesPerfil.mockReturnValue(new Promise(() => {}))

    renderizar()

    expect(screen.getByRole("status")).toHaveTextContent(
      "Cargando las postulaciones...",
    )
  })

  test("sin postulaciones lo dice", async () => {
    obtenerPostulacionesPerfil.mockResolvedValue([])

    renderizar()

    expect(
      await screen.findByRole("heading", {
        name: "Todavía no hay postulaciones",
      }),
    ).toBeInTheDocument()
  })
})
