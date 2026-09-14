import { describe, expect, test } from "@jest/globals"
import Proyecto from "../../../src/domain/Proyecto.js"
import TipoColectivo from "../../../src/domain/TipoColectivo.js"
import { UnidadCompromiso } from "../../../src/domain/enums/UnidadCompromiso.js"
import { EstadoProyecto } from "../../../src/domain/enums/EstadoProyecto.js"
import Colectivo from "../../../src/domain/Colectivo.js"
import { ModalidadColaboracion } from "../../../src/domain/enums/ModalidadColaboracion.js"
import Habilidad from "../../../src/domain/Habilidad.js"
import { UnprocessableEntityError } from "../../../src/errors/AppError.js"
describe("Proyecto", () => {
  const tipoColectivo = new TipoColectivo("Asamblea")
  const colectivo = new Colectivo(
    "Asamblea Ambiental",
    "Protección de humedales",
    tipoColectivo,
  )

  test("Se construye correctamente con valores por defecto", () => {
    const fechaInicio = new Date()
    const proyecto = new Proyecto(
      "Limpieza del Río",
      "Jornada de recoleccion de residuos",
      UnidadCompromiso.HORAS_SEMANALES,
      4,
      colectivo,
      [ModalidadColaboracion.GRATUITA],
    )

    expect(proyecto.titulo).toBe("Limpieza del Río")
    expect(proyecto.descripcion).toBe("Jornada de recoleccion de residuos")
    expect(proyecto.unidadCompromiso).toBe(UnidadCompromiso.HORAS_SEMANALES)
    expect(proyecto.cantHoras).toBe(4)
    expect(proyecto.colectivo).toBe(colectivo)

    expect(proyecto.modalidadesColaboracion).toEqual([
      ModalidadColaboracion.GRATUITA,
    ])
    expect(proyecto.estado).toEqual(EstadoProyecto.PUBLICADO)
    expect(proyecto.fechaAlta.getTime()).toBeGreaterThanOrEqual(
      fechaInicio.getTime(),
    )
    expect(proyecto.fechaCierre).toBeNull()
    expect(proyecto.habilidadesRequeridas).toEqual([])
    expect(proyecto.colaboraciones).toEqual([])
  })
  test("Se construye correctamente pasando todos los parámetros explícitos", () => {
    const fechaAlta = new Date("2026-09-11")
    const fechaCierre = new Date("2026-12-31")
    const modalidades = [
      ModalidadColaboracion.GRATUITA,
      ModalidadColaboracion.CON_POSIBILIDAD_CONTRATACION,
    ]
    const hab1 = new Habilidad("Java", "java", "Programación en Java")
    const hab2 = new Habilidad(
      "Gestión de Residuos",
      "gestion_de_residuos",
      "Manejo de residuos urbanos",
    )
    const habilidades = [hab1, hab2]

    const proyecto = new Proyecto(
      "Taller de Reciclaje",
      "Capacitación comunitaria",
      UnidadCompromiso.HORAS_MENSUALES,
      10,
      colectivo,
      modalidades,
      EstadoProyecto.PUBLICADO,
      fechaAlta,
      fechaCierre,
      habilidades,
    )

    expect(proyecto.modalidadesColaboracion).toEqual([
      ModalidadColaboracion.GRATUITA,
      ModalidadColaboracion.CON_POSIBILIDAD_CONTRATACION,
    ])
    expect(proyecto.estado).toBe(EstadoProyecto.PUBLICADO)
    expect(proyecto.fechaAlta).toEqual(fechaAlta)
    expect(proyecto.fechaCierre).toEqual(fechaCierre)
    expect(proyecto.habilidadesRequeridas).toEqual([hab1, hab2])
  })
  test("compara las habilidades requeridas por ID y exige una coincidencia", () => {
    const proyecto = new Proyecto(
      "Plataforma",
      "Desarrollo web",
      UnidadCompromiso.HORAS_TOTALES,
      5,
      colectivo,
      [ModalidadColaboracion.GRATUITA],
    )
    const habilidad = new Habilidad("JavaScript", "javascript", "Desarrollo")
    const persona = { habilidades: [habilidad] }

    proyecto.habilidadesRequeridas = ["otra-habilidad", habilidad.id]
    expect(proyecto.poseeHabilidadNecesaria(persona)).toBe(true)
    proyecto.habilidadesRequeridas = ["otra-habilidad"]
    expect(proyecto.poseeHabilidadNecesaria(persona)).toBe(false)
    proyecto.habilidadesRequeridas = []
    expect(proyecto.poseeHabilidadNecesaria(persona)).toBe(false)
  })

  test("Falta el título del proyecto", () => {
    expect(
      () =>
        new Proyecto(
          undefined,
          "Capacitación comunitaria",
          UnidadCompromiso.HORAS_MENSUALES,
          10,
          colectivo,
          [ModalidadColaboracion.GRATUITA],
        ),
    ).toThrow(UnprocessableEntityError)
  })

  test("Falta la descripción del proyecto", () => {
    expect(
      () =>
        new Proyecto(
          "Taller de Reciclaje",
          undefined,
          UnidadCompromiso.HORAS_MENSUALES,
          10,
          colectivo,
          [ModalidadColaboracion.GRATUITA],
        ),
    ).toThrow(UnprocessableEntityError)
  })

  test("Falta la unidad de compromiso del proyecto", () => {
    expect(
      () =>
        new Proyecto(
          "Taller de Reciclaje",
          "Capacitación comunitaria",
          undefined,
          10,
          colectivo,
          [ModalidadColaboracion.GRATUITA],
        ),
    ).toThrow(UnprocessableEntityError)
  })

  test("Falta la cantidad de horas del proyecto", () => {
    expect(
      () =>
        new Proyecto(
          "Taller de Reciclaje",
          "Capacitación comunitaria",
          UnidadCompromiso.HORAS_MENSUALES,
          undefined,
          colectivo,
          [ModalidadColaboracion.GRATUITA],
        ),
    ).toThrow(UnprocessableEntityError)
  })

  test("Falta el colectivo del proyecto", () => {
    expect(
      () =>
        new Proyecto(
          "Taller de Reciclaje",
          "Capacitación comunitaria",
          UnidadCompromiso.HORAS_MENSUALES,
          10,
          undefined,
          [ModalidadColaboracion.GRATUITA],
        ),
    ).toThrow(UnprocessableEntityError)
  })
})
