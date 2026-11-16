import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { obtenerHabilidades } from "../../service/habilidadesService"
import { agregarPerfil, modificarPerfil } from "../../service/proyectosService"
import FormularioDePerfil from "./FormularioDePerfil"

jest.mock("../../service/habilidadesService")
jest.mock("../../service/proyectosService", () => ({
  ...jest.requireActual("../../service/proyectosService"),
  agregarPerfil: jest.fn(),
  modificarPerfil: jest.fn(),
}))

const perfil = {
  id: "p1",
  nombre: "Tester",
  descripcion: "Probar la app antes de cada entrega",
  cantidadHoras: 4,
  unidadCompromiso: "HORAS_SEMANALES",
  modalidadesColaboracion: ["GRATUITA"],
  habilidadesRequeridas: [{ id: "h1", titulo: "Testing manual" }],
  habilidadesOpcionales: [{ id: "h2", titulo: "Cypress" }],
  postulacionesAceptadas: ["post1", "post2"],
  limiteColaboraciones: 3,
  busquedaAbierta: true,
  busquedaAbiertaHasta: null,
}

const alCerrar = jest.fn()
const alGuardar = jest.fn()

const abrirCon = async (perfilAEditar, titulo) => {
  render(
    <FormularioDePerfil
      perfil={perfilAEditar}
      proyectoId="abc"
      alCerrar={alCerrar}
      alGuardar={alGuardar}
    />,
  )
  const dialogo = screen.getByRole("dialog", { name: titulo })
  await within(dialogo).findByLabelText(/^Descripción/)
  return within(dialogo)
}

const abrir = (datos = {}) =>
  abrirCon({ ...perfil, ...datos }, "Editar el perfil Tester")

const abrirParaAgregar = () => abrirCon(undefined, "Agregar un perfil")

const guardar = (dialogo) =>
  userEvent.click(dialogo.getByRole("button", { name: "Guardar" }))

const agregar = (dialogo) =>
  userEvent.click(dialogo.getByRole("button", { name: "Agregar perfil" }))

const modalidades = (dialogo) =>
  within(dialogo.getByRole("group", { name: "Modalidades de colaboración" }))

const elegirUnidad = (dialogo, unidad) => {
  userEvent.click(
    dialogo.getByRole("combobox", { name: /^Unidad de compromiso/ }),
  )
  userEvent.click(screen.getByRole("option", { name: unidad }))
}

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
  agregarPerfil.mockResolvedValue()
})

describe("FormularioDePerfil al editar", () => {
  test("muestra los datos actuales del perfil", async () => {
    const dialogo = await abrir({
      busquedaAbiertaHasta: new Date(2099, 11, 31, 23, 59, 59),
    })

    expect(dialogo.getByLabelText(/^Nombre/)).toHaveValue("Tester")
    expect(dialogo.getByLabelText(/^Descripción/)).toHaveValue(
      "Probar la app antes de cada entrega",
    )
    expect(dialogo.getByLabelText(/^Cantidad de horas/)).toHaveValue(4)
    expect(
      dialogo.getByRole("combobox", { name: /^Unidad de compromiso/ }),
    ).toHaveTextContent("horas por semana")
    expect(
      modalidades(dialogo).getByRole("checkbox", { name: "Gratuita" }),
    ).toBeChecked()
    expect(
      modalidades(dialogo).getByRole("checkbox", {
        name: "Con incentivo económico",
      }),
    ).not.toBeChecked()
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

    userEvent.clear(dialogo.getByLabelText(/^Cantidad de horas/))
    userEvent.type(dialogo.getByLabelText(/^Cantidad de horas/), "6")
    guardar(dialogo)

    await screen.findByRole("button", { name: "Guardando..." })
    expect(modificarPerfil).toHaveBeenCalledWith("abc", "p1", {
      cantidadHoras: 6,
    })
    expect(dialogo.getByRole("button", { name: "Cancelar" })).toBeDisabled()
    await waitFor(() => expect(alGuardar).toHaveBeenCalledWith("Tester"))
  })

  test("también deja cambiar el nombre, la unidad y las modalidades", async () => {
    const dialogo = await abrir()

    const nombre = dialogo.getByLabelText(/^Nombre/)
    userEvent.clear(nombre)
    userEvent.type(nombre, "Testing")
    elegirUnidad(dialogo, "horas por mes")
    userEvent.click(
      modalidades(dialogo).getByRole("checkbox", {
        name: "Con incentivo económico",
      }),
    )
    guardar(dialogo)

    await waitFor(() => expect(alGuardar).toHaveBeenCalledWith("Testing"))
    expect(modificarPerfil).toHaveBeenCalledWith("abc", "p1", {
      nombre: "Testing",
      unidadCompromiso: "HORAS_MENSUALES",
      modalidadesColaboracion: ["GRATUITA", "CON_INCENTIVO_ECONOMICO"],
    })
    expect(agregarPerfil).not.toHaveBeenCalled()
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

  test("no guarda con la descripción vacía y marca qué falta", async () => {
    const dialogo = await abrir()

    userEvent.clear(dialogo.getByLabelText(/^Descripción/))
    guardar(dialogo)

    expect(
      dialogo.getByText("La descripción no puede quedar vacía."),
    ).toBeInTheDocument()
    expect(dialogo.getByRole("alert")).toHaveTextContent(
      "Completá los campos marcados para poder guardar.",
    )
    expect(modificarPerfil).not.toHaveBeenCalled()
    expect(alCerrar).not.toHaveBeenCalled()
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
      <FormularioDePerfil
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

describe("FormularioDePerfil al agregar", () => {
  test("manda el perfil completo y avisa con su nombre", async () => {
    const dialogo = await abrirParaAgregar()

    userEvent.type(dialogo.getByLabelText(/^Nombre/), "Diseño de interfaces")
    userEvent.type(
      dialogo.getByLabelText(/^Descripción/),
      "Diseñar las pantallas del sitio",
    )
    userEvent.type(dialogo.getByLabelText(/^Cantidad de horas/), "10")
    elegirUnidad(dialogo, "horas en total")
    userEvent.click(
      modalidades(dialogo).getByRole("checkbox", { name: "Gratuita" }),
    )
    userEvent.click(
      modalidades(dialogo).getByRole("checkbox", {
        name: "Con posibilidad de contratación",
      }),
    )
    userEvent.click(
      requeridas(dialogo).getByRole("checkbox", { name: "React" }),
    )
    userEvent.click(
      opcionales(dialogo).getByRole("checkbox", { name: "Cypress" }),
    )
    userEvent.type(dialogo.getByLabelText("Límite de colaboraciones"), "2")
    userEvent.type(
      dialogo.getByLabelText("Fecha límite de búsqueda"),
      "2099-12-31",
    )
    agregar(dialogo)

    await screen.findByRole("button", { name: "Agregando..." })
    expect(agregarPerfil).toHaveBeenCalledWith("abc", {
      nombre: "Diseño de interfaces",
      descripcion: "Diseñar las pantallas del sitio",
      cantidadHoras: 10,
      unidadCompromiso: "HORAS_TOTALES",
      modalidadesColaboracion: ["GRATUITA", "CON_POSIBILIDAD_CONTRATACION"],
      habilidadesRequeridas: ["h3"],
      habilidadesOpcionales: ["h2"],
      limiteColaboraciones: 2,
      busquedaAbiertaHasta: new Date(2099, 11, 31, 23, 59, 59).toISOString(),
    })
    await waitFor(() =>
      expect(alGuardar).toHaveBeenCalledWith("Diseño de interfaces"),
    )
    expect(modificarPerfil).not.toHaveBeenCalled()
  })

  test("sin límite ni fecha, los dos viajan como null", async () => {
    const dialogo = await abrirParaAgregar()

    userEvent.type(dialogo.getByLabelText(/^Nombre/), "Tester")
    userEvent.type(dialogo.getByLabelText(/^Descripción/), "Probar la app")
    userEvent.type(dialogo.getByLabelText(/^Cantidad de horas/), "4")
    elegirUnidad(dialogo, "horas por semana")
    userEvent.click(
      modalidades(dialogo).getByRole("checkbox", { name: "Gratuita" }),
    )
    userEvent.click(
      requeridas(dialogo).getByRole("checkbox", { name: "Testing manual" }),
    )
    agregar(dialogo)

    await waitFor(() => expect(alGuardar).toHaveBeenCalledTimes(1))
    expect(agregarPerfil).toHaveBeenCalledWith(
      "abc",
      expect.objectContaining({
        habilidadesOpcionales: [],
        limiteColaboraciones: null,
        busquedaAbiertaHasta: null,
      }),
    )
  })

  test("vacío no se manda: marca cada dato que falta", async () => {
    const dialogo = await abrirParaAgregar()

    agregar(dialogo)

    expect(dialogo.getByRole("alert")).toHaveTextContent(
      "Completá los campos marcados para poder guardar.",
    )
    for (const mensaje of [
      "El nombre no puede quedar vacío.",
      "La descripción no puede quedar vacía.",
      "Indicá la cantidad de horas.",
      "Elegí la unidad de compromiso.",
      "Elegí al menos una modalidad de colaboración.",
      "Elegí al menos una habilidad requerida.",
    ]) {
      expect(dialogo.getByText(mensaje)).toBeInTheDocument()
    }
    expect(agregarPerfil).not.toHaveBeenCalled()

    userEvent.type(dialogo.getByLabelText(/^Nombre/), "Tester")

    expect(
      dialogo.queryByText("El nombre no puede quedar vacío."),
    ).not.toBeInTheDocument()
  })

  test("si el back lo rechaza, su mensaje queda en el diálogo con los datos", async () => {
    agregarPerfil.mockRejectedValue({
      response: {
        status: 400,
        data: {
          message: "El perfil debe tener al menos una habilidad opcional.",
        },
      },
    })
    const dialogo = await abrirParaAgregar()

    userEvent.type(dialogo.getByLabelText(/^Nombre/), "Tester")
    userEvent.type(dialogo.getByLabelText(/^Descripción/), "Probar la app")
    userEvent.type(dialogo.getByLabelText(/^Cantidad de horas/), "4")
    elegirUnidad(dialogo, "horas por semana")
    userEvent.click(
      modalidades(dialogo).getByRole("checkbox", { name: "Gratuita" }),
    )
    userEvent.click(
      requeridas(dialogo).getByRole("checkbox", { name: "Testing manual" }),
    )
    agregar(dialogo)

    expect(await dialogo.findByRole("alert")).toHaveTextContent(
      "El perfil debe tener al menos una habilidad opcional.",
    )
    expect(dialogo.getByLabelText(/^Nombre/)).toHaveValue("Tester")
    expect(
      dialogo.getByRole("button", { name: "Agregar perfil" }),
    ).toBeEnabled()
    expect(alGuardar).not.toHaveBeenCalled()
    expect(alCerrar).not.toHaveBeenCalled()
  })
})
