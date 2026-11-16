import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { AuthProvider } from "../../context/AuthContext"
import { ProveedorDeMensajesSinLeer } from "../../context/MensajesSinLeerContext"
import { contarRecibidosSinLeer } from "../../service/mensajesService"
import Navbar from "./Navbar"

jest.mock("../../service/mensajesService")

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
        <ProveedorDeMensajesSinLeer>
          <Navbar />
          <Routes>
            <Route path="/" element={<h1>Inicio</h1>} />
            <Route path="*" element={<h1>Otra página</h1>} />
          </Routes>
        </ProveedorDeMensajesSinLeer>
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

beforeEach(() => {
  contarRecibidosSinLeer.mockResolvedValue(0)
})

afterEach(() => {
  localStorage.clear()
})

describe("Navbar", () => {
  test("muestra a quien tiene la sesión en la barra y en el menú lateral", async () => {
    iniciarSesionComo("PERSONA_COLABORADORA", "Ana García")
    renderizar()

    expect(within(barra()).getByText("Ana García")).toBeInTheDocument()
    expect(within(barra()).getByText("AG")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Abrir menú" }))
    const menu = screen.getByRole("navigation", { name: "Menú" })
    expect(within(menu).getByText("Ana García")).toBeInTheDocument()
    expect(within(menu).getByText("AG")).toBeInTheDocument()
  })

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

  test("una persona colaboradora ve la búsqueda, sus postulaciones y sus mensajes", () => {
    iniciarSesionComo("PERSONA_COLABORADORA", "Nube")

    renderizar()

    expect(textosDeEnlaces(barra())).toEqual([
      "Proyectos",
      "Buscar proyectos",
      "Mis postulaciones",
      "Mensajes",
    ])
    expect(within(barra()).getByText("Nube")).toBeInTheDocument()
  })

  test("el perfil, la cuenta y cerrar sesión están en el menú de quien tiene la sesión", async () => {
    iniciarSesionComo("PERSONA_COLABORADORA", "Nube")
    renderizar()

    await userEvent.click(
      within(barra()).getByRole("button", { name: "Cuenta de Nube" }),
    )

    const menu = await screen.findByRole("menu")
    expect(
      within(menu)
        .getAllByRole("menuitem")
        .map((opcion) => opcion.textContent),
    ).toEqual(["Mi perfil", "Mi cuenta", "Cerrar sesión"])
    expect(
      within(menu).getByRole("menuitem", { name: "Mi perfil" }),
    ).toHaveAttribute("href", "/mi-perfil")
  })

  test("un colectivo ve mensajes, su colectivo y su cuenta, pero no postulaciones ni perfil", async () => {
    iniciarSesionComo("COLECTIVO", "Red Solidaria Sur")

    renderizar()

    expect(textosDeEnlaces(barra())).toEqual(["Proyectos", "Mensajes"])
    await userEvent.click(
      within(barra()).getByRole("button", {
        name: "Cuenta de Red Solidaria Sur",
      }),
    )
    const menu = await screen.findByRole("menu")
    expect(
      within(menu)
        .getAllByRole("menuitem")
        .map((opcion) => opcion.textContent),
    ).toEqual(["Mi colectivo", "Mi cuenta", "Cerrar sesión"])
    expect(
      within(menu).getByRole("menuitem", { name: "Mi colectivo" }),
    ).toHaveAttribute("href", "/mi-colectivo")
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

    await userEvent.click(
      within(barra()).getByRole("button", { name: "Cuenta de Nube" }),
    )
    await userEvent.click(
      await screen.findByRole("menuitem", { name: "Cerrar sesión" }),
    )

    expect(
      await screen.findByRole("heading", { name: "Inicio" }),
    ).toBeInTheDocument()
    expect(
      within(barra()).getByRole("link", { name: "Ingresar" }),
    ).toBeInTheDocument()
    expect(localStorage.getItem("sesion")).toBeNull()
  })

  describe("contador de mensajes sin leer", () => {
    test("la persona colaboradora ve cuántos tiene al lado de Mensajes", async () => {
      contarRecibidosSinLeer.mockResolvedValue(3)
      iniciarSesionComo("PERSONA_COLABORADORA", "Nube")
      renderizar()

      expect(
        await within(barra()).findByRole("link", {
          name: "Mensajes 3 sin leer",
        }),
      ).toHaveAttribute("href", "/mensajes")
      expect(contarRecibidosSinLeer).toHaveBeenCalledWith("e1")
      expect(
        screen.getByRole("button", {
          name: "Abrir menú (tenés mensajes sin leer)",
        }),
      ).toBeInTheDocument()
    })

    test("con más de 99 muestra 99+", async () => {
      contarRecibidosSinLeer.mockResolvedValue(120)
      iniciarSesionComo("PERSONA_COLABORADORA", "Nube")
      renderizar()

      expect(
        await within(barra()).findByRole("link", {
          name: "Mensajes 99+ sin leer",
        }),
      ).toBeInTheDocument()
    })

    test("sin mensajes por leer no muestra el contador", async () => {
      iniciarSesionComo("PERSONA_COLABORADORA", "Nube")
      renderizar()

      await waitFor(() => expect(contarRecibidosSinLeer).toHaveBeenCalled())
      expect(
        within(barra()).getByRole("link", { name: "Mensajes" }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: "Abrir menú" }),
      ).toBeInTheDocument()
    })

    test("lo vuelve a pedir al cambiar de página", async () => {
      contarRecibidosSinLeer.mockResolvedValueOnce(1).mockResolvedValueOnce(2)
      iniciarSesionComo("PERSONA_COLABORADORA", "Nube")
      renderizar()

      await within(barra()).findByRole("link", { name: "Mensajes 1 sin leer" })
      await userEvent.click(
        within(barra()).getByRole("link", { name: "Proyectos" }),
      )

      expect(
        await within(barra()).findByRole("link", {
          name: "Mensajes 2 sin leer",
        }),
      ).toBeInTheDocument()
    })

    test("si no se pudo contar, Mensajes queda sin contador", async () => {
      contarRecibidosSinLeer.mockRejectedValue(new Error("sin conexión"))
      iniciarSesionComo("PERSONA_COLABORADORA", "Nube")
      renderizar()

      await waitFor(() => expect(contarRecibidosSinLeer).toHaveBeenCalled())
      expect(
        within(barra()).getByRole("link", { name: "Mensajes" }),
      ).toBeInTheDocument()
    })

    test("los colectivos no tienen contador", () => {
      iniciarSesionComo("COLECTIVO", "Red Solidaria Sur")
      renderizar()

      expect(contarRecibidosSinLeer).not.toHaveBeenCalled()
      expect(
        within(barra()).getByRole("link", { name: "Mensajes" }),
      ).toBeInTheDocument()
    })
  })
})
