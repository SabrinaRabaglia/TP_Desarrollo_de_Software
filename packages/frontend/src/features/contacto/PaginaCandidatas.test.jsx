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

const candidata = (id, nombreFantasia, aceptaMensajeriaInterna) => ({
  id,
  nombreFantasia,
  nombreCompleto: null,
  pronombres: [],
  presentacion: null,
  habilidades: ["React"],
  cuentas: [],
  aceptaMensajeriaInterna,
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

beforeEach(() => {
  obtenerProyecto.mockResolvedValue(proyecto)
  buscarCandidatas.mockResolvedValue([
    candidata("p1", "anag", true),
    candidata("p2", "beto", false),
  ])
})

describe("PaginaCandidatas", () => {
  test("lista las personas que encajan con el perfil", async () => {
    renderizar()

    expect(
      await screen.findByRole("heading", {
        name: "Personas para el perfil Frontend",
      }),
    ).toBeInTheDocument()
    expect(buscarCandidatas).toHaveBeenCalledWith("pf1")
    expect(
      within(await tarjetaDe("anag")).getByRole("link", { name: "Ver perfil" }),
    ).toHaveAttribute("href", "/colaboradoras/p1")
  })

  test("abre el formulario, envía el mensaje y muestra la confirmación", async () => {
    enviarMensaje.mockResolvedValue()
    renderizar()

    userEvent.click(
      within(await tarjetaDe("anag")).getByRole("button", {
        name: "Contactar",
      }),
    )

    const formulario = await screen.findByRole("dialog", {
      name: "Escribirle a anag",
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
      await screen.findByText("Le enviaste el mensaje a anag."),
    ).toBeInTheDocument()
    expect(enviarMensaje).toHaveBeenCalledWith({
      proyectoId: "pr1",
      perfilId: "pf1",
      personaId: "p1",
      contenido: "¿Te sumás al proyecto?",
    })
    await waitFor(() => expect(formulario).not.toBeInTheDocument())
  })

  test("si el back rechaza el mensaje muestra su error y conserva lo escrito", async () => {
    enviarMensaje.mockRejectedValue({
      response: {
        data: { message: "La persona no acepta mensajería interna." },
      },
    })
    renderizar()

    userEvent.click(
      within(await tarjetaDe("anag")).getByRole("button", {
        name: "Contactar",
      }),
    )
    const formulario = await screen.findByRole("dialog")
    userEvent.type(within(formulario).getByLabelText("Mensaje"), "Hola")
    userEvent.click(within(formulario).getByRole("button", { name: "Enviar" }))

    expect(
      await within(formulario).findByText(
        "La persona no acepta mensajería interna.",
      ),
    ).toBeInTheDocument()
    expect(within(formulario).getByLabelText("Mensaje")).toHaveValue("Hola")
  })

  test("el botón Contactar está deshabilitado para quien no acepta mensajería", async () => {
    renderizar()

    const contactar = within(await tarjetaDe("beto")).getByRole("button", {
      name: "Contactar",
    })

    expect(contactar).toBeDisabled()
    expect(contactar).toHaveAccessibleDescription(
      "No acepta mensajes internos.",
    )
  })
})
