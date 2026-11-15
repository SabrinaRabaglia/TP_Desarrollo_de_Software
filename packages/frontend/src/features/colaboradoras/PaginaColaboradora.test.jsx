import { render, screen, within } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { AuthProvider } from "../../context/AuthContext"
import {
  obtenerColaboradora,
  obtenerMediosDeContacto,
} from "../../service/colaboradorasService"
import PaginaColaboradora from "./PaginaColaboradora"

jest.mock("../../service/colaboradorasService")

const colaboradora = {
  id: "p1",
  nombreFantasia: "anag",
  nombreCompleto: "Ana Gómez",
  pronombres: ["ella"],
  presentacion: "Desarrolladora frontend",
  habilidades: ["JavaScript", "React"],
  cuentas: [{ tipo: "GITHUB", usuario: "anagomez" }],
}

const iniciarSesionCon = (usuario) => {
  localStorage.setItem("sesion", JSON.stringify({ token: "token", usuario }))
}

const iniciarSesionComoColectivo = () =>
  iniciarSesionCon({
    id: "u1",
    email: "huerta@colectivo.test",
    rol: "COLECTIVO",
    entidad: { id: "c1", nombre: "Huerta Comunitaria Sur" },
  })

const renderizarEn = (ruta) =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path="/colaboradoras/:id" element={<PaginaColaboradora />} />
          <Route path="/login" element={<h1>Ingresar</h1>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )

const seccionDeContacto = () =>
  screen.findByRole("region", { name: "Datos de contacto" })

beforeEach(() => {
  obtenerColaboradora.mockResolvedValue(colaboradora)
})

afterEach(() => {
  localStorage.clear()
})

describe("PaginaColaboradora", () => {
  test("con acceso muestra el perfil público y los medios de contacto con su valor", async () => {
    iniciarSesionComoColectivo()
    obtenerMediosDeContacto.mockResolvedValue([
      { id: "m1", tipo: "EMAIL", valor: "ana.gomez@example.com" },
      { id: "m2", tipo: "WHATSAPP", valor: "+54 9 11 2345-6789" },
    ])

    renderizarEn("/colaboradoras/p1")

    expect(
      await screen.findByRole("heading", { name: "anag" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Ana Gómez")).toBeInTheDocument()
    expect(screen.getByText("Pronombres: ella")).toBeInTheDocument()
    expect(screen.getByText("Desarrolladora frontend")).toBeInTheDocument()
    expect(screen.getByText("React")).toBeInTheDocument()
    expect(screen.getByText("GitHub")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "anagomez" })).toHaveAttribute(
      "href",
      "https://github.com/anagomez",
    )

    expect(
      await screen.findByRole("link", { name: "ana.gomez@example.com" }),
    ).toHaveAttribute("href", "mailto:ana.gomez@example.com")
    expect(screen.getByText("WhatsApp")).toBeInTheDocument()
    expect(screen.getByText("+54 9 11 2345-6789")).toBeInTheDocument()
    expect(obtenerColaboradora).toHaveBeenCalledWith("p1")
    expect(obtenerMediosDeContacto).toHaveBeenCalledWith("p1")
    expect(
      screen.queryByRole("link", { name: "Editar mi perfil" }),
    ).not.toBeInTheDocument()
  })

  test("a la propia persona le ofrece editar su perfil", async () => {
    iniciarSesionCon({
      id: "u2",
      email: "anag@persona.test",
      rol: "PERSONA_COLABORADORA",
      entidad: { id: "p1", nombre: "anag" },
    })
    obtenerMediosDeContacto.mockResolvedValue([])

    renderizarEn("/colaboradoras/p1")

    expect(
      await screen.findByRole("link", { name: "Editar mi perfil" }),
    ).toHaveAttribute("href", "/mi-perfil")
  })

  test("sin acceso muestra el mensaje del backend y conserva el perfil público", async () => {
    iniciarSesionComoColectivo()
    obtenerMediosDeContacto.mockRejectedValue({
      response: {
        status: 403,
        data: {
          message: "No tenés acceso a los datos de contacto de esta persona",
        },
      },
    })

    renderizarEn("/colaboradoras/p1")

    const seccion = await seccionDeContacto()
    expect(
      await within(seccion).findByText(
        "No tenés acceso a los datos de contacto de esta persona",
      ),
    ).toBeInTheDocument()
    expect(
      within(seccion).queryByRole("button", { name: "Reintentar" }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "anag" })).toBeInTheDocument()
    expect(screen.getByText("Desarrolladora frontend")).toBeInTheDocument()
  })

  test("sin sesión invita a ingresar y no pide los medios de contacto", async () => {
    renderizarEn("/colaboradoras/p1")

    const seccion = await seccionDeContacto()
    expect(
      within(seccion).getByRole("link", {
        name: "Ingresá para ver los datos de contacto",
      }),
    ).toHaveAttribute("href", "/login")
    expect(obtenerMediosDeContacto).not.toHaveBeenCalled()
  })
})
