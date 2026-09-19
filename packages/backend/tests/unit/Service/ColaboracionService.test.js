import { beforeEach, describe, expect, test } from "@jest/globals"
import ColaboracionService from "../../../src/services/ColaboracionService.js"
import ColaboracionRepository from "../../../src/repositories/ColaboracionRepository.js"
import ProyectoRepository from "../../../src/repositories/ProyectoRepository.js"
import PersonaColaboradoraRepository from "../../../src/repositories/PersonaColaboradoraRepository.js"
import Proyecto from "../../../src/domain/Proyecto.js"
import PersonaColaboradora from "../../../src/domain/PersonaColaboradora.js"
import Habilidad from "../../../src/domain/Habilidad.js"
import { AlreadyExists, EntityNotFound } from "../../../src/errors/ApplicationErrors.js"
import { DomainRuleError } from "../../../src/domain/errors/DomainErrors.js"

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

  test("registra una única colaboración y la vincula con ambas entidades", async () => {
    const colaboracion = await service.create(datos)

    expect(colaboracion.personaColaboradora).toBe(persona)
    expect(colaboracion.proyecto).toBe(proyecto)
    await expect(service.create(datos)).rejects.toThrow(AlreadyExists)
    expect(await service.getAll()).toEqual([colaboracion])
    expect(persona.colaboraciones).toEqual([colaboracion])
    expect(proyecto.colaboraciones).toEqual([colaboracion])
  })

  test.each([
    [
      "proyecto inexistente",
      async () => await proyectoRepository.delete(proyecto.id),
      EntityNotFound,
    ],
    [
      "persona inexistente",
      async () => await personaRepository.deleteById(persona.id),
      EntityNotFound,
    ],
    [
      "proyecto cerrado",
      async () => {
        proyecto.estado = "CERRADO"
      },
      DomainRuleError,
    ],
    [
      "habilidades sin coincidencia",
      async () => {
        persona.habilidades = []
      },
      DomainRuleError,
    ],
    [
      "proyecto sin habilidades requeridas",
      async () => {
        proyecto.habilidadesRequeridas = []
      },
      DomainRuleError,
    ],
  ])(
    "rechaza %s sin registrar ni asociar la colaboración",
    async (_caso, preparar, error) => {
      preparar()

      await expect(service.create(datos)).rejects.toThrow(error)
      expect(await service.getAll()).toEqual([])
      expect(persona.colaboraciones).toEqual([])
      expect(proyecto.colaboraciones).toEqual([])
    },
  )
})
