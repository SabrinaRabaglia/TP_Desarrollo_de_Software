import { render, screen, within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { AuthProvider } from "../../context/AuthContext"
import AcercaDe from "./AcercaDe"
import TerminosYCondiciones from "./TerminosYCondiciones"

const renderizar = (pagina) =>
  render(
    <AuthProvider>
      <MemoryRouter>{pagina}</MemoryRouter>
    </AuthProvider>,
  )

const INTEGRANTES = [
  "Bixente da Silva Barata",
  "Santiago Herrera",
  "Matías Escobar",
  "Sabrina Rabaglia",
  "Lautaro Ocampo",
]

afterEach(() => {
  localStorage.clear()
})

describe("Términos y Condiciones", () => {
  test("aclara que el sitio es educativo y no admite uso comercial", () => {
    renderizar(<TerminosYCondiciones />)

    expect(
      screen.getByRole("heading", { level: 1, name: "Términos y Condiciones" }),
    ).toBeInTheDocument()
    expect(screen.getByText(/con fines educativos/)).toBeInTheDocument()
    expect(
      screen.getByText(/No está permitido usarlo con fines comerciales/),
    ).toBeInTheDocument()
  })

  test("da créditos al Grupo 1 y lleva a Acerca de", () => {
    renderizar(<TerminosYCondiciones />)

    const autoria = screen.getByRole("region", { name: "6. Autoría" })
    expect(autoria).toHaveTextContent(
      "Grupo 1, integrado por Bixente da Silva Barata, Santiago Herrera, Matías Escobar, Sabrina Rabaglia y Lautaro Ocampo",
    )
    expect(
      within(autoria).getByRole("link", { name: "Acerca de" }),
    ).toHaveAttribute("href", "/acerca-de")
  })
})

describe("Acerca de", () => {
  test("explica el objetivo del sitio para colectivos y personas", () => {
    renderizar(<AcercaDe />)

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Acerca de Código a Voluntad",
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/repositorio de proyectos de software/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("region", { name: "Si sos un colectivo" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("region", { name: "Si querés colaborar" }),
    ).toBeInTheDocument()
  })

  test("lista a las personas que integran el grupo", () => {
    renderizar(<AcercaDe />)

    const integrantes = screen.getByRole("list", { name: "Integrantes" })
    expect(
      within(integrantes)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(INTEGRANTES)
    expect(
      screen.getByRole("link", { name: "Términos y Condiciones" }),
    ).toHaveAttribute("href", "/terminos")
  })

  test("sin sesión invita a registrarse; con sesión, no", () => {
    const { unmount } = renderizar(<AcercaDe />)
    expect(
      screen.getByRole("link", { name: "Quiero colaborar" }),
    ).toHaveAttribute("href", "/colaboradoras/nueva")
    unmount()

    localStorage.setItem(
      "sesion",
      JSON.stringify({
        token: "token",
        usuario: { id: "u1", rol: "COLECTIVO", nombre: "Huerta" },
      }),
    )
    renderizar(<AcercaDe />)

    expect(screen.getByRole("link", { name: "Ver proyectos" })).toHaveAttribute(
      "href",
      "/",
    )
    expect(
      screen.queryByRole("link", { name: "Quiero colaborar" }),
    ).not.toBeInTheDocument()
  })
})
