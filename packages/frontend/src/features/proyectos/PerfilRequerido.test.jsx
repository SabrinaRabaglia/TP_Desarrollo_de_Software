import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { AuthProvider } from "../../context/AuthContext"
import { ProveedorDeAvisos } from "../../context/AvisosContext"
import { obtenerColaboradoresPerfil } from "../../service/colaboradorasService"
import { obtenerHabilidades } from "../../service/habilidadesService"
import {
  crearPostulacion,
  obtenerPostulacionesColaborador,
} from "../../service/postulacionesService"
import { eliminarPerfil, modificarPerfil } from "../../service/proyectosService"
import PerfilRequerido from "./PerfilRequerido"

jest.mock("../../service/colaboradorasService")
jest.mock("../../service/habilidadesService")
jest.mock("../../service/postulacionesService")
jest.mock("../../service/proyectosService", () => ({
  ...jest.requireActual("../../service/proyectosService"),
  eliminarPerfil: jest.fn(),
  modificarPerfil: jest.fn(),
}))

const perfil = {
  id: "p1",
  nombre: "Tester",
  descripcion: "Probar la app antes de cada entrega",
  compromiso: "4 horas por semana",
  cantidadHoras: 4,
  unidadCompromiso: "HORAS_SEMANALES",
  modalidades: ["Gratuita"],
  modalidadesColaboracion: ["GRATUITA"],
  habilidadesRequeridas: [{ id: "h1", titulo: "Testing manual" }],
  habilidadesOpcionales: [{ id: "h2", titulo: "Cypress" }],
  postulacionesAceptadas: [],
  limiteColaboraciones: 1,
  busquedaAbierta: true,
  busquedaAbiertaHasta: null,
}

const cerradaAMano = { ...perfil, busquedaAbierta: false }
const vencida = {
  ...perfil,
  busquedaAbiertaHasta: new Date(2020, 0, 15, 23, 59, 59),
}

const colaboradora = {
  id: "u1",
  rol: "PERSONA_COLABORADORA",
  nombre: "Nube",
  entidad: { id: "pc1" },
}

const iniciarSesionComo = (usuario) =>
  localStorage.setItem("sesion", JSON.stringify({ token: "token", usuario }))

const alModificar = jest.fn()

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
            alModificar={alModificar}
            {...props}
          />
        </MemoryRouter>
      </ProveedorDeAvisos>
    </AuthProvider>,
  )

beforeEach(() => {
  obtenerPostulacionesColaborador.mockResolvedValue([])
  obtenerHabilidades.mockResolvedValue([
    { id: "h1", titulo: "Testing manual" },
    { id: "h2", titulo: "Cypress" },
  ])
  modificarPerfil.mockResolvedValue()
  eliminarPerfil.mockResolvedValue()
  alModificar.mockResolvedValue()
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

  test("si la búsqueda se cerró con la pantalla abierta, el motivo del back queda en la tarjeta", async () => {
    iniciarSesionComo(colaboradora)
    crearPostulacion.mockRejectedValue({
      response: {
        status: 409,
        data: {
          message:
            "La búsqueda de colaboraciones para este perfil está cerrada.",
        },
      },
    })

    renderizar()

    userEvent.click(screen.getByRole("button", { name: "Postularme" }))
    userEvent.click(await screen.findByRole("button", { name: "Sí, anónima" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "La búsqueda de colaboraciones para este perfil está cerrada.",
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

  test.each([
    ["el colectivo la cerró", cerradaAMano],
    ["pasó la fecha límite", vencida],
  ])(
    "si %s muestra la búsqueda cerrada y no deja postularse",
    (_motivo, perfilCerrado) => {
      iniciarSesionComo(colaboradora)

      renderizar({ perfil: perfilCerrado })

      expect(screen.getByText("Búsqueda cerrada")).toBeInTheDocument()
      expect(
        screen.queryByText("1 cupo disponible de 1"),
      ).not.toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Postularme" })).toBeDisabled()
      expect(
        screen.getByText("La búsqueda de este perfil está cerrada."),
      ).toBeInTheDocument()
    },
  )

  test("con fecha límite por venir dice hasta cuándo está abierta la búsqueda", () => {
    iniciarSesionComo(colaboradora)

    renderizar({
      perfil: {
        ...perfil,
        busquedaAbiertaHasta: new Date(2099, 11, 31, 23, 59, 59),
      },
    })

    expect(
      screen.getByText("Búsqueda abierta hasta el 31/12/2099"),
    ).toBeInTheDocument()
    expect(screen.getByText("1 cupo disponible de 1")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Postularme" })).toBeEnabled()
  })

  test("un perfil sin límite lo dice en los cupos", () => {
    renderizar({ perfil: { ...perfil, limiteColaboraciones: null } })

    expect(screen.getByText("Sin límite de cupos")).toBeInTheDocument()
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

  test("quien no es el colectivo dueño no puede gestionar la búsqueda ni editar o quitar el perfil", () => {
    iniciarSesionComo(colaboradora)

    renderizar()

    expect(
      screen.queryByRole("button", { name: "Quitar perfil" }),
    ).not.toBeInTheDocument()

    expect(
      screen.queryByRole("button", { name: "Cerrar búsqueda" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Reabrir búsqueda" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Editar perfil" }),
    ).not.toBeInTheDocument()
  })

  test("con el proyecto cerrado el dueño ya no gestiona la búsqueda ni edita el perfil", () => {
    renderizar({ esDueno: true, proyectoAbierto: false })

    expect(
      screen.getByRole("link", { name: "Revisar postulaciones" }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Reabrir búsqueda" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Editar perfil" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Quitar perfil" }),
    ).not.toBeInTheDocument()
  })

  test("el dueño cierra la búsqueda después de confirmar", async () => {
    renderizar({ esDueno: true })

    userEvent.click(screen.getByRole("button", { name: "Cerrar búsqueda" }))

    const dialogo = await screen.findByRole("dialog", {
      name: "Cerrar búsqueda",
    })
    expect(dialogo).toHaveTextContent(
      "Las personas no van a poder postularse al perfil Tester mientras la búsqueda esté cerrada. Podés reabrirla cuando quieras.",
    )
    expect(modificarPerfil).not.toHaveBeenCalled()

    userEvent.click(
      within(dialogo).getByRole("button", { name: "Cerrar búsqueda" }),
    )

    expect(
      await screen.findByText("Cerraste la búsqueda del perfil Tester."),
    ).toBeInTheDocument()
    expect(modificarPerfil).toHaveBeenCalledWith("abc", "p1", {
      busquedaAbierta: false,
    })
    expect(alModificar).toHaveBeenCalledTimes(1)
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    )
  })

  test("si cancela, la búsqueda sigue abierta", async () => {
    renderizar({ esDueno: true })

    userEvent.click(screen.getByRole("button", { name: "Cerrar búsqueda" }))
    userEvent.click(await screen.findByRole("button", { name: "Cancelar" }))

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    )
    expect(modificarPerfil).not.toHaveBeenCalled()
  })

  test("el dueño reabre una búsqueda que cerró a mano", async () => {
    renderizar({ esDueno: true, perfil: cerradaAMano })

    expect(
      screen.queryByRole("button", { name: "Cerrar búsqueda" }),
    ).not.toBeInTheDocument()
    userEvent.click(screen.getByRole("button", { name: "Reabrir búsqueda" }))

    expect(
      await screen.findByText("Reabriste la búsqueda del perfil Tester."),
    ).toBeInTheDocument()
    expect(modificarPerfil).toHaveBeenCalledWith("abc", "p1", {
      busquedaAbierta: true,
    })
    expect(alModificar).toHaveBeenCalledTimes(1)
  })

  test("al reabrir una búsqueda vencida también le quita la fecha límite", async () => {
    renderizar({ esDueno: true, perfil: vencida })

    expect(
      screen.getByText("La búsqueda venció el 15/01/2020"),
    ).toBeInTheDocument()
    userEvent.click(screen.getByRole("button", { name: "Reabrir búsqueda" }))

    expect(
      await screen.findByText(
        "Reabriste la búsqueda del perfil Tester. Ya no tiene fecha límite.",
      ),
    ).toBeInTheDocument()
    expect(modificarPerfil).toHaveBeenCalledWith("abc", "p1", {
      busquedaAbierta: true,
      busquedaAbiertaHasta: null,
    })
  })

  test("si el back rechaza el cambio de la búsqueda muestra el motivo en la tarjeta", async () => {
    modificarPerfil.mockRejectedValue({
      response: {
        status: 409,
        data: { message: "El proyecto está cerrado." },
      },
    })

    renderizar({ esDueno: true, perfil: cerradaAMano })

    userEvent.click(screen.getByRole("button", { name: "Reabrir búsqueda" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El proyecto está cerrado.",
    )
    expect(alModificar).not.toHaveBeenCalled()
    expect(screen.queryByText(/Reabriste la búsqueda/)).not.toBeInTheDocument()
  })

  test("el dueño edita el perfil, ve el aviso y la tarjeta pide los datos nuevos", async () => {
    renderizar({ esDueno: true })

    userEvent.click(screen.getByRole("button", { name: "Editar perfil" }))

    const dialogo = await screen.findByRole("dialog", {
      name: "Editar el perfil Tester",
    })
    const limite = await within(dialogo).findByLabelText(
      "Límite de colaboraciones",
    )
    userEvent.clear(limite)
    userEvent.type(limite, "5")
    userEvent.click(within(dialogo).getByRole("button", { name: "Guardar" }))

    expect(
      await screen.findByText("Guardaste los cambios del perfil Tester."),
    ).toBeInTheDocument()
    expect(modificarPerfil).toHaveBeenCalledWith("abc", "p1", {
      limiteColaboraciones: 5,
    })
    expect(alModificar).toHaveBeenCalledTimes(1)
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    )
  })

  test("el dueño quita el perfil después de confirmar que no se puede deshacer", async () => {
    renderizar({ esDueno: true })

    userEvent.click(screen.getByRole("button", { name: "Quitar perfil" }))

    const dialogo = await screen.findByRole("dialog", {
      name: "Quitar perfil",
    })
    expect(dialogo).toHaveTextContent(
      "Vas a quitar el perfil Tester de este proyecto. Esta acción no se puede deshacer.",
    )
    expect(eliminarPerfil).not.toHaveBeenCalled()

    userEvent.click(within(dialogo).getByRole("button", { name: "Sí, quitar" }))

    expect(
      await screen.findByText("Quitaste el perfil Tester del proyecto."),
    ).toBeInTheDocument()
    expect(eliminarPerfil).toHaveBeenCalledWith("abc", "p1")
    expect(alModificar).toHaveBeenCalledTimes(1)
  })

  test("si cancela, el perfil no se quita", async () => {
    renderizar({ esDueno: true })

    userEvent.click(screen.getByRole("button", { name: "Quitar perfil" }))
    userEvent.click(await screen.findByRole("button", { name: "Cancelar" }))

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    )
    expect(eliminarPerfil).not.toHaveBeenCalled()
  })

  test("si el back no deja quitarlo muestra el motivo en la tarjeta", async () => {
    eliminarPerfil.mockRejectedValue({
      response: {
        status: 403,
        data: { message: "El proyecto no pertenece al colectivo autenticado" },
      },
    })
    renderizar({ esDueno: true })

    userEvent.click(screen.getByRole("button", { name: "Quitar perfil" }))
    userEvent.click(await screen.findByRole("button", { name: "Sí, quitar" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El proyecto no pertenece al colectivo autenticado",
    )
    expect(alModificar).not.toHaveBeenCalled()
  })
})
