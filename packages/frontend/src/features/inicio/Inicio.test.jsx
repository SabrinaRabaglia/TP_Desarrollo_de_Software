import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { AuthProvider } from "../../context/AuthContext"
import { buscarProyectos } from "../../service/proyectosService"
import Inicio from "./Inicio"

jest.mock("../../service/proyectosService", () => ({
  ...jest.requireActual("../../service/proyectosService"),
  buscarProyectos: jest.fn(),
}))

const proyecto = (id, titulo) => ({
  id,
  titulo,
  descripcion: `Descripción de ${titulo}`,
  estado: "PUBLICADO",
  colectivo: { id: "c1", nombre: "Huerta Comunitaria Sur" },
  perfiles: [],
})

const pagina = (numero, proyectos, totalPaginas) => ({
  proyectos,
  pagina: numero,
  totalPaginas,
})

const renderizar = () =>
  render(
    <AuthProvider>
      <MemoryRouter>
        <Inicio />
      </MemoryRouter>
    </AuthProvider>,
  )

const iniciarSesionCon = (rol) =>
  localStorage.setItem(
    "sesion",
    JSON.stringify({
      token: "token",
      usuario: { id: "u1", rol, entidad: { id: "e1" } },
    }),
  )

afterEach(() => {
  localStorage.clear()
})

describe("Inicio", () => {
  test("con una sola página lista los proyectos sin paginación", async () => {
    buscarProyectos.mockResolvedValue(
      pagina(1, [proyecto("p1", "Sitio web de la huerta")], 1),
    )

    renderizar()

    expect(
      await screen.findByRole("link", { name: "Sitio web de la huerta" }),
    ).toHaveAttribute("href", "/proyectos/p1")
    expect(buscarProyectos).toHaveBeenCalledWith({ pagina: 1 })
    expect(
      screen.queryByRole("navigation", { name: "Páginas de proyectos" }),
    ).not.toBeInTheDocument()
  })

  test("con varias páginas permite pasar a otra", async () => {
    buscarProyectos.mockImplementation(async ({ pagina: numero }) =>
      numero === 1
        ? pagina(1, [proyecto("p1", "Sitio web de la huerta")], 2)
        : pagina(2, [proyecto("p11", "Mapa de humedales")], 2),
    )

    renderizar()
    const paginacion = await screen.findByRole("navigation", {
      name: "Páginas de proyectos",
    })
    await userEvent.click(
      within(paginacion).getByRole("button", { name: "Go to page 2" }),
    )

    expect(
      await screen.findByRole("link", { name: "Mapa de humedales" }),
    ).toBeInTheDocument()
    expect(buscarProyectos).toHaveBeenLastCalledWith({ pagina: 2 })
    expect(
      screen.queryByRole("link", { name: "Sitio web de la huerta" }),
    ).not.toBeInTheDocument()
    expect(
      within(paginacion).getByRole("button", { name: "page 2" }),
    ).toHaveAttribute("aria-current", "page")
  })

  test("si falla, muestra el error sin paginación", async () => {
    buscarProyectos.mockRejectedValue({
      response: { data: { message: "Se cayó la base" } },
    })

    renderizar()

    expect(await screen.findByText("Se cayó la base")).toBeInTheDocument()
    expect(
      screen.queryByRole("navigation", { name: "Páginas de proyectos" }),
    ).not.toBeInTheDocument()
  })

  test("a un colectivo con sesión le ofrece crear un proyecto", async () => {
    iniciarSesionCon("COLECTIVO")
    buscarProyectos.mockResolvedValue(
      pagina(1, [proyecto("p1", "Sitio web de la huerta")], 1),
    )

    renderizar()

    await screen.findByRole("link", { name: "Sitio web de la huerta" })
    expect(
      screen.getByRole("link", { name: "Crear proyecto" }),
    ).toHaveAttribute("href", "/proyectos/nuevo")
  })

  test("sin sesión o con una persona colaboradora no ofrece crear proyectos", async () => {
    buscarProyectos.mockResolvedValue(
      pagina(1, [proyecto("p1", "Sitio web de la huerta")], 1),
    )

    const sinSesion = renderizar()
    await screen.findByRole("link", { name: "Sitio web de la huerta" })
    expect(
      screen.queryByRole("link", { name: "Crear proyecto" }),
    ).not.toBeInTheDocument()
    sinSesion.unmount()

    iniciarSesionCon("PERSONA_COLABORADORA")
    renderizar()
    await screen.findByRole("link", { name: "Sitio web de la huerta" })
    expect(
      screen.queryByRole("link", { name: "Crear proyecto" }),
    ).not.toBeInTheDocument()
  })

  describe("con proyectos de dos colectivos", () => {
    const tarjetaDe = async (titulo) =>
      within((await screen.findByRole("link", { name: titulo })).closest("li"))

    beforeEach(() => {
      buscarProyectos.mockResolvedValue(
        pagina(
          1,
          [
            {
              ...proyecto("p1", "Mapa de comedores comunitarios"),
              colectivo: { id: "e1", nombre: "Red Solidaria Sur" },
            },
            proyecto("p2", "Sitio web de la huerta"),
          ],
          1,
        ),
      )
    })

    test("a un colectivo le marca cuáles son sus proyectos", async () => {
      iniciarSesionCon("COLECTIVO")

      renderizar()

      const propio = await tarjetaDe("Mapa de comedores comunitarios")
      expect(propio.getByText("Tu proyecto")).toBeInTheDocument()
      const ajeno = await tarjetaDe("Sitio web de la huerta")
      expect(ajeno.queryByText("Tu proyecto")).not.toBeInTheDocument()
    })

    test("sin sesión o con una persona colaboradora no marca ninguno", async () => {
      const sinSesion = renderizar()
      await screen.findByRole("link", { name: "Sitio web de la huerta" })
      expect(screen.queryByText("Tu proyecto")).not.toBeInTheDocument()
      sinSesion.unmount()

      // El id de la persona coincide con el del colectivo: no alcanza.
      iniciarSesionCon("PERSONA_COLABORADORA")
      renderizar()
      await screen.findByRole("link", { name: "Sitio web de la huerta" })
      expect(screen.queryByText("Tu proyecto")).not.toBeInTheDocument()
    })
  })
})
