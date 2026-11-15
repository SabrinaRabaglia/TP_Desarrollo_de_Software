import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { AuthProvider } from "../../context/AuthContext"
import { ProveedorDeAvisos } from "../../context/AvisosContext"
import { obtenerColaboradoresPerfil } from "../../service/colaboradorasService"
import {
  crearPostulacion,
  obtenerPostulacionesColaborador,
} from "../../service/postulacionesService"
import PerfilRequerido from "./PerfilRequerido"

jest.mock("../../service/colaboradorasService")
jest.mock("../../service/postulacionesService")

const perfil = {
  id: "p1",
  nombre: "Tester",
  descripcion: "Probar la app antes de cada entrega",
  compromiso: "4 horas por semana",
  modalidades: ["Gratuita"],
  habilidadesRequeridas: ["Testing manual"],
  habilidadesOpcionales: ["Cypress"],
  postulacionesAceptadas: [],
  limiteColaboraciones: 1,
}

const colaboradora = {
  id: "u1",
  rol: "PERSONA_COLABORADORA",
  nombre: "Nube",
  entidad: { id: "pc1" },
}

const iniciarSesionComo = (usuario) =>
  localStorage.setItem("sesion", JSON.stringify({ token: "token", usuario }))

const renderizar = (props = {}) =>
  render(
    <AuthProvider>
      <ProveedorDeAvisos>
        <MemoryRouter>
          <PerfilRequerido
            perfil={perfil}
            proyectoId="abc"
            proyectoAbierto
            esDueno={false}
            {...props}
          />
        </MemoryRouter>
      </ProveedorDeAvisos>
    </AuthProvider>,
  )

beforeEach(() => {
  obtenerPostulacionesColaborador.mockResolvedValue([])
})

afterEach(() => {
  localStorage.clear()
})

describe("PerfilRequerido", () => {
  test("sin sesión muestra el perfil y sus cupos, pero no deja postularse", () => {
    renderizar()

    expect(screen.getByRole("heading", { name: "Tester" })).toBeInTheDocument()
    expect(screen.getByText("1 cupo disponible de 1")).toBeInTheDocument()
    expect(screen.getByText("Testing manual")).toBeInTheDocument()
    expect(screen.getByText("Cypress")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Postularme" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: "Revisar postulaciones" }),
    ).not.toBeInTheDocument()
    expect(obtenerPostulacionesColaborador).not.toHaveBeenCalled()
    expect(obtenerColaboradoresPerfil).not.toHaveBeenCalled()
  })

  test("al postularse elige el anonimato y ve el aviso de éxito", async () => {
    iniciarSesionComo(colaboradora)
    crearPostulacion.mockResolvedValue()

    renderizar()

    userEvent.click(screen.getByRole("button", { name: "Postularme" }))
    userEvent.click(await screen.findByRole("button", { name: "No, pública" }))

    expect(
      await screen.findByText(
        "Tu postulación fue enviada. El colectivo la revisará a la brevedad.",
      ),
    ).toBeInTheDocument()
    expect(crearPostulacion).toHaveBeenCalledWith("abc", "p1", false)
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    )
    expect(screen.getByRole("button", { name: "Postularme" })).toBeDisabled()
    expect(
      screen.getByText("Ya te postulaste a este perfil."),
    ).toBeInTheDocument()
  })

  test("si el back rechaza la postulación muestra el motivo en la tarjeta", async () => {
    iniciarSesionComo(colaboradora)
    crearPostulacion.mockRejectedValue({
      response: {
        data: { message: "La búsqueda de este proyecto está cerrada" },
      },
    })

    renderizar()

    userEvent.click(screen.getByRole("button", { name: "Postularme" }))
    userEvent.click(await screen.findByRole("button", { name: "Sí, anónima" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "La búsqueda de este proyecto está cerrada",
    )
    expect(crearPostulacion).toHaveBeenCalledWith("abc", "p1", true)
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    )
    expect(
      screen.queryByText(/Tu postulación fue enviada/),
    ).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Postularme" })).toBeEnabled()
  })

  test("si ya se postuló a este perfil no puede volver a hacerlo", async () => {
    iniciarSesionComo(colaboradora)
    obtenerPostulacionesColaborador.mockResolvedValue([
      { proyecto: { id: "abc" }, perfil: { id: "p1" }, estado: "PENDIENTE" },
    ])

    renderizar()

    expect(
      await screen.findByText("Ya te postulaste a este perfil."),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Postularme" })).toBeDisabled()
  })

  test("con el proyecto cerrado avisa que la búsqueda terminó", () => {
    iniciarSesionComo(colaboradora)

    renderizar({ proyectoAbierto: false })

    expect(screen.getByText("Búsqueda cerrada")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Postularme" })).toBeDisabled()
    expect(
      screen.getByText("La búsqueda de este proyecto está cerrada."),
    ).toBeInTheDocument()
  })

  test("muestra quién ocupa el rol sin nombrar a las anónimas", async () => {
    obtenerColaboradoresPerfil.mockResolvedValue([
      { esAnonima: true },
      { id: "pc2", esAnonima: false, nombreFantasia: "Pampa" },
    ])

    renderizar({
      perfil: {
        ...perfil,
        postulacionesAceptadas: ["post1", "post2"],
        limiteColaboraciones: 2,
      },
    })

    expect(await screen.findByText("Contribución anónima")).toBeInTheDocument()
    expect(screen.getByText("Pampa")).toBeInTheDocument()
    expect(screen.getByText("Cupo completo (2 de 2)")).toBeInTheDocument()
    expect(obtenerColaboradoresPerfil).toHaveBeenCalledWith("abc", "p1")
  })

  test("el colectivo dueño puede revisar postulaciones y buscar candidatas", () => {
    renderizar({ esDueno: true })

    expect(
      screen.getByRole("link", { name: "Revisar postulaciones" }),
    ).toHaveAttribute("href", "/proyectos/abc/perfiles/p1/postulaciones")
    expect(
      screen.getByRole("link", { name: "Ver candidatas" }),
    ).toHaveAttribute("href", "/proyectos/abc/perfiles/p1/candidatas")
  })
})
