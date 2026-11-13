import { beforeEach, describe, expect, test } from "@jest/globals"
import ColaboracionService from "../../../src/services/ColaboracionService.js"
import ColaboracionRepository from "../../fakes/ColaboracionRepository.js"
import ProyectoRepository from "../../fakes/ProyectoRepository.js"
import PersonaColaboradoraRepository from "../../fakes/PersonaColaboradoraRepository.js"
import Proyecto from "../../../src/domain/Proyecto.js"
import PersonaColaboradora from "../../../src/domain/PersonaColaboradora.js"
import Habilidad from "../../../src/domain/Habilidad.js"
import {
  AlreadyExists,
  InvalidReference,
} from "../../../src/errors/ApplicationErrors.js"
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
    habilidad.id = "habilidad-1"
    persona = new PersonaColaboradora("Ana")
    persona.id = "persona-1"
    persona.agregarHabilidad(habilidad)
    personaRepository.save(persona)
    proyecto = new Proyecto("Plataforma", "Desarrollo web", "colectivo-1")
    proyecto.busquedaAbierta = true
    proyecto.id = "proyecto-1"
    proyecto.perfiles = [
      {
        id: "perfil-1",
        habilidadesRequeridas: ["otra-habilidad", habilidad.id],
        limiteColaboraciones: null,
        admiteMasColaboraciones(cantidad) {
          return (
            this.limiteColaboraciones === null ||
            cantidad < this.limiteColaboraciones
          )
        },
      },
    ]
    proyectoRepository.save(proyecto)
    datos = {
      proyectoId: proyecto.id,
      personaColaboradoraId: persona.id,
      esAnonima: false,
    }
  })

  test("registra una única colaboración entre la persona y el proyecto", async () => {
    const colaboracion = await service.create(datos)

    expect(colaboracion.personaColaboradora).toBe(persona)
    expect(colaboracion.proyecto).toBe(proyecto)
    expect(colaboracion.perfilId).toBe("perfil-1")
    await expect(service.create(datos)).rejects.toThrow(AlreadyExists)
    expect(await service.getAll()).toEqual([colaboracion])
  })

  test("rechaza nuevas colaboraciones cuando se alcanza el cupo del perfil", async () => {
    proyecto.perfiles[0].limiteColaboraciones = 1
    await service.create(datos)

    const otraPersona = new PersonaColaboradora("Bruno")
    otraPersona.id = "persona-2"
    otraPersona.agregarHabilidad(persona.habilidades[0])
    await personaRepository.save(otraPersona)

    await expect(
      service.create({
        ...datos,
        personaColaboradoraId: otraPersona.id,
      }),
    ).rejects.toThrow("Se alcanzó el límite de colaboraciones para el perfil.")
    expect(await service.getAll()).toHaveLength(1)
  })

  test.each([
    [
      "proyecto inexistente",
      async () => await proyectoRepository.deleteById(proyecto.id),
      InvalidReference,
    ],
    [
      "persona inexistente",
      async () => await personaRepository.deleteById(persona.id),
      InvalidReference,
    ],
    [
      "proyecto cerrado",
      async () => {
        proyecto.estado = "CERRADO"
      },
      DomainRuleError,
    ],
    [
      "búsqueda cerrada",
      async () => {
        proyecto.busquedaAbierta = false
      },
      DomainRuleError,
    ],
    [
      "fecha límite vencida",
      async () => {
        proyecto.busquedaAbiertaHasta = new Date("2020-01-01")
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
      "proyecto sin perfiles (sin habilidades requeridas)",
      async () => {
        proyecto.perfiles = []
      },
      DomainRuleError,
    ],
  ])(
    "rechaza %s sin registrar la colaboración",
    async (_caso, preparar, error) => {
      preparar()

      await expect(service.create(datos)).rejects.toThrow(error)
      expect(await service.getAll()).toEqual([])
    },
  )
})
