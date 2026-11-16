import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { buscarCandidatas } from "../../service/colaboradorasService"
import { enviarMensaje } from "../../service/mensajesService"
import { obtenerProyecto } from "../../service/proyectosService"
import PaginaCandidatas from "./PaginaCandidatas"

jest.mock("../../service/colaboradorasService")
jest.mock("../../service/mensajesService")
jest.mock("../../service/proyectosService")

const proyecto = {
  id: "pr1",
  titulo: "Sitio web de la huerta",
  perfiles: [{ id: "pf1", nombre: "Frontend" }],
}

const candidata = (id, nombreFantasia, extras = {}) => ({
  id,
  nombreFantasia,
  nombreCompleto: null,
  pronombres: [],
  presentacion: `Presentación de ${nombreFantasia}`,
  habilidades: ["Pandas", "Estadística", "Cocina"],
  cuentas: [],
  aceptaMensajeriaInterna: true,
  coincidencia: "TOTAL",
  habilidadesCoincidentes: ["Pandas", "Estadística"],
  opcionalesCubiertas: 0,
  ...extras,
})

const renderizar = () =>
  render(
    <MemoryRouter initialEntries={["/proyectos/pr1/perfiles/pf1/candidatas"]}>
      <Routes>
        <Route
          path="/proyectos/:id/perfiles/:perfilId/candidatas"
          element={<PaginaCandidatas />}
        />
      </Routes>
    </MemoryRouter>,
  )

const tarjetaDe = async (nombreFantasia) =>
  (await screen.findByRole("heading", { name: nombreFantasia })).closest(
    "article",
  )

const rechazoDelBack = {
  response: {
    data: { message: "La persona colaboradora no acepta mensajería interna." },
  },
}

beforeEach(() => {
  obtenerProyecto.mockResolvedValue(proyecto)
  buscarCandidatas.mockResolvedValue([
    candidata("p1", "Yacaré", { opcionalesCubiertas: 1 }),
    candidata("p2", "Calden"),
    candidata("p3", "Tero", {
      aceptaMensajeriaInterna: false,
      coincidencia: "PARCIAL",
      habilidadesCoincidentes: ["Pandas"],
    }),
  ])
})

const seleccionarA = async (nombreFantasia) =>
  userEvent.click(
    within(await tarjetaDe(nombreFantasia)).getByRole("checkbox", {
      name: `Seleccionar a ${nombreFantasia}`,
    }),
  )

const escribirYEnviar = async (titulo, mensaje) => {
  const formulario = await screen.findByRole("dialog", { name: titulo })
  userEvent.type(within(formulario).getByLabelText("Mensaje"), mensaje)
  userEvent.click(within(formulario).getByRole("button", { name: "Enviar" }))
  return formulario
}

describe("PaginaCandidatas", () => {
  test("lista las personas que encajan con el perfil, con su coincidencia y sin medios de contacto", async () => {
    renderizar()

    expect(
      await screen.findByRole("heading", {
        name: "Personas para el perfil Frontend",
      }),
    ).toBeInTheDocument()
    expect(buscarCandidatas).toHaveBeenCalledWith("pf1")
    // Las migas usan el proyecto que ya trajo la página, sin pedirlo de nuevo
    const migas = screen.getByRole("navigation", { name: "Ubicación" })
    expect(
      within(migas).getByRole("link", { name: "Sitio web de la huerta" }),
    ).toHaveAttribute("href", "/proyectos/pr1")
    expect(obtenerProyecto).toHaveBeenCalledTimes(1)

    const yacare = within(await tarjetaDe("Yacaré"))
    expect(yacare.getByText("Presentación de Yacaré")).toBeInTheDocument()
    expect(yacare.getByText("Coincidencia total")).toBeInTheDocument()
    expect(yacare.getByText("Tiene 1 habilidad opcional")).toBeInTheDocument()
    expect(yacare.getByText("Estadística")).toBeInTheDocument()
    // Solo las habilidades que coinciden con el perfil, no todas las suyas
    expect(yacare.queryByText("Cocina")).not.toBeInTheDocument()
    expect(yacare.getByRole("link", { name: "Ver perfil" })).toHaveAttribute(
      "href",
      "/colaboradoras/p1",
    )

    const tero = within(await tarjetaDe("Tero"))
    expect(tero.getByText("Coincidencia parcial")).toBeInTheDocument()
    expect(tero.getByText("No acepta mensajes internos.")).toBeInTheDocument()
  })

  test("envía un mismo mensaje a las personas seleccionadas y dice a cuántas llegó", async () => {
    enviarMensaje.mockResolvedValue()
    renderizar()

    const enviarALasSeleccionadas = await screen.findByRole("button", {
      name: "Enviar mensaje a las seleccionadas",
    })
    expect(enviarALasSeleccionadas).toBeDisabled()

    await seleccionarA("Yacaré")
    await seleccionarA("Calden")
    expect(screen.getByText("2 personas seleccionadas")).toBeInTheDocument()
    userEvent.click(enviarALasSeleccionadas)

    const formulario = await screen.findByRole("dialog", {
      name: "Escribirle a Yacaré y Calden",
    })
    const enviar = within(formulario).getByRole("button", { name: "Enviar" })
    expect(enviar).toBeDisabled()
    userEvent.type(
      within(formulario).getByLabelText("Mensaje"),
      "¿Te sumás al proyecto?",
    )
    expect(
      within(formulario).getByText("22 de 4096 caracteres"),
    ).toBeInTheDocument()
    userEvent.click(enviar)

    expect(
      await screen.findByText("El mensaje fue enviado a 2 colaboradoras."),
    ).toBeInTheDocument()
    expect(enviarMensaje.mock.calls.map(([envio]) => envio)).toEqual([
      {
        proyectoId: "pr1",
        perfilId: "pf1",
        personaId: "p1",
        contenido: "¿Te sumás al proyecto?",
      },
      {
        proyectoId: "pr1",
        perfilId: "pf1",
        personaId: "p2",
        contenido: "¿Te sumás al proyecto?",
      },
    ])
    await waitFor(() => expect(formulario).not.toBeInTheDocument())
    expect(screen.getByText("0 personas seleccionadas")).toBeInTheDocument()
  })

  test("si el back rechaza a la única destinataria, muestra el motivo y conserva lo escrito", async () => {
    enviarMensaje.mockRejectedValue(rechazoDelBack)
    renderizar()

    userEvent.click(
      within(await tarjetaDe("Tero")).getByRole("button", {
        name: "Enviar mensaje",
      }),
    )
    const formulario = await escribirYEnviar("Escribirle a Tero", "Hola")

    expect(
      await within(formulario).findByText(
        "No se envió a Tero: La persona colaboradora no acepta mensajería interna.",
      ),
    ).toBeInTheDocument()
    expect(within(formulario).getByLabelText("Mensaje")).toHaveValue("Hola")
  })

  test("si el back rechaza a una de varias, avisa a quiénes llegó y a quién no", async () => {
    enviarMensaje.mockImplementation(({ personaId }) =>
      personaId === "p3" ? Promise.reject(rechazoDelBack) : Promise.resolve(),
    )
    renderizar()

    await seleccionarA("Yacaré")
    await seleccionarA("Tero")
    userEvent.click(
      screen.getByRole("button", {
        name: "Enviar mensaje a las seleccionadas",
      }),
    )
    await escribirYEnviar("Escribirle a Yacaré y Tero", "Hola")

    expect(
      await screen.findByText("El mensaje fue enviado a Yacaré."),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "No se envió a Tero: La persona colaboradora no acepta mensajería interna.",
      ),
    ).toBeInTheDocument()
  })
})
