import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { AuthProvider } from "../../context/AuthContext"
import Navbar from "./Navbar"

const iniciarSesionComo = (rol, nombre) => {
  localStorage.setItem(
    "sesion",
    JSON.stringify({
      token: "token",
      usuario: { id: "u1", rol, nombre, entidad: { id: "e1", nombre } },
    }),
  )
}

const renderizar = () =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/mensajes"]}>
        <Navbar />
        <Routes>
          <Route path="/" element={<h1>Inicio</h1>} />
          <Route path="*" element={<h1>Otra página</h1>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )

const barra = () => screen.getByRole("navigation", { name: "Principal" })

// Las secciones de la barra, sin el logo (que se nombra con aria-label).
const textosDeEnlaces = (contenedor) =>
  within(contenedor)
    .getAllByRole("link")
    .filter((enlace) => !enlace.hasAttribute("aria-label"))
    .map((enlace) => enlace.textContent)

afterEach(() => {
  localStorage.clear()
})

describe("Navbar", () => {
  test("sin sesión ofrece ingresar y registrarse", () => {
    renderizar()

    expect(textosDeEnlaces(barra())).toEqual([
      "Proyectos",
      "Ingresar",
      "Registrarme",
    ])
    expect(
      within(barra()).getByRole("link", { name: "Código a Voluntad" }),
    ).toHaveAttribute("href", "/")
    expect(
      screen.queryByRole("button", { name: "Cerrar sesión" }),
    ).not.toBeInTheDocument()
  })

  test("una persona colaboradora ve sus postulaciones y su perfil", () => {
    iniciarSesionComo("PERSONA_COLABORADORA", "Nube")

    renderizar()

    expect(textosDeEnlaces(barra())).toEqual([
      "Proyectos",
      "Mis postulaciones",
      "Mensajes",
      "Mi perfil",
      "Mi cuenta",
    ])
    expect(within(barra()).getByText("Nube")).toBeInTheDocument()
  })

  test("un colectivo ve mensajes y su cuenta, pero no postulaciones ni perfil", () => {
    iniciarSesionComo("COLECTIVO", "Red Solidaria Sur")

    renderizar()

    expect(textosDeEnlaces(barra())).toEqual([
      "Proyectos",
      "Mensajes",
      "Mi cuenta",
    ])
  })

  test("marca la sección en la que está", () => {
    iniciarSesionComo("COLECTIVO", "Red Solidaria Sur")

    renderizar()

    expect(
      within(barra()).getByRole("link", { name: "Mensajes" }),
    ).toHaveAttribute("aria-current", "page")
    expect(
      within(barra()).getByRole("link", { name: "Proyectos" }),
    ).not.toHaveAttribute("aria-current")
  })

  test("el menú lateral se abre, se cierra con Escape y al elegir una sección", async () => {
    iniciarSesionComo("PERSONA_COLABORADORA", "Nube")
    renderizar()

    await userEvent.click(screen.getByRole("button", { name: "Abrir menú" }))
    const menu = screen.getByRole("navigation", { name: "Menú" })
    expect(within(menu).getByText("Nube")).toBeInTheDocument()
    expect(
      within(menu).getByRole("link", { name: "Mis postulaciones" }),
    ).toBeInTheDocument()

    await userEvent.keyboard("{Escape}")
    await waitFor(() =>
      expect(
        screen.queryByRole("navigation", { name: "Menú" }),
      ).not.toBeInTheDocument(),
    )

    await userEvent.click(screen.getByRole("button", { name: "Abrir menú" }))
    await userEvent.click(
      within(screen.getByRole("navigation", { name: "Menú" })).getByRole(
        "link",
        { name: "Proyectos" },
      ),
    )
    expect(
      await screen.findByRole("heading", { name: "Inicio" }),
    ).toBeInTheDocument()
    await waitFor(() =>
      expect(
        screen.queryByRole("navigation", { name: "Menú" }),
      ).not.toBeInTheDocument(),
    )
  })

  test("cerrar sesión vuelve al inicio sin sesión", async () => {
    iniciarSesionComo("PERSONA_COLABORADORA", "Nube")
    renderizar()

    await userEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }))

    expect(
      await screen.findByRole("heading", { name: "Inicio" }),
    ).toBeInTheDocument()
    expect(
      within(barra()).getByRole("link", { name: "Ingresar" }),
    ).toBeInTheDocument()
    expect(localStorage.getItem("sesion")).toBeNull()
  })
})
