import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { AuthProvider } from "../../context/AuthContext"
import { iniciarSesion } from "../../service/authService"
import Login from "./Login"

jest.mock("../../service/authService")

const renderizarLogin = () =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<h1>Inicio</h1>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )

const completarYEnviar = () => {
  userEvent.type(screen.getByLabelText(/email/i), "huerta@colectivo.test")
  userEvent.type(screen.getByLabelText(/contraseña/i), "secreto123")
  userEvent.click(screen.getByRole("button", { name: "Ingresar" }))
}

afterEach(() => {
  localStorage.clear()
})

describe("Login", () => {
  test("ingresa con email y contraseña y vuelve al inicio", async () => {
    iniciarSesion.mockResolvedValue({
      token: "token",
      usuario: {
        id: "u1",
        email: "huerta@colectivo.test",
        rol: "COLECTIVO",
        entidad: { id: "c1", nombre: "Huerta Comunitaria Sur" },
      },
    })

    renderizarLogin()
    completarYEnviar()

    expect(
      await screen.findByRole("heading", { name: "Inicio" }),
    ).toBeInTheDocument()
    expect(iniciarSesion).toHaveBeenCalledWith(
      "huerta@colectivo.test",
      "secreto123",
    )
  })

  test("mientras ingresa no deja volver a enviar", async () => {
    iniciarSesion.mockReturnValue(new Promise(() => {}))

    renderizarLogin()
    completarYEnviar()

    expect(
      await screen.findByRole("button", { name: /ingresar/i }),
    ).toBeDisabled()
    expect(iniciarSesion).toHaveBeenCalledTimes(1)
  })

  test("ofrece registrarse como colaboradora o registrar un colectivo", () => {
    renderizarLogin()

    expect(
      screen.getByRole("link", { name: "Registrate como colaboradora" }),
    ).toHaveAttribute("href", "/colaboradoras/nueva")
    expect(
      screen.getByRole("link", { name: "registrá tu colectivo" }),
    ).toHaveAttribute("href", "/colectivos/nuevo")
  })

  test("muestra el mensaje del backend si las credenciales son inválidas", async () => {
    iniciarSesion.mockRejectedValue({
      response: { data: { message: "Credenciales inválidas" } },
    })

    renderizarLogin()
    completarYEnviar()

    expect(
      await screen.findByText("Credenciales inválidas"),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Ingresar" })).toBeEnabled()
  })
})
