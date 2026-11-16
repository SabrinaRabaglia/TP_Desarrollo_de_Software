import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { AuthProvider } from "../../context/AuthContext"
import Layout from "../layout/Layout"
import { obtenerUsuarioActual } from "../../service/authService"
import {
  actualizarColaboradora,
  eliminarMedioDeContacto,
  obtenerPerfilPropio,
} from "../../service/colaboradorasService"
import { obtenerHabilidades } from "../../service/habilidadesService"
import MiPerfil from "./MiPerfil"

jest.mock("../../service/authService")
jest.mock("../../service/colaboradorasService")
jest.mock("../../service/habilidadesService")

const usuario = {
  id: "u1",
  email: "ana@persona.test",
  rol: "PERSONA_COLABORADORA",
  entidad: { id: "p1", nombre: "anag" },
  nombre: "anag",
}

const emailGuardado = { id: "m1", tipo: "EMAIL", valor: "ana@example.com" }

const perfil = {
  nombreFantasia: "anag",
  nombre: "Ana",
  apellido: "",
  pronombres: "ella",
  presentacion: "Frontend",
  habilidades: ["h1"],
  cuentas: [],
  mediosDeContacto: [emailGuardado],
  aceptaMensajeriaInterna: true,
}

const renderizarMiPerfil = () =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/mi-perfil"]}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route path="/mi-perfil" element={<MiPerfil />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )

const presentacion = () => screen.getByLabelText(/^presentación/i)

const cambiarPresentacion = (texto) => {
  userEvent.clear(presentacion())
  userEvent.paste(presentacion(), texto)
}

const agregarMedio = (valor) => {
  userEvent.click(
    screen.getByRole("button", { name: "Agregar medio de contacto" }),
  )
  userEvent.paste(screen.getAllByLabelText(/^dato de contacto/i).at(-1), valor)
}

const guardar = () =>
  userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }))

beforeEach(() => {
  localStorage.setItem("sesion", JSON.stringify({ token: "token", usuario }))
  obtenerHabilidades.mockResolvedValue([
    { id: "h1", titulo: "React" },
    { id: "h2", titulo: "SQL" },
  ])
  obtenerPerfilPropio.mockResolvedValue(perfil)
  actualizarColaboradora.mockResolvedValue()
})

afterEach(() => {
  localStorage.clear()
})

describe("MiPerfil", () => {
  test("carga el perfil, guarda los cambios conservando el id de los medios y actualiza el nombre de la navbar", async () => {
    obtenerUsuarioActual.mockResolvedValue({
      ...usuario,
      entidad: { id: "p1", nombre: "ana.dev" },
      nombre: "ana.dev",
    })

    renderizarMiPerfil()

    const nombreFantasia = await screen.findByLabelText(/^nombre de fantasía/i)
    expect(nombreFantasia).toHaveValue("anag")
    expect(screen.getByRole("checkbox", { name: "React" })).toBeChecked()
    expect(screen.getByRole("checkbox", { name: "SQL" })).not.toBeChecked()
    const emailExistente = screen.getByLabelText(/^dato de contacto/i)
    expect(emailExistente).toHaveValue("ana@example.com")
    expect(
      screen.getByRole("link", { name: "Ver mi perfil público" }),
    ).toHaveAttribute("href", "/colaboradoras/p1")
    expect(obtenerPerfilPropio).toHaveBeenCalledWith("p1")

    userEvent.clear(nombreFantasia)
    userEvent.paste(nombreFantasia, "ana.dev")
    cambiarPresentacion("Frontend y accesibilidad")
    userEvent.clear(emailExistente)
    userEvent.paste(emailExistente, "ana@ejemplo.com")
    agregarMedio("ana.gomez@example.com")
    guardar()

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Guardamos tus cambios",
    )
    expect(screen.getByRole("alert")).toHaveFocus()
    expect(actualizarColaboradora).toHaveBeenCalledTimes(1)
    const [id, persona] = actualizarColaboradora.mock.calls[0]
    expect(id).toBe("p1")
    expect(persona).toMatchObject({
      nombreFantasia: "ana.dev",
      presentacion: "Frontend y accesibilidad",
      habilidades: ["h1"],
    })
    expect(persona.mediosDeContacto).toEqual([
      { id: "m1", tipo: "EMAIL", valor: "ana@ejemplo.com" },
      { tipo: "EMAIL", valor: "ana.gomez@example.com" },
    ])
    expect(persona.mediosDeContacto[1]).not.toHaveProperty("id")
    expect(
      within(screen.getByRole("navigation")).getByText("ana.dev"),
    ).toBeInTheDocument()
  })

  test("si el backend rechaza los cambios muestra su mensaje y conserva lo tipeado", async () => {
    actualizarColaboradora.mockRejectedValue({
      response: { data: { message: "El teléfono de WhatsApp no es válido" } },
    })

    renderizarMiPerfil()
    await screen.findByLabelText(/^nombre de fantasía/i)
    cambiarPresentacion("Backend")
    agregarMedio("abc")
    guardar()

    expect(
      await screen.findByText("El teléfono de WhatsApp no es válido"),
    ).toBeInTheDocument()
    expect(screen.getByRole("alert")).toHaveFocus()
    expect(presentacion()).toHaveValue("Backend")
    expect(screen.getAllByLabelText(/^dato de contacto/i).at(-1)).toHaveValue(
      "abc",
    )
    expect(screen.queryByText("Guardamos tus cambios")).not.toBeInTheDocument()
  })

  test("al guardar de nuevo, el medio agregado viaja con el id que le dio el backend", async () => {
    const emailNuevo = {
      id: "m2",
      tipo: "EMAIL",
      valor: "ana.gomez@example.com",
    }
    obtenerUsuarioActual.mockResolvedValue(usuario)
    obtenerPerfilPropio.mockResolvedValueOnce(perfil).mockResolvedValue({
      ...perfil,
      mediosDeContacto: [emailGuardado, emailNuevo],
    })

    renderizarMiPerfil()
    await screen.findByLabelText(/^nombre de fantasía/i)
    agregarMedio(emailNuevo.valor)
    guardar()
    await screen.findByText("Guardamos tus cambios")
    guardar()

    await waitFor(() => expect(actualizarColaboradora).toHaveBeenCalledTimes(2))
    expect(actualizarColaboradora.mock.calls[1][1].mediosDeContacto).toEqual([
      emailGuardado,
      emailNuevo,
    ])
    await screen.findByText("Guardamos tus cambios")
  })

  test("al guardar con Telegram conectado, el medio viaja y el formulario no lo ofrece ni lo muestra", async () => {
    const telegram = { id: "m7", tipo: "TELEGRAM", valor: "555" }
    obtenerUsuarioActual.mockResolvedValue(usuario)
    obtenerPerfilPropio.mockResolvedValue({
      ...perfil,
      mediosDeContacto: [emailGuardado, telegram],
    })

    renderizarMiPerfil()
    await screen.findByLabelText(/^nombre de fantasía/i)

    expect(screen.getByText("Telegram conectado")).toBeInTheDocument()
    expect(screen.getAllByLabelText(/^dato de contacto/i)).toHaveLength(1)
    userEvent.click(
      screen.getByRole("button", { name: "Agregar medio de contacto" }),
    )
    userEvent.click(screen.getAllByRole("combobox", { name: "Tipo" }).at(-1))
    const opciones = within(screen.getByRole("listbox"))
      .getAllByRole("option")
      .map((opcion) => opcion.textContent)
    expect(opciones).toEqual(["Email", "WhatsApp", "SMS"])
    userEvent.keyboard("{Escape}")

    cambiarPresentacion("Con Telegram")
    userEvent.click(
      screen.getByRole("button", { name: "Quitar medio de contacto 2" }),
    )
    guardar()
    await screen.findByText("Guardamos tus cambios")

    expect(actualizarColaboradora.mock.calls[0][1].mediosDeContacto).toEqual([
      emailGuardado,
      telegram,
    ])
  })

  test("al desconectar Telegram, el próximo guardado ya no lo envía y lo tipeado se conserva", async () => {
    const telegram = { id: "m7", tipo: "TELEGRAM", valor: "555" }
    obtenerUsuarioActual.mockResolvedValue(usuario)
    obtenerPerfilPropio.mockResolvedValue({
      ...perfil,
      mediosDeContacto: [emailGuardado, telegram],
    })
    eliminarMedioDeContacto.mockResolvedValue()

    renderizarMiPerfil()
    await screen.findByLabelText(/^nombre de fantasía/i)
    cambiarPresentacion("A medio escribir")
    userEvent.click(screen.getByRole("button", { name: "Desconectar" }))
    userEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "Desconectar",
      }),
    )
    await screen.findByRole("button", { name: "Conectar Telegram" })

    expect(presentacion()).toHaveValue("A medio escribir")
    guardar()
    await screen.findByText("Guardamos tus cambios")
    expect(actualizarColaboradora.mock.calls[0][1].mediosDeContacto).toEqual([
      emailGuardado,
    ])
  })
})
