import { beforeEach, describe, expect, jest, test } from "@jest/globals"
import NotificacionService from "../../../src/services/NotificacionService.js"
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
  NoAutorizado,
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
  let envios
  let proyectoService
  let perfilService
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
      proyectoRepository,
      personaColaboradoraRepository,
      habilidadService,
      colaboracionRepository,
    )
    perfilService = new PerfilService(
      proyectoService,
      proyectoRepository,
      habilidadService,
    )
    envios = { despertar: jest.fn() }
    notificacionRepository = new NotificacionRepository()
    service = new NotificacionService(
      notificacionRepository,
      perfilService,
      personaColaboradoraService,
      envios,
      proyectoRepository,
      colectivoRepository,
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
    service.create(colectivo.id, proyecto.id, perfil.id, {
      personaColaboradora,
      contenido,
    })

  describe("create", () => {
    test("guarda la notificación con un envío pendiente por cada medio de contacto y despierta al proceso de envío", async () => {
      const notificacion = await contactar(ana.id)

      expect(notificacion.contenido).toBe("Hola")
      expect(notificacion.colectivo).toBe(colectivo.id)
      expect(notificacion.personaColaboradora).toBe(ana)
      expect(notificacion.perfil).toBe(perfil.id)
      expect(notificacion.pendienteDeEnvio).toBe(true)
      expect(notificacion.mediosExternosUtilizados).toEqual([])
      expect(notificacion.envios.map((envio) => envio.medio)).toEqual([
        { tipo: "EMAIL", valor: "ana@example.com" },
        { tipo: "SMS", valor: "+54 9 11 2345-6789" },
      ])
      expect(notificacionRepository.notificaciones).toEqual([notificacion])
      expect(envios.despertar).toHaveBeenCalledTimes(1)
    })

    test("a una persona sin medios de contacto solo le llega el mensaje interno", async () => {
      const sol = await personaColaboradoraService.create({
        nombreFantasia: "sol.datos",
        aceptaMensajeriaInterna: true,
      })

      const notificacion = await contactar(sol.id)

      expect(notificacion.pendienteDeEnvio).toBe(false)
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
        expect(envios.despertar).not.toHaveBeenCalled()
        expect(notificacionRepository.notificaciones).toEqual([])
      },
    )

    test("un proyecto cerrado no puede contactar, sin enviar ni guardar nada", async () => {
      await proyectoService.update(proyecto.id, { estado: "CERRADO" })

      await expect(contactar(ana.id)).rejects.toThrow(DomainRuleError)
      expect(envios.despertar).not.toHaveBeenCalled()
      expect(notificacionRepository.notificaciones).toEqual([])
    })

    test("lanza EntityNotFound si el perfil no es del proyecto", async () => {
      await expect(
        service.create(colectivo.id, proyecto.id, "perfil-inexistente", {
          personaColaboradora: ana.id,
          contenido: "Hola",
        }),
      ).rejects.toThrow(EntityNotFound)
    })

    test("lanza NoAutorizado si el proyecto es de otro colectivo, sin enviar ni guardar nada", async () => {
      await expect(
        service.create("otro-colectivo", proyecto.id, perfil.id, {
          personaColaboradora: ana.id,
          contenido: "Hola",
        }),
      ).rejects.toThrow(NoAutorizado)
      expect(envios.despertar).not.toHaveBeenCalled()
      expect(notificacionRepository.notificaciones).toEqual([])
    })
  })

  describe("getAllByPersonaColaboradora", () => {
    test("devuelve cada notificación con el nombre del colectivo, el proyecto y el perfil", async () => {
      await contactar(ana.id, "Primera")

      expect(await service.getAllByPersonaColaboradora(ana.id)).toEqual([
        {
          id: expect.any(String),
          fecha: expect.any(Date),
          contenido: "Primera",
          colectivo: { id: colectivo.id, nombre: "Huerta Comunitaria Sur" },
          proyecto: { id: proyecto.id, titulo: "Sitio web de la huerta" },
          perfil: { id: perfil.id, nombre: perfil.nombre },
          pendienteDeEnvio: true,
          mediosExternosUtilizados: [],
        },
      ])
    })

    test("si el perfil ya no existe, lo devuelve en null sin fallar", async () => {
      await contactar(ana.id)
      await perfilService.delete(proyecto.id, perfil.id)

      const [mensaje] = await service.getAllByPersonaColaboradora(ana.id)

      expect(mensaje.perfil).toBeNull()
      expect(mensaje.proyecto).toBeNull()
      expect(mensaje.colectivo).toEqual({
        id: colectivo.id,
        nombre: "Huerta Comunitaria Sur",
      })
    })

    test("devuelve las notificaciones de la persona, de la más nueva a la más vieja", async () => {
      const sol = await personaColaboradoraService.create({
        nombreFantasia: "sol.datos",
        aceptaMensajeriaInterna: true,
      })
      const primera = await contactar(ana.id, "Primera")
      primera.fecha = new Date("2026-01-01T00:00:00.000Z")
      await contactar(ana.id, "Segunda")
      await contactar(sol.id)

      const mensajes = await service.getAllByPersonaColaboradora(ana.id)

      expect(mensajes.map((mensaje) => mensaje.contenido)).toEqual([
        "Segunda",
        "Primera",
      ])
    })

    test("lanza EntityNotFound si la persona no existe", async () => {
      await expect(
        service.getAllByPersonaColaboradora("persona-inexistente"),
      ).rejects.toThrow(EntityNotFound)
    })
  })
})
