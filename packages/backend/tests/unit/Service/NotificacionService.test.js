import { beforeEach, describe, expect, jest, test } from "@jest/globals"
import NotificacionService from "../../../src/services/NotificacionService.js"
import NotificadorExterno from "../../../src/services/NotificadorExterno.js"
import PerfilService from "../../../src/services/PerfilService.js"
import ProyectoService from "../../../src/services/ProyectoService.js"
import ColectivoService from "../../../src/services/ColectivoService.js"
import HabilidadService from "../../../src/services/HabilidadService.js"
import PersonaColaboradoraService from "../../../src/services/PersonaColaboradoraService.js"
import NotificacionRepository from "../../fakes/NotificacionRepository.js"
import ProyectoRepository from "../../fakes/ProyectoRepository.js"
import ColectivoRepository from "../../fakes/ColectivoRepository.js"
import TipoColectivoRepository from "../../fakes/TipoColectivoRepository.js"
import ProvinciaRepository from "../../fakes/ProvinciaRepository.js"
import PaisRepository from "../../fakes/PaisRepository.js"
import ColaboracionRepository from "../../fakes/ColaboracionRepository.js"
import HabilidadRepository from "../../fakes/HabilidadRepository.js"
import PersonaColaboradoraRepository from "../../fakes/PersonaColaboradoraRepository.js"
import {
  EntityNotFound,
  InvalidReference,
} from "../../../src/errors/ApplicationErrors.js"
import {
  DomainRuleError,
  DomainValidationError,
} from "../../../src/domain/errors/DomainErrors.js"
import { UnidadCompromiso } from "../../../src/domain/enums/UnidadCompromiso.js"
import { ModalidadColaboracion } from "../../../src/domain/enums/ModalidadColaboracion.js"

describe("NotificacionService", () => {
  let service
  let notificacionRepository
  let canales
  let proyectoService
  let personaColaboradoraService
  let colectivo
  let proyecto
  let perfil
  let ana

  beforeEach(async () => {
    const proyectoRepository = new ProyectoRepository()
    const colectivoRepository = new ColectivoRepository()
    const habilidadRepository = new HabilidadRepository()
    const personaColaboradoraRepository = new PersonaColaboradoraRepository()
    proyectoRepository.deleteAll()
    colectivoRepository.deleteAll()
    habilidadRepository.deleteAll()
    personaColaboradoraRepository.deleteAll()

    const colaboracionRepository = new ColaboracionRepository()
    const habilidadService = new HabilidadService(habilidadRepository)
    const colectivoService = new ColectivoService(
      colectivoRepository,
      new TipoColectivoRepository(),
      proyectoRepository,
      new ProvinciaRepository(),
      new PaisRepository(),
    )
    proyectoService = new ProyectoService(
      proyectoRepository,
      colectivoRepository,
      colaboracionRepository,
    )
    personaColaboradoraService = new PersonaColaboradoraService(
      personaColaboradoraRepository,
      habilidadService,
      colaboracionRepository,
    )
    const perfilService = new PerfilService(
      proyectoService,
      proyectoRepository,
      habilidadService,
      personaColaboradoraService,
      colaboracionRepository,
    )
    canales = {
      EMAIL: { enviar: jest.fn(async () => {}) },
      WHATSAPP: { enviar: jest.fn(async () => {}) },
      SMS: { enviar: jest.fn(async () => {}) },
    }
    notificacionRepository = new NotificacionRepository()
    service = new NotificacionService(
      notificacionRepository,
      perfilService,
      personaColaboradoraService,
      new NotificadorExterno(canales),
    )

    colectivo = await colectivoService.create({
      nombre: "Huerta Comunitaria Sur",
      descripcion: "Huertas urbanas",
      tipo: "Asociación barrial",
    })
    proyecto = await proyectoService.create({
      titulo: "Sitio web de la huerta",
      descripcion: "Publicar el calendario de talleres",
      colectivo: colectivo.id,
    })
    const javascript = await habilidadService.create({
      titulo: "JavaScript",
      codigo: "javascript",
      descripcion: "Desarrollo con JavaScript",
    })
    perfil = await perfilService.create(proyecto.id, {
      descripcion: "Desarrollo frontend",
      unidadCompromiso: UnidadCompromiso.HORAS_SEMANALES,
      cantidadHoras: 4,
      modalidadesColaboracion: [ModalidadColaboracion.GRATUITA],
      habilidadesRequeridas: [javascript.id],
      habilidadesOpcionales: [javascript.id],
    })
    ana = await personaColaboradoraService.create({
      nombreFantasia: "anag",
      aceptaMensajeriaInterna: true,
      mediosDeContacto: [
        { tipo: "EMAIL", valor: "ana@example.com" },
        { tipo: "SMS", valor: "+54 9 11 2345-6789" },
      ],
    })
  })

  const contactar = (personaColaboradora, contenido = "Hola") =>
    service.create(proyecto.id, perfil.id, { personaColaboradora, contenido })

  describe("create", () => {
    test("guarda la notificación del colectivo del proyecto y la replica por los medios de contacto", async () => {
      const notificacion = await contactar(ana.id)

      expect(notificacion.contenido).toBe("Hola")
      expect(notificacion.colectivo).toBe(colectivo.id)
      expect(notificacion.personaColaboradora).toBe(ana)
      expect(notificacion.perfil).toBe(perfil)
      expect(notificacion.mediosExternosUtilizados).toEqual(
        ana.mediosDeContacto,
      )
      expect(canales.EMAIL.enviar).toHaveBeenCalledWith(
        "ana@example.com",
        "Hola",
      )
      expect(canales.SMS.enviar).toHaveBeenCalledWith(
        "+54 9 11 2345-6789",
        "Hola",
      )
      expect(notificacionRepository.notificaciones).toEqual([notificacion])
    })

    test("si un canal externo falla, la notificación interna se guarda igual", async () => {
      jest.spyOn(console, "error").mockImplementation(() => {})
      canales.SMS.enviar.mockRejectedValue(new Error("SMS caído"))

      const notificacion = await contactar(ana.id)

      expect(notificacion.mediosExternosUtilizados).toEqual([
        ana.mediosDeContacto[0],
      ])
      expect(notificacionRepository.notificaciones).toEqual([notificacion])
      jest.restoreAllMocks()
    })

    test("a una persona sin medios de contacto solo le llega el mensaje interno", async () => {
      const sol = await personaColaboradoraService.create({
        nombreFantasia: "sol.datos",
        aceptaMensajeriaInterna: true,
      })

      const notificacion = await contactar(sol.id)

      expect(notificacion.mediosExternosUtilizados).toEqual([])
      expect(notificacionRepository.notificaciones).toEqual([notificacion])
    })

    test.each([
      [
        "la persona no acepta mensajería interna",
        DomainRuleError,
        async () =>
          (await personaColaboradoraService.create({ nombreFantasia: "anon" }))
            .id,
        "Hola",
      ],
      [
        "el contenido está vacío",
        DomainValidationError,
        async () => ana.id,
        " ",
      ],
      [
        "la persona no existe",
        InvalidReference,
        async () => "persona-inexistente",
        "Hola",
      ],
    ])(
      "lanza un error si %s, sin enviar ni guardar nada",
      async (_caso, error, destinataria, contenido) => {
        await expect(
          contactar(await destinataria(), contenido),
        ).rejects.toThrow(error)
        expect(canales.EMAIL.enviar).not.toHaveBeenCalled()
        expect(notificacionRepository.notificaciones).toEqual([])
      },
    )

    test("un proyecto cerrado no puede contactar, sin enviar ni guardar nada", async () => {
      await proyectoService.update(proyecto.id, { estado: "CERRADO" })

      await expect(contactar(ana.id)).rejects.toThrow(DomainRuleError)
      expect(canales.EMAIL.enviar).not.toHaveBeenCalled()
      expect(notificacionRepository.notificaciones).toEqual([])
    })

    test("lanza EntityNotFound si el perfil no es del proyecto", async () => {
      await expect(
        service.create(proyecto.id, "perfil-inexistente", {
          personaColaboradora: ana.id,
          contenido: "Hola",
        }),
      ).rejects.toThrow(EntityNotFound)
    })
  })

  describe("getAllByPersonaColaboradora", () => {
    test("devuelve las notificaciones de la persona, de la más nueva a la más vieja", async () => {
      const sol = await personaColaboradoraService.create({
        nombreFantasia: "sol.datos",
        aceptaMensajeriaInterna: true,
      })
      const primera = await contactar(ana.id, "Primera")
      primera.fecha = new Date("2026-01-01T00:00:00.000Z")
      const segunda = await contactar(ana.id, "Segunda")
      await contactar(sol.id)

      expect(await service.getAllByPersonaColaboradora(ana.id)).toEqual([
        segunda,
        primera,
      ])
    })

    test("lanza EntityNotFound si la persona no existe", async () => {
      await expect(
        service.getAllByPersonaColaboradora("persona-inexistente"),
      ).rejects.toThrow(EntityNotFound)
    })
  })
})
