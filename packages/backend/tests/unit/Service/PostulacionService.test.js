import { beforeEach, describe, expect, test } from "@jest/globals"
import PostulacionService from "../../../src/services/PostulacionService.js"
import PostulacionRepository from "../../fakes/PostulacionRepository.js"
import ProyectoRepository from "../../fakes/ProyectoRepository.js"
import ColectivoRepository from "../../fakes/ColectivoRepository.js"
import PersonaColaboradoraRepository from "../../fakes/PersonaColaboradoraRepository.js"
import Proyecto from "../../../src/domain/Proyecto.js"
import Perfil from "../../../src/domain/Perfil.js"
import PersonaColaboradora from "../../../src/domain/PersonaColaboradora.js"
import Habilidad from "../../../src/domain/Habilidad.js"
import { UnidadCompromiso } from "../../../src/domain/enums/UnidadCompromiso.js"
import { ModalidadColaboracion } from "../../../src/domain/enums/ModalidadColaboracion.js"
import {
  AlreadyExists,
  InvalidReference,
  NoAutorizado,
} from "../../../src/errors/ApplicationErrors.js"
import { DomainRuleError } from "../../../src/domain/errors/DomainErrors.js"

describe("PostulacionService", () => {
  let service,
    postulacionRepository,
    proyectoRepository,
    personaRepository,
    colectivoRepository,
    proyecto,
    perfil,
    persona,
    datos

  beforeEach(() => {
    proyectoRepository = new ProyectoRepository()
    personaRepository = new PersonaColaboradoraRepository()
    colectivoRepository = new ColectivoRepository()
    postulacionRepository = new PostulacionRepository()

    proyectoRepository.deleteAll()
    personaRepository.deleteAll()
    postulacionRepository.deleteAll()

    service = new PostulacionService(
      colectivoRepository,
      postulacionRepository,
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

    perfil = new Perfil({
      descripcion: "Desarrollo frontend",
      unidadCompromiso: UnidadCompromiso.HORAS_MENSUALES,
      cantidadHoras: 5,
      modalidadesColaboracion: [ModalidadColaboracion.GRATUITA],
      habilidadesRequeridas: [habilidad.id],
      habilidadesOpcionales: [habilidad.id],
    })
    perfil.id = "perfil-1"

    proyecto = new Proyecto("Plataforma", "Desarrollo web", "colectivo-1")
    proyecto.id = "proyecto-1"
    proyecto.perfiles = [perfil]
    proyectoRepository.save(proyecto)

    datos = {
      perfilId: perfil.id,
      personaColaboradoraId: persona.id,
      esAnonima: false,
    }
  })

  test("registra una postulación entre la persona y el perfil", async () => {
    const postulacion = await service.create(datos)

    expect(postulacion.personaColaboradora).toBe(persona.id)
    expect(postulacion.perfil).toBe(perfil.id)
    await expect(service.create(datos)).rejects.toThrow(AlreadyExists)
    expect(await postulacionRepository.findAll()).toEqual([postulacion])
  })

  test.each([
    [
      "perfil inexistente",
      async () => {
        datos.perfilId = "inexistente"
      },
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
      "habilidades sin coincidencia",
      async () => {
        persona.habilidades = []
      },
      DomainRuleError,
    ],
  ])(
    "rechaza %s sin registrar la postulación",
    async (_caso, preparar, error) => {
      await preparar()

      await expect(service.create(datos)).rejects.toThrow(error)
      expect(await postulacionRepository.findAll()).toEqual([])
    },
  )

  test("aceptar una postulación actualiza su estado y la agrega al perfil", async () => {
    const postulacion = await service.create(datos)
    const aceptada = await service.aceptar(postulacion.id, "colectivo-1")

    expect(aceptada.estado).toBe("ACEPTADA")
    expect(perfil.postulacionesAceptadas).toContain(postulacion.id)
  })

  test("no admite postulaciones a un perfil con la búsqueda cerrada", async () => {
    perfil.busquedaAbierta = false

    await expect(service.create(datos)).rejects.toThrow(
      "La búsqueda de colaboraciones para este perfil está cerrada.",
    )
    expect(
      await postulacionRepository.findAllByColaborador(persona.id),
    ).toEqual([])
  })

  test("con el perfil lleno, aceptar deja la postulación pendiente", async () => {
    const postulacion = await service.create(datos)
    perfil.limiteColaboraciones = 1
    perfil.postulacionesAceptadas = ["otra-postulacion"]

    await expect(
      service.aceptar(postulacion.id, "colectivo-1"),
    ).rejects.toThrow("Se alcanzó el límite de colaboradores para este perfil")
    expect(postulacion.estado).toBe("PENDIENTE")
    expect(perfil.postulacionesAceptadas).toEqual(["otra-postulacion"])
  })

  test("aceptar una postulación ya rechazada falla por su estado, aunque el perfil esté lleno", async () => {
    const postulacion = await service.create(datos)
    await service.rechazar(postulacion.id, "colectivo-1")
    perfil.limiteColaboraciones = 1
    perfil.postulacionesAceptadas = ["otra-postulacion"]

    await expect(
      service.aceptar(postulacion.id, "colectivo-1"),
    ).rejects.toThrow("Solo se pueden aceptar postulaciones pendientes")
    expect(postulacion.estado).toBe("RECHAZADA")
  })

  test("rechazar una postulación actualiza su estado a rechazada", async () => {
    const postulacion = await service.create(datos)
    const rechazada = await service.rechazar(postulacion.id, "colectivo-1")

    expect(rechazada.estado).toBe("RECHAZADA")
  })

  test.each(["aceptar", "rechazar"])(
    "otro colectivo no puede %s la postulación",
    async (accion) => {
      const postulacion = await service.create(datos)

      await expect(
        service[accion](postulacion.id, "otro-colectivo"),
      ).rejects.toThrow(NoAutorizado)
      expect(postulacion.estado).toBe("PENDIENTE")
      expect(perfil.postulacionesAceptadas).toEqual([])
    },
  )

  describe("darDeBaja", () => {
    const comoPersona = (id) => ({ rol: "PERSONA_COLABORADORA", entidad: id })
    const comoColectivo = (id) => ({ rol: "COLECTIVO", entidad: id })

    const postulacionAceptada = async () => {
      const postulacion = await service.create(datos)
      await service.aceptar(postulacion.id, "colectivo-1")
      return postulacion
    }

    test.each([
      [
        "la persona se da de baja",
        comoPersona("persona-1"),
        "PERSONA_COLABORADORA",
      ],
      [
        "el colectivo dueño la desanota",
        comoColectivo("colectivo-1"),
        "COLECTIVO",
      ],
    ])("%s y el perfil libera el lugar", async (_caso, usuario, origen) => {
      const postulacion = await postulacionAceptada()

      const dadaDeBaja = await service.darDeBaja(postulacion.id, usuario)

      expect(dadaDeBaja.estado).toBe("BAJA")
      expect(dadaDeBaja.origenBaja).toBe(origen)
      expect(dadaDeBaja.fechaBaja).toBeInstanceOf(Date)
      expect(perfil.postulacionesAceptadas).toEqual([])
    })

    test.each([
      ["otra persona", comoPersona("otra-persona")],
      ["otro colectivo", comoColectivo("otro-colectivo")],
    ])("%s no puede darla de baja", async (_caso, usuario) => {
      const postulacion = await postulacionAceptada()

      await expect(service.darDeBaja(postulacion.id, usuario)).rejects.toThrow(
        NoAutorizado,
      )
      expect(postulacion.estado).toBe("ACEPTADA")
      expect(perfil.postulacionesAceptadas).toEqual([postulacion.id])
    })

    test("una postulación pendiente no se puede dar de baja", async () => {
      const postulacion = await service.create(datos)

      await expect(
        service.darDeBaja(postulacion.id, comoPersona("persona-1")),
      ).rejects.toThrow(DomainRuleError)
      expect(postulacion.estado).toBe("PENDIENTE")
    })

    test("la baja es permanente: no se vuelve a postular ni a aceptar", async () => {
      const postulacion = await postulacionAceptada()
      await service.darDeBaja(postulacion.id, comoPersona("persona-1"))

      await expect(service.create(datos)).rejects.toThrow(AlreadyExists)
      await expect(
        service.aceptar(postulacion.id, "colectivo-1"),
      ).rejects.toThrow(DomainRuleError)
      expect(perfil.postulacionesAceptadas).toEqual([])
    })

    test("una postulación inexistente da InvalidReference", async () => {
      await expect(
        service.darDeBaja("inexistente", comoPersona("persona-1")),
      ).rejects.toThrow(InvalidReference)
    })
  })
})
