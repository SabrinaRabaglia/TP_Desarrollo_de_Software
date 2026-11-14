import { fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { buscarColectivos } from "../../service/colectivoService"
import {
  actualizarPerfil,
  actualizarProyecto,
  crearPerfil,
  crearProyecto,
  eliminarProyecto,
  obtenerHabilidades,
  obtenerProyectoParaEditar,
} from "../../service/proyectosService"
import FormularioProyecto from "./FormularioProyecto"

jest.mock("../../service/colectivoService", () => ({
  buscarColectivos: jest.fn(),
}))

jest.mock("../../service/proyectosService", () => ({
  actualizarPerfil: jest.fn(),
  actualizarProyecto: jest.fn(),
  crearPerfil: jest.fn(),
  crearProyecto: jest.fn(),
  eliminarPerfil: jest.fn(),
  eliminarProyecto: jest.fn(),
  ESTADOS_DE_PROYECTO: {
    PUBLICADO: "Publicado",
    CERRADO: "Cerrado",
  },
  MODALIDADES_DE_COLABORACION: {
    GRATUITA: "Gratuita",
    CON_INCENTIVO_ECONOMICO: "Con incentivo económico",
    CON_POSIBILIDAD_CONTRATACION: "Con posibilidad de contratación",
  },
  obtenerHabilidades: jest.fn(),
  obtenerProyectoParaEditar: jest.fn(),
  UNIDADES_DE_COMPROMISO: {
    HORAS_TOTALES: "horas en total",
    HORAS_SEMANALES: "horas por semana",
    HORAS_MENSUALES: "horas por mes",
  },
}))

const colectivos = [{ id: "c1", nombre: "Huerta Comunitaria" }]
const habilidades = [
  { id: "h1", titulo: "React" },
  { id: "h2", titulo: "TypeScript" },
]

const renderizarFormulario = (ruta) =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/proyectos/nuevo" element={<FormularioProyecto />} />
        <Route path="/proyectos/:id/editar" element={<FormularioProyecto />} />
        <Route path="/proyectos/:id" element={<h1>Detalle del proyecto</h1>} />
        <Route path="/" element={<h1>Inicio</h1>} />
      </Routes>
    </MemoryRouter>,
  )

const elegirOpcion = async (etiqueta, opcion) => {
  fireEvent.mouseDown(screen.getByRole("combobox", { name: etiqueta }))
  fireEvent.click(await screen.findByRole("option", { name: opcion }))
  const listbox = screen.queryByRole("listbox")
  if (listbox) fireEvent.keyDown(listbox, { key: "Escape" })
}

beforeEach(() => {
  jest.clearAllMocks()
  buscarColectivos.mockResolvedValue(colectivos)
  obtenerHabilidades.mockResolvedValue(habilidades)
})

describe("FormularioProyecto", () => {
  test("crea el proyecto y sus perfiles con las habilidades seleccionadas", async () => {
    crearProyecto.mockResolvedValue({ id: "proyecto-1" })
    crearPerfil.mockResolvedValue({ id: "perfil-1" })

    renderizarFormulario("/proyectos/nuevo?colectivo=c1")

    fireEvent.change(
      await screen.findByRole("textbox", { name: "Título del proyecto" }),
      { target: { value: "Sitio para la huerta" } },
    )
    fireEvent.change(screen.getByRole("textbox", { name: "Descripción" }), {
      target: { value: "Publicar talleres y cosechas" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Agregar perfil" }))
    fireEvent.change(
      screen.getByRole("textbox", { name: "Descripción del perfil" }),
      {
        target: { value: "Desarrollar la interfaz" },
      },
    )
    await elegirOpcion("Habilidades requeridas", "React")
    await elegirOpcion("Habilidades opcionales", "TypeScript")
    fireEvent.click(screen.getByRole("button", { name: "Crear proyecto" }))

    expect(
      await screen.findByRole("heading", { name: "Detalle del proyecto" }),
    ).toBeInTheDocument()
    expect(crearProyecto).toHaveBeenCalledWith({
      titulo: "Sitio para la huerta",
      descripcion: "Publicar talleres y cosechas",
      colectivo: "c1",
      estado: "PUBLICADO",
      fechaCierre: null,
      busquedaAbierta: false,
      busquedaAbiertaHasta: null,
    })
    expect(crearPerfil).toHaveBeenCalledWith("proyecto-1", {
      nombre: undefined,
      descripcion: "Desarrollar la interfaz",
      unidadCompromiso: "HORAS_SEMANALES",
      cantidadHoras: 1,
      modalidadesColaboracion: ["GRATUITA"],
      habilidadesRequeridas: ["h1"],
      habilidadesOpcionales: ["h2"],
      limiteColaboraciones: null,
    })
  })

  test("carga y actualiza el cupo de un perfil existente", async () => {
    obtenerProyectoParaEditar.mockResolvedValue({
      id: "proyecto-1",
      titulo: "Sitio para la huerta",
      descripcion: "Descripción anterior",
      colectivo: "c1",
      estado: "PUBLICADO",
      fechaCierre: null,
      busquedaAbierta: false,
      perfiles: [
        {
          id: "perfil-1",
          nombre: "Frontend",
          descripcion: "Desarrollar la interfaz",
          unidadCompromiso: "HORAS_SEMANALES",
          cantidadHoras: 4,
          modalidadesColaboracion: ["GRATUITA"],
          habilidadesRequeridas: ["h1"],
          habilidadesOpcionales: ["h2"],
          limiteColaboraciones: 2,
        },
      ],
    })
    actualizarProyecto.mockResolvedValue({ id: "proyecto-1" })
    actualizarPerfil.mockResolvedValue({ id: "perfil-1" })

    renderizarFormulario("/proyectos/proyecto-1/editar")

    fireEvent.change(
      await screen.findByRole("spinbutton", {
        name: "Cupo máximo de colaboraciones",
      }),
      { target: { value: "3" } },
    )
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }))

    expect(
      await screen.findByRole("heading", { name: "Detalle del proyecto" }),
    ).toBeInTheDocument()
    expect(actualizarProyecto).toHaveBeenCalledWith("proyecto-1", {
      titulo: "Sitio para la huerta",
      descripcion: "Descripción anterior",
      colectivo: "c1",
      estado: "PUBLICADO",
      fechaCierre: null,
      busquedaAbierta: false,
      busquedaAbiertaHasta: null,
    })
    expect(actualizarPerfil).toHaveBeenCalledWith("proyecto-1", "perfil-1", {
      nombre: "Frontend",
      descripcion: "Desarrollar la interfaz",
      unidadCompromiso: "HORAS_SEMANALES",
      cantidadHoras: 4,
      modalidadesColaboracion: ["GRATUITA"],
      habilidadesRequeridas: ["h1"],
      habilidadesOpcionales: ["h2"],
      limiteColaboraciones: 3,
    })
  })

  test("pide confirmación antes de eliminar el proyecto", async () => {
    obtenerProyectoParaEditar.mockResolvedValue({
      id: "proyecto-1",
      titulo: "Sitio para la huerta",
      descripcion: "Descripción",
      colectivo: "c1",
      estado: "PUBLICADO",
      fechaCierre: null,
      perfiles: [],
    })
    eliminarProyecto.mockResolvedValue()

    renderizarFormulario("/proyectos/proyecto-1/editar")

    fireEvent.click(
      await screen.findByRole("button", { name: "Eliminar proyecto" }),
    )
    const dialogo = await screen.findByRole("dialog")
    fireEvent.click(
      within(dialogo).getByRole("button", { name: "Eliminar proyecto" }),
    )

    expect(
      await screen.findByRole("heading", { name: "Inicio" }),
    ).toBeInTheDocument()
    expect(eliminarProyecto).toHaveBeenCalledWith("proyecto-1")
  })

  test("guarda los perfiles antes de cerrar el proyecto", async () => {
    obtenerProyectoParaEditar.mockResolvedValue({
      id: "proyecto-1",
      titulo: "Sitio para la huerta",
      descripcion: "Descripción",
      colectivo: "c1",
      estado: "PUBLICADO",
      fechaCierre: null,
      perfiles: [
        {
          id: "perfil-1",
          nombre: "Frontend",
          descripcion: "Desarrollar la interfaz",
          unidadCompromiso: "HORAS_SEMANALES",
          cantidadHoras: 4,
          modalidadesColaboracion: ["GRATUITA"],
          habilidadesRequeridas: ["h1"],
          habilidadesOpcionales: ["h2"],
          limiteColaboraciones: null,
        },
      ],
    })
    actualizarPerfil.mockResolvedValue({ id: "perfil-1" })
    actualizarProyecto.mockResolvedValue({ id: "proyecto-1" })

    renderizarFormulario("/proyectos/proyecto-1/editar")
    await screen.findByRole("heading", { name: "Editar proyecto" })
    await elegirOpcion("Estado", "Cerrado")
    fireEvent.click(screen.getByRole("button", { name: "Cerrar proyecto" }))

    expect(
      await screen.findByRole("heading", { name: "Detalle del proyecto" }),
    ).toBeInTheDocument()
    expect(actualizarPerfil.mock.invocationCallOrder[0]).toBeLessThan(
      actualizarProyecto.mock.invocationCallOrder[0],
    )
    expect(actualizarProyecto).toHaveBeenCalledWith("proyecto-1", {
      titulo: "Sitio para la huerta",
      descripcion: "Descripción",
      colectivo: "c1",
      estado: "CERRADO",
      fechaCierre: null,
      busquedaAbierta: false,
      busquedaAbiertaHasta: null,
    })
  })
})
