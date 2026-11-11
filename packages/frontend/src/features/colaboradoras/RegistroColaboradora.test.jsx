import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { AuthProvider } from "../../context/AuthContext"
import { iniciarSesion } from "../../service/authService"
import { registrarColaboradora } from "../../service/colaboradorasService"
import { obtenerHabilidades } from "../../service/habilidadesService"
import RegistroColaboradora from "./RegistroColaboradora"

jest.mock("../../service/authService")
jest.mock("../../service/colaboradorasService")
jest.mock("../../service/habilidadesService")

const renderizarRegistro = () =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/colaboradoras/nueva"]}>
        <Routes>
          <Route
            path="/colaboradoras/nueva"
            element={<RegistroColaboradora />}
          />
          <Route
            path="/colaboradoras/p1"
            element={<h1>Perfil público de lucia.dev</h1>}
          />
          <Route path="/" element={<h1>Inicio</h1>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )

const completarYEnviar = () => {
  userEvent.type(screen.getByLabelText(/^email/i), "lucia@persona.test")
  userEvent.type(screen.getByLabelText(/^contraseña/i), "secreto123")
  userEvent.type(screen.getByLabelText(/^nombre de fantasía/i), "lucia.dev")
  userEvent.click(screen.getByRole("checkbox", { name: "React" }))
  userEvent.click(
    screen.getByRole("button", { name: "Agregar medio de contacto" }),
  )
  userEvent.type(
    screen.getByLabelText(/^dato de contacto/i),
    "lucia@example.com",
  )
  userEvent.click(screen.getByRole("button", { name: "Crear cuenta" }))
}

beforeEach(() => {
  obtenerHabilidades.mockResolvedValue([
    { id: "h1", titulo: "React" },
    { id: "h2", titulo: "SQL" },
  ])
})

afterEach(() => {
  localStorage.clear()
})

describe("RegistroColaboradora", () => {
  test("registra a la persona, inicia sesión y la lleva a su perfil público", async () => {
    registrarColaboradora.mockResolvedValue({})
    iniciarSesion.mockResolvedValue({
      token: "token",
      usuario: {
        id: "u1",
        email: "lucia@persona.test",
        rol: "PERSONA_COLABORADORA",
        entidad: { id: "p1", nombre: "lucia.dev" },
        nombre: "lucia.dev",
      },
    })

    renderizarRegistro()
    await screen.findByRole("checkbox", { name: "React" })
    completarYEnviar()

    expect(
      await screen.findByRole("heading", {
        name: "Perfil público de lucia.dev",
      }),
    ).toBeInTheDocument()
    expect(registrarColaboradora).toHaveBeenCalledWith({
      email: "lucia@persona.test",
      contrasena: "secreto123",
      persona: expect.objectContaining({
        nombreFantasia: "lucia.dev",
        habilidades: ["h1"],
        mediosDeContacto: [{ tipo: "EMAIL", valor: "lucia@example.com" }],
      }),
    })
    expect(iniciarSesion).toHaveBeenCalledWith(
      "lucia@persona.test",
      "secreto123",
    )
  })

  test("muestra el mensaje del backend si no puede registrarla", async () => {
    registrarColaboradora.mockRejectedValue({
      response: { data: { message: "Ya existe un usuario con ese email" } },
    })

    renderizarRegistro()
    await screen.findByRole("checkbox", { name: "React" })
    completarYEnviar()

    expect(
      await screen.findByText("Ya existe un usuario con ese email"),
    ).toBeInTheDocument()
    expect(screen.getByRole("alert")).toHaveFocus()
    expect(screen.getByRole("button", { name: "Crear cuenta" })).toBeEnabled()
    expect(screen.getByLabelText(/^nombre de fantasía/i)).toHaveValue(
      "lucia.dev",
    )
  })

  test("al quitar un medio de contacto el foco queda en el botón de agregar", async () => {
    renderizarRegistro()
    await screen.findByRole("checkbox", { name: "React" })
    const agregar = screen.getByRole("button", {
      name: "Agregar medio de contacto",
    })

    userEvent.click(agregar)
    userEvent.click(
      screen.getByRole("button", { name: "Quitar medio de contacto 1" }),
    )

    expect(
      screen.queryByLabelText(/^dato de contacto/i),
    ).not.toBeInTheDocument()
    expect(agregar).toHaveFocus()
  })
})
