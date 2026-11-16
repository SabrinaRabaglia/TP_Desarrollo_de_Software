import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { ProveedorDeAvisos } from "../../context/AvisosContext"
import {
  cerrarProyecto,
  eliminarProyecto,
} from "../../service/proyectosService"
import GestionDelProyecto from "./GestionDelProyecto"

jest.mock("../../service/proyectosService")

const proyecto = {
  id: "abc",
  titulo: "Sitio web de la huerta",
  estado: "PUBLICADO",
}

const alModificar = jest.fn()

const renderizar = () =>
  render(
    <ProveedorDeAvisos>
      <MemoryRouter initialEntries={["/proyectos/abc"]}>
        <Routes>
          <Route path="/" element={<h1>Inicio</h1>} />
          <Route
            path="/proyectos/:id"
            element={
              <GestionDelProyecto
                proyecto={proyecto}
                alModificar={alModificar}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    </ProveedorDeAvisos>,
  )

const pedir = async (accion) => {
  userEvent.click(screen.getByRole("button", { name: accion }))
  return await screen.findByRole("dialog", { name: accion })
}

beforeEach(() => {
  cerrarProyecto.mockResolvedValue()
  eliminarProyecto.mockResolvedValue()
  alModificar.mockResolvedValue()
})

describe("GestionDelProyecto", () => {
  test("cierra el proyecto después de confirmar que no se puede deshacer", async () => {
    renderizar()

    const dialogo = await pedir("Cerrar proyecto")
    expect(dialogo).toHaveTextContent(
      "Esta acción no se puede deshacer: un proyecto cerrado no se vuelve a abrir.",
    )
    expect(cerrarProyecto).not.toHaveBeenCalled()

    userEvent.click(within(dialogo).getByRole("button", { name: "Sí, cerrar" }))

    expect(
      await screen.findByText("Cerraste el proyecto Sitio web de la huerta."),
    ).toBeInTheDocument()
    expect(cerrarProyecto).toHaveBeenCalledWith("abc")
    expect(alModificar).toHaveBeenCalledTimes(1)
    expect(eliminarProyecto).not.toHaveBeenCalled()
  })

  test("borra el proyecto después de confirmar y vuelve al inicio", async () => {
    renderizar()

    const dialogo = await pedir("Borrar proyecto")
    expect(dialogo).toHaveTextContent(
      "Vas a borrar Sitio web de la huerta con todos sus perfiles y logros. Esta acción no se puede deshacer.",
    )
    expect(eliminarProyecto).not.toHaveBeenCalled()

    userEvent.click(within(dialogo).getByRole("button", { name: "Sí, borrar" }))

    expect(
      await screen.findByRole("heading", { name: "Inicio" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Borraste el proyecto Sitio web de la huerta."),
    ).toBeInTheDocument()
    expect(eliminarProyecto).toHaveBeenCalledWith("abc")
  })

  test("si cancela, no cierra ni borra nada", async () => {
    renderizar()

    for (const accion of ["Cerrar proyecto", "Borrar proyecto"]) {
      const dialogo = await pedir(accion)
      userEvent.click(within(dialogo).getByRole("button", { name: "Cancelar" }))
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      )
    }

    expect(cerrarProyecto).not.toHaveBeenCalled()
    expect(eliminarProyecto).not.toHaveBeenCalled()
  })

  test("si el back rechaza el cierre muestra su mensaje y el proyecto sigue en pantalla", async () => {
    cerrarProyecto.mockRejectedValue({
      response: {
        status: 409,
        data: { message: "El proyecto ya está cerrado." },
      },
    })
    renderizar()

    const dialogo = await pedir("Cerrar proyecto")
    userEvent.click(within(dialogo).getByRole("button", { name: "Sí, cerrar" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El proyecto ya está cerrado.",
    )
    expect(alModificar).not.toHaveBeenCalled()
    expect(screen.queryByText(/Cerraste el proyecto/)).not.toBeInTheDocument()
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Cerrar proyecto" }),
      ).toBeEnabled(),
    )
  })

  test("si el back rechaza el borrado muestra su mensaje y no sale de la página", async () => {
    eliminarProyecto.mockRejectedValue({
      response: {
        status: 403,
        data: { message: "El proyecto no pertenece al colectivo autenticado" },
      },
    })
    renderizar()

    const dialogo = await pedir("Borrar proyecto")
    userEvent.click(within(dialogo).getByRole("button", { name: "Sí, borrar" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El proyecto no pertenece al colectivo autenticado",
    )
    expect(
      screen.queryByRole("heading", { name: "Inicio" }),
    ).not.toBeInTheDocument()
  })
})
