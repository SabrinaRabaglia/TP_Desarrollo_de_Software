import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { obtenerHabilidades } from "../../service/habilidadesService"
import { modificarPerfil } from "../../service/proyectosService"
import EditarPerfil from "./EditarPerfil"

jest.mock("../../service/habilidadesService")
jest.mock("../../service/proyectosService")

const perfil = {
  id: "p1",
  nombre: "Tester",
  descripcion: "Probar la app antes de cada entrega",
  cantidadHoras: 4,
  habilidadesRequeridas: [{ id: "h1", titulo: "Testing manual" }],
  habilidadesOpcionales: [{ id: "h2", titulo: "Cypress" }],
  postulacionesAceptadas: ["post1", "post2"],
  limiteColaboraciones: 3,
  busquedaAbierta: true,
  busquedaAbiertaHasta: null,
}

const alCerrar = jest.fn()
const alGuardar = jest.fn()

const abrir = async (datos = {}) => {
  render(
    <EditarPerfil
      perfil={{ ...perfil, ...datos }}
      proyectoId="abc"
      alCerrar={alCerrar}
      alGuardar={alGuardar}
    />,
  )
  const dialogo = screen.getByRole("dialog", {
    name: "Editar el perfil Tester",
  })
  await within(dialogo).findByLabelText(/^Descripción/)
  return within(dialogo)
}

const guardar = (dialogo) =>
  userEvent.click(dialogo.getByRole("button", { name: "Guardar" }))

const requeridas = (dialogo) =>
  within(dialogo.getByRole("group", { name: "Habilidades requeridas" }))

const opcionales = (dialogo) =>
  within(dialogo.getByRole("group", { name: "Habilidades opcionales" }))

beforeEach(() => {
  obtenerHabilidades.mockResolvedValue([
    { id: "h1", titulo: "Testing manual" },
    { id: "h2", titulo: "Cypress" },
    { id: "h3", titulo: "React" },
  ])
  modificarPerfil.mockResolvedValue()
})

describe("EditarPerfil", () => {
  test("muestra los datos actuales del perfil", async () => {
    const dialogo = await abrir({
      busquedaAbiertaHasta: new Date(2099, 11, 31, 23, 59, 59),
    })

    expect(dialogo.getByLabelText(/^Descripción/)).toHaveValue(
      "Probar la app antes de cada entrega",
    )
    expect(dialogo.getByLabelText("Cantidad de horas")).toHaveValue(4)
    expect(dialogo.getByLabelText("Límite de colaboraciones")).toHaveValue(3)
    expect(dialogo.getByLabelText("Fecha límite de búsqueda")).toHaveValue(
      "2099-12-31",
    )
    expect(
      requeridas(dialogo).getByRole("checkbox", { name: "Testing manual" }),
    ).toBeChecked()
    expect(
      requeridas(dialogo).getByRole("checkbox", { name: "Cypress" }),
    ).not.toBeChecked()
    expect(
      opcionales(dialogo).getByRole("checkbox", { name: "Cypress" }),
    ).toBeChecked()
  })

  test("manda solo los campos que cambiaron", async () => {
    const dialogo = await abrir()

    userEvent.clear(dialogo.getByLabelText("Cantidad de horas"))
    userEvent.type(dialogo.getByLabelText("Cantidad de horas"), "6")
    guardar(dialogo)

    await screen.findByRole("button", { name: "Guardando..." })
    expect(modificarPerfil).toHaveBeenCalledWith("abc", "p1", {
      cantidadHoras: 6,
    })
    expect(dialogo.getByRole("button", { name: "Cancelar" })).toBeDisabled()
    await waitFor(() => expect(alGuardar).toHaveBeenCalledTimes(1))
  })

  test("no reenvía una fecha límite vencida que nadie tocó", async () => {
    const dialogo = await abrir({
      busquedaAbiertaHasta: new Date(2020, 0, 15, 23, 59, 59),
    })

    const descripcion = dialogo.getByLabelText(/^Descripción/)
    userEvent.clear(descripcion)
    userEvent.type(descripcion, "Probar cada entrega")
    guardar(dialogo)

    await screen.findByRole("button", { name: "Guardando..." })
    expect(modificarPerfil).toHaveBeenCalledWith("abc", "p1", {
      descripcion: "Probar cada entrega",
    })
  })

  test("el límite vacío viaja como null y la fecha como el final de ese día", async () => {
    const dialogo = await abrir()

    userEvent.clear(dialogo.getByLabelText("Límite de colaboraciones"))
    userEvent.type(
      dialogo.getByLabelText("Fecha límite de búsqueda"),
      "2099-12-31",
    )
    guardar(dialogo)

    await screen.findByRole("button", { name: "Guardando..." })
    expect(modificarPerfil).toHaveBeenCalledWith("abc", "p1", {
      limiteColaboraciones: null,
      busquedaAbiertaHasta: new Date(2099, 11, 31, 23, 59, 59).toISOString(),
    })
  })

  test("al vaciar la fecha límite la manda como null", async () => {
    const dialogo = await abrir({
      busquedaAbiertaHasta: new Date(2099, 11, 31, 23, 59, 59),
    })

    userEvent.clear(dialogo.getByLabelText("Fecha límite de búsqueda"))
    guardar(dialogo)

    await screen.findByRole("button", { name: "Guardando..." })
    expect(modificarPerfil).toHaveBeenCalledWith("abc", "p1", {
      busquedaAbiertaHasta: null,
    })
  })

  test("manda los ids de las habilidades elegidas", async () => {
    const dialogo = await abrir()

    userEvent.click(
      requeridas(dialogo).getByRole("checkbox", { name: "React" }),
    )
    userEvent.click(
      opcionales(dialogo).getByRole("checkbox", { name: "Cypress" }),
    )
    guardar(dialogo)

    await screen.findByRole("button", { name: "Guardando..." })
    expect(modificarPerfil).toHaveBeenCalledWith("abc", "p1", {
      habilidadesRequeridas: ["h1", "h3"],
      habilidadesOpcionales: [],
    })
  })

  test("si el back rechaza el límite, el mensaje queda en el diálogo con los datos", async () => {
    modificarPerfil.mockRejectedValue({
      response: {
        status: 409,
        data: {
          message:
            "El límite no puede ser menor a las colaboraciones ya aceptadas (2).",
        },
      },
    })
    const dialogo = await abrir()

    const limite = dialogo.getByLabelText("Límite de colaboraciones")
    userEvent.clear(limite)
    userEvent.type(limite, "1")
    guardar(dialogo)

    expect(await dialogo.findByRole("alert")).toHaveTextContent(
      "El límite no puede ser menor a las colaboraciones ya aceptadas (2).",
    )
    expect(modificarPerfil).toHaveBeenCalledWith("abc", "p1", {
      limiteColaboraciones: 1,
    })
    expect(limite).toHaveValue(1)
    expect(dialogo.getByRole("button", { name: "Guardar" })).toBeEnabled()
    expect(alGuardar).not.toHaveBeenCalled()
    expect(alCerrar).not.toHaveBeenCalled()
  })

  test("no deja guardar con la descripción vacía", async () => {
    const dialogo = await abrir()

    userEvent.clear(dialogo.getByLabelText(/^Descripción/))

    expect(
      dialogo.getByText("La descripción no puede quedar vacía."),
    ).toBeInTheDocument()
    expect(dialogo.getByRole("button", { name: "Guardar" })).toBeDisabled()
  })

  test("sin cambios cierra sin llamar al back", async () => {
    const dialogo = await abrir()

    guardar(dialogo)

    expect(alCerrar).toHaveBeenCalledTimes(1)
    expect(modificarPerfil).not.toHaveBeenCalled()
    expect(alGuardar).not.toHaveBeenCalled()
  })

  test("si no puede cargar las habilidades muestra el error y permite reintentar", async () => {
    obtenerHabilidades.mockRejectedValueOnce({
      response: { data: { message: "No pudimos cargar las habilidades" } },
    })
    render(
      <EditarPerfil
        perfil={perfil}
        proyectoId="abc"
        alCerrar={alCerrar}
        alGuardar={alGuardar}
      />,
    )

    expect(
      await screen.findByText("No pudimos cargar las habilidades"),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled()

    userEvent.click(screen.getByRole("button", { name: "Reintentar" }))

    expect(await screen.findByLabelText(/^Descripción/)).toBeInTheDocument()
  })
})
