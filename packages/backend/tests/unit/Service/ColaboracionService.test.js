import { beforeEach, describe, expect, test } from "@jest/globals"
import ColaboracionService from "../../../src/services/ColaboracionService.js"
import ColaboracionRepository from "../../../src/repositories/ColaboracionRepository.js"
import ProyectoRepository from "../../../src/repositories/ProyectoRepository.js"
import PersonaColaboradoraRepository from "../../../src/repositories/PersonaColaboradoraRepository.js"
import Proyecto from "../../../src/domain/Proyecto.js"
import PersonaColaboradora from "../../../src/domain/PersonaColaboradora.js"
import Habilidad from "../../../src/domain/Habilidad.js"
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnprocessableEntityError,
} from "../../../src/errors/AppError.js"

describe("ColaboracionService", () => {
  let service, proyectoRepository, personaRepository, proyecto, persona, datos

  beforeEach(() => {
    proyectoRepository = new ProyectoRepository()
    personaRepository = new PersonaColaboradoraRepository()
    service = new ColaboracionService(
      new ColaboracionRepository(),
      proyectoRepository,
      personaRepository,
    )
    const habilidad = new Habilidad(
      "JavaScript",
      "javascript",
      "Desarrollo web",
    )
    persona = new PersonaColaboradora("Ana")
    persona.agregarHabilidad(habilidad)
    personaRepository.save(persona)
    proyecto = new Proyecto(
      "Plataforma",
      "Desarrollo web",
      "HORAS_TOTALES",
      5,
      "colectivo-1",
      ["GRATUITA"],
    )
    proyecto.id = "proyecto-1"
    proyecto.habilidadesRequeridas = ["otra-habilidad", habilidad.id]
    proyectoRepository.save(proyecto)
    datos = { proyectoId: proyecto.id, personaColaboradoraId: persona.id }
  })

  test("registra una única colaboración y la vincula con ambas entidades", () => {
    const colaboracion = service.create(datos)

    expect(colaboracion.personaColaboradora).toBe(persona)
    expect(colaboracion.proyecto).toBe(proyecto)
    expect(() => service.create(datos)).toThrow(ConflictError)
    expect(service.getAll()).toEqual([colaboracion])
    expect(persona.colaboraciones).toEqual([colaboracion])
    expect(proyecto.colaboraciones).toEqual([colaboracion])
  })

  test.each([
    [
      "proyecto inexistente",
      () => proyectoRepository.delete(proyecto.id),
      NotFoundError,
    ],
    [
      "persona inexistente",
      () => personaRepository.deleteById(persona.id),
      NotFoundError,
    ],
    [
      "proyecto cerrado",
      () => {
        proyecto.estado = "CERRADO"
      },
      UnprocessableEntityError,
    ],
    [
      "habilidades sin coincidencia",
      () => {
        persona.habilidades = []
      },
      BadRequestError,
    ],
    [
      "proyecto sin habilidades requeridas",
      () => {
        proyecto.habilidadesRequeridas = []
      },
      BadRequestError,
    ],
  ])(
    "rechaza %s sin registrar ni asociar la colaboración",
    (_caso, preparar, error) => {
      preparar()

      expect(() => service.create(datos)).toThrow(error)
      expect(service.getAll()).toEqual([])
      expect(persona.colaboraciones).toEqual([])
      expect(proyecto.colaboraciones).toEqual([])
    },
  )
})
