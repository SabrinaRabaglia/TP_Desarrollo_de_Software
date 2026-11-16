import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { AuthProvider } from "../../context/AuthContext"
import { ProveedorDeAvisos } from "../../context/AvisosContext"
import { crearProyecto } from "../../service/proyectosService"
import NuevoProyecto from "./NuevoProyecto"

jest.mock("../../service/proyectosService")

const renderizar = () =>
  render(
    <AuthProvider>
      <ProveedorDeAvisos>
        <MemoryRouter initialEntries={["/proyectos/nuevo"]}>
          <Routes>
            <Route path="/proyectos/nuevo" element={<NuevoProyecto />} />
            <Route
              path="/proyectos/:id"
              element={<h1>Página del proyecto</h1>}
            />
          </Routes>
        </MemoryRouter>
      </ProveedorDeAvisos>
    </AuthProvider>,
  )

const completar = () => {
  userEvent.type(screen.getByLabelText(/^Título/), "Mapa de humedales")
  userEvent.type(
    screen.getByLabelText(/^Descripción/),
    "Relevar los humedales del barrio",
  )
}

const crear = () =>
  userEvent.click(screen.getByRole("button", { name: "Crear proyecto" }))

beforeEach(() => {
  localStorage.setItem(
    "sesion",
    JSON.stringify({
      token: "token",
      usuario: { id: "u1", rol: "COLECTIVO", entidad: { id: "c1" } },
    }),
  )
})

afterEach(() => {
  localStorage.clear()
})

describe("NuevoProyecto", () => {
  test("crea el proyecto del colectivo de la sesión y lleva a su página", async () => {
    crearProyecto.mockResolvedValue("p9")
    renderizar()

    completar()
    userEvent.type(
      screen.getByLabelText("Enlace al código fuente"),
      " https://git.example.org/humedales ",
    )
    crear()

    expect(
      await screen.findByRole("heading", { name: "Página del proyecto" }),
    ).toBeInTheDocument()
    expect(crearProyecto).toHaveBeenCalledWith("c1", {
      titulo: "Mapa de humedales",
      descripcion: "Relevar los humedales del barrio",
      enlaceSistema: null,
      enlaceRepositorio: "https://git.example.org/humedales",
    })
    expect(
      screen.getByText(
        "Creaste el proyecto. Ahora agregale los perfiles que buscás.",
      ),
    ).toBeInTheDocument()
  })

  test("mientras se crea lo avisa y no deja enviarlo dos veces", async () => {
    crearProyecto.mockReturnValue(new Promise(() => {}))
    renderizar()

    completar()
    crear()

    expect(
      await screen.findByRole("button", { name: "Creando..." }),
    ).toBeDisabled()
  })

  test("si el back lo rechaza muestra su mensaje y conserva lo escrito", async () => {
    crearProyecto.mockRejectedValue({
      response: {
        status: 409,
        data: { message: "Ya existe un proyecto con ese título" },
      },
    })
    renderizar()

    completar()
    crear()

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ya existe un proyecto con ese título",
    )
    expect(screen.getByLabelText(/^Título/)).toHaveValue("Mapa de humedales")
    expect(screen.getByRole("button", { name: "Crear proyecto" })).toBeEnabled()
    expect(
      screen.queryByRole("heading", { name: "Página del proyecto" }),
    ).not.toBeInTheDocument()
  })

  test("sin título ni descripción no se envía y dice qué falta", () => {
    renderizar()

    crear()

    expect(
      screen.getByText("El título no puede quedar vacío."),
    ).toBeInTheDocument()
    expect(
      screen.getByText("La descripción no puede quedar vacía."),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/^Título/)).toHaveFocus()
    expect(crearProyecto).not.toHaveBeenCalled()
  })

  test("un enlace que no es una dirección web no se envía", () => {
    renderizar()

    completar()
    userEvent.type(
      screen.getByLabelText("Enlace al sistema en funcionamiento"),
      "humedales punto org",
    )
    crear()

    expect(
      screen.getByText(
        "Tiene que ser una dirección web completa, como https://ejemplo.org",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText("Enlace al sistema en funcionamiento"),
    ).toHaveFocus()
    expect(crearProyecto).not.toHaveBeenCalled()
  })
})
