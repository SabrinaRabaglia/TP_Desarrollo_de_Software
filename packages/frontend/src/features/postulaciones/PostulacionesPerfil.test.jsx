import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { AuthProvider } from "../../context/AuthContext"
import {
  aceptarPostulacion,
  darDeBajaPostulacion,
  obtenerPostulacionesPerfil,
  rechazarPostulacion,
} from "../../service/postulacionesService"
import PostulacionesPerfil from "./PostulacionesPerfil"

jest.mock("../../service/proyectosService", () => ({
  obtenerNombresDelPerfil: async () => ({
    proyecto: "Sitio web de la huerta",
    perfil: "Frontend",
  }),
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
    mediosDeContacto: [{ tipo: "EMAIL", valor: "ana.gomez@example.com" }],
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
    </AuthProvider>,
  )
}

const abrirDesanotar = async () => {
  await userEvent.click(
    await screen.findByRole("button", { name: "Desanotar" }),
  )
  return screen.getByRole("dialog")
}

afterEach(() => {
  localStorage.clear()
})

describe("PostulacionesPerfil", () => {
  test("solo las aceptadas se pueden desanotar", async () => {
    obtenerPostulacionesPerfil.mockResolvedValue([
      aceptada,
      postulacion({ id: "po2", estado: "PENDIENTE", fechaRevision: null }),
      postulacion({ id: "po3", estado: "RECHAZADA" }),
      { ...desanotada, id: "po4" },
    ])

    renderizar()

    for (const estado of ["Aceptada", "Pendiente", "Rechazada", "Baja"]) {
      expect(await screen.findByText(estado)).toBeInTheDocument()
    }
    expect(obtenerPostulacionesPerfil).toHaveBeenCalledWith("pr1", "pe1")
    expect(screen.getAllByRole("button", { name: "Desanotar" })).toHaveLength(1)
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
    const dialogo = await abrirDesanotar()
    expect(within(dialogo).getByText(ADVERTENCIA)).toBeInTheDocument()
    await userEvent.click(
      within(dialogo).getByRole("button", { name: "Desanotar" }),
    )

    expect(await screen.findByText("La desanotaste")).toBeInTheDocument()
    expect(darDeBajaPostulacion).toHaveBeenCalledWith("po1")
    expect(aceptarPostulacion).not.toHaveBeenCalled()
    expect(rechazarPostulacion).not.toHaveBeenCalled()
    expect(obtenerPostulacionesPerfil).toHaveBeenCalledTimes(2)
    expect(screen.getByText("Baja")).toBeInTheDocument()
    expect(
      screen.queryByText(/ana\.gomez@example\.com/),
    ).not.toBeInTheDocument()
  })

  test("al cancelar no desanota", async () => {
    obtenerPostulacionesPerfil.mockResolvedValue([aceptada])

    renderizar()
    await abrirDesanotar()
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
    const dialogo = await abrirDesanotar()
    await userEvent.click(
      within(dialogo).getByRole("button", { name: "Desanotar" }),
    )

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El proyecto no pertenece al colectivo autenticado",
    )
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(obtenerPostulacionesPerfil).toHaveBeenCalledTimes(1)
    expect(screen.getByText("Aceptada")).toBeInTheDocument()
  })

  test("una baja que dio la persona lo indica", async () => {
    obtenerPostulacionesPerfil.mockResolvedValue([
      { ...desanotada, origenBaja: "PERSONA_COLABORADORA" },
    ])

    renderizar()

    expect(await screen.findByText("Se dio de baja")).toBeInTheDocument()
  })
})
