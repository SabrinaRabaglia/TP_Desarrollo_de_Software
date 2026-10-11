import { describe, expect, test } from "@jest/globals"
import Proyecto from "../../../src/domain/Proyecto.js"
import TipoColectivo from "../../../src/domain/TipoColectivo.js"
import { EstadoProyecto } from "../../../src/domain/enums/EstadoProyecto.js"
import Colectivo from "../../../src/domain/Colectivo.js"
import { DomainValidationError, DomainRuleError } from "../../../src/domain/errors/DomainErrors.js"

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
      colectivo,
    )

    expect(proyecto.titulo).toBe("Limpieza del Río")
    expect(proyecto.descripcion).toBe("Jornada de recoleccion de residuos")
    expect(proyecto.colectivo).toBe(colectivo)
    expect(proyecto.estado).toEqual(EstadoProyecto.PUBLICADO)
    expect(proyecto.fechaAlta.getTime()).toBeGreaterThanOrEqual(
      fechaInicio.getTime(),
    )
    expect(proyecto.fechaCierre).toBeNull()
    expect(proyecto.perfiles).toEqual([])
    expect(proyecto.colaboraciones).toEqual([])
  })

  test("Se construye correctamente pasando todos los parámetros explícitos", () => {
    const fechaAlta = new Date("2026-09-11")
    const fechaCierre = new Date("2026-12-31")

    const proyecto = new Proyecto(
      "Taller de Reciclaje",
      "Capacitación comunitaria",
      colectivo,
      EstadoProyecto.PUBLICADO,
      fechaAlta,
      fechaCierre,
    )

    expect(proyecto.estado).toBe(EstadoProyecto.PUBLICADO)
    expect(proyecto.fechaAlta).toEqual(fechaAlta)
    expect(proyecto.fechaCierre).toEqual(fechaCierre)
  })

  test("compara las habilidades requeridas de todos los perfiles por ID y exige una coincidencia", () => {
    const proyecto = new Proyecto("Plataforma", "Desarrollo web", colectivo)
    const persona = { habilidades: [{ id: "javascript" }] }

    proyecto.perfiles = [{ habilidadesRequeridas: ["otra-habilidad"] }]
    expect(proyecto.poseeHabilidadNecesaria(persona)).toBe(false)

    proyecto.perfiles = [
      { habilidadesRequeridas: ["otra-habilidad"] },
      { habilidadesRequeridas: ["javascript"] },
    ]
    expect(proyecto.poseeHabilidadNecesaria(persona)).toBe(true)

    proyecto.perfiles = []
    expect(proyecto.poseeHabilidadNecesaria(persona)).toBe(false)
  })

  test("Falta el título del proyecto", () => {
    expect(
      () => new Proyecto(undefined, "Capacitación comunitaria", colectivo),
    ).toThrow(DomainValidationError)
  })

  test("Falta la descripción del proyecto", () => {
    expect(
      () => new Proyecto("Taller de Reciclaje", undefined, colectivo),
    ).toThrow(DomainValidationError)
  })

  test("Falta el colectivo del proyecto", () => {
    expect(
      () =>
        new Proyecto(
          "Taller de Reciclaje",
          "Capacitación comunitaria",
          undefined,
        ),
    ).toThrow(DomainValidationError)
  })

  test("cierra el proyecto conservando sus colaboraciones y la fecha del primer cierre", () => {
    const proyecto = new Proyecto(
      "Taller de Reciclaje",
      "Capacitación comunitaria",
      colectivo,
    )
    const colaboracion = { personaColaboradora: "persona-1" }
    proyecto.agregarColaboracion(colaboracion)
    const antes = Date.now()

    proyecto.cerrar()

    expect(proyecto.estado).toBe(EstadoProyecto.CERRADO)
    expect(proyecto.fechaCierre.getTime()).toBeGreaterThanOrEqual(antes)
    expect(proyecto.fechaCierre.getTime()).toBeLessThanOrEqual(Date.now())
    expect(proyecto.colaboraciones).toEqual([colaboracion])
    const fechaCierre = proyecto.fechaCierre
    expect(() => proyecto.cerrar()).toThrow(DomainRuleError)
    expect(proyecto.fechaCierre).toBe(fechaCierre)
  })

  test("rechaza reabrir un proyecto cerrado", () => {
    const proyecto = new Proyecto(
      "Taller de Reciclaje",
      "Capacitación comunitaria",
      colectivo,
    )
    proyecto.cerrar()

    expect(() =>
      proyecto.assertPuedeActualizarEstado(EstadoProyecto.PUBLICADO),
    ).toThrow(DomainRuleError)
  })

  test("rechaza un estado inválido", () => {
    expect(
      () =>
        new Proyecto(
          "Taller de Reciclaje",
          "Capacitación comunitaria",
          colectivo,
          "BORRADOR",
        ),
    ).toThrow(DomainValidationError)
  })

  test("rechaza una fecha de cierre anterior a la fecha de alta", () => {
    expect(
      () =>
        new Proyecto(
          "Taller de Reciclaje",
          "Capacitación comunitaria",
          colectivo,
          EstadoProyecto.PUBLICADO,
          new Date("2026-09-11"),
          new Date("2026-01-01"),
        ),
    ).toThrow(DomainValidationError)
  })
})
