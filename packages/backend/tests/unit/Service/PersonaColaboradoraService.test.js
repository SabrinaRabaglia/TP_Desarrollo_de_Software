import { beforeEach, describe, expect, test } from "@jest/globals"
import PersonaColaboradoraService from "../../../src/services/PersonaColaboradoraService.js"
import HabilidadService from "../../../src/services/HabilidadService.js"
import PersonaColaboradoraRepository from "../../fakes/PersonaColaboradoraRepository.js"
import ColaboracionRepository from "../../fakes/ColaboracionRepository.js"
import NotificacionRepository from "../../fakes/NotificacionRepository.js"
import PersonaColaboradora from "../../../src/domain/PersonaColaboradora.js"
import Cuenta from "../../../src/domain/Cuenta.js"
import Habilidad from "../../../src/domain/Habilidad.js"
import {
  EntityNotFound,
  InvalidReference,
} from "../../../src/errors/ApplicationErrors.js"
import { DomainValidationError } from "../../../src/domain/errors/DomainErrors.js"
import ProyectoRepository from "../../fakes/ProyectoRepository.js"

describe("PersonaColaboradoraService", () => {
  let repository
  let service
  let colaboracionRepository
  let notificacionRepository
  let habilidad
  let datos

  beforeEach(() => {
    const proyectoRepository = new ProyectoRepository()
    repository = new PersonaColaboradoraRepository()
    repository.deleteAll() // Limpiamos la memoria estática antes de cada test
    proyectoRepository.deleteAll()

    habilidad = new Habilidad("React", "react", "Desarrollo web")
    habilidad.id = "habilidad-1"
    const habilidadService = new HabilidadService({
      findById: async (id) => (id === habilidad.id ? habilidad : undefined),
    })
    colaboracionRepository = new ColaboracionRepository()
    notificacionRepository = new NotificacionRepository()
    service = new PersonaColaboradoraService(
      proyectoRepository,
      repository,
      habilidadService,
      colaboracionRepository,
      notificacionRepository,
    )
    datos = {
      nombreFantasia: "anon123",
      nombre: "Ana",
      cuentas: [{ nombreUsuario: "anagomez", tipo: "GITHUB" }],
      habilidades: [habilidad.id],
      aceptaMensajeriaInterna: true,
      mediosDeContacto: [{ tipo: "EMAIL", valor: "ana@example.com" }],
    }
  })

  test("crea y guarda una persona con cuentas, habilidades y datos de contacto resueltos", async () => {
    const persona = await service.create(datos)

    expect(persona).toBeInstanceOf(PersonaColaboradora)
    expect(persona.nombreFantasia).toBe(datos.nombreFantasia)
    expect(persona.cuentas[0]).toBeInstanceOf(Cuenta)
    expect(persona.cuentas).toEqual(datos.cuentas)
    expect(persona.habilidades).toEqual([habilidad])
    expect(persona.aceptaMensajeriaInterna).toBe(true)
    expect(persona.mediosDeContacto).toEqual(datos.mediosDeContacto)
    expect(await repository.findAll()).toEqual([persona])
  })

  test("rechaza una habilidad inexistente sin guardar la persona", async () => {
    await expect(
      service.create({
        ...datos,
        habilidades: [habilidad.id, "habilidad-inexistente"],
      }),
    ).rejects.toThrow(InvalidReference)

    expect(await repository.findAll()).toEqual([])
  })

  test("actualiza los datos, cuentas y habilidades conservando la identidad", async () => {
    const persona = await service.create({ nombreFantasia: "Original" })
    const id = persona.id

    const actualizada = await service.update(id, datos)

    expect(actualizada.id).toBe(id)
    expect(actualizada.nombreFantasia).toBe(datos.nombreFantasia)
    expect(actualizada.nombre).toBe(datos.nombre)
    expect(actualizada.cuentas[0]).toBeInstanceOf(Cuenta)
    expect(actualizada.cuentas).toEqual(datos.cuentas)
    expect(actualizada.habilidades).toEqual([habilidad])
    expect(actualizada.aceptaMensajeriaInterna).toBe(true)
    expect(actualizada.mediosDeContacto).toEqual(datos.mediosDeContacto)
    expect(await repository.findById(id)).toBe(actualizada)
    expect(await repository.findAll()).toHaveLength(1)
  })

  test("una actualización rechazada deja intactos los datos guardados", async () => {
    const persona = await service.create(datos)
    const antes = { ...persona }

    await expect(
      service.update(persona.id, {
        nombreFantasia: "No debe guardarse",
        habilidades: ["habilidad-inexistente"],
      }),
    ).rejects.toThrow(InvalidReference)

    expect(await repository.findById(persona.id)).toEqual(antes)
  })

  test("rechaza un nombre de fantasía vacío sin modificar la persona", async () => {
    const persona = await service.create(datos)
    const antes = { ...persona }

    await expect(
      service.update(persona.id, {
        ...datos,
        nombreFantasia: "",
        presentacion: "No debe guardarse",
      }),
    ).rejects.toThrow(DomainValidationError)

    expect(await repository.findById(persona.id)).toEqual(antes)
  })

  test("actualizar sin medios de contacto conserva los guardados y con una lista vacía los borra", async () => {
    const persona = await service.create(datos)
    const conservada = await service.update(persona.id, {
      ...datos,
      mediosDeContacto: undefined,
    })
    expect(conservada.mediosDeContacto).toEqual(datos.mediosDeContacto)

    const sinContacto = await service.update(persona.id, {
      ...datos,
      mediosDeContacto: [],
    })
    expect(sinContacto.mediosDeContacto).toEqual([])
  })

  test("rechaza un medio de contacto inválido al actualizar sin modificar la persona", async () => {
    const persona = await service.create(datos)
    const antes = { ...persona }

    await expect(
      service.update(persona.id, {
        ...datos,
        presentacion: "No debe guardarse",
        mediosDeContacto: [{ tipo: "EMAIL", valor: "no-es-un-email" }],
      }),
    ).rejects.toThrow(DomainValidationError)

    expect(await repository.findById(persona.id)).toEqual(antes)
  })

  test("eliminar una persona elimina sus colaboraciones y conserva las de otras", async () => {
    const persona = await service.create(datos)
    const proyecto = { id: "proyecto-1" }
    await colaboracionRepository.save({
      personaColaboradora: { id: persona.id },
      proyecto,
    })
    await colaboracionRepository.save({
      personaColaboradora: { id: "otra-persona" },
      proyecto,
    })

    await service.delete(persona.id)

    await expect(service.getById(persona.id)).rejects.toThrow(EntityNotFound)
    expect(await colaboracionRepository.findAll()).toEqual([
      { personaColaboradora: { id: "otra-persona" }, proyecto },
    ])
  })

  test("eliminar una persona elimina sus notificaciones y conserva las de otras", async () => {
    const persona = await service.create(datos)
    await notificacionRepository.save({
      personaColaboradora: { id: persona.id },
      fecha: new Date(),
    })
    const deOtra = await notificacionRepository.save({
      personaColaboradora: { id: "otra-persona" },
      fecha: new Date(),
    })

    await service.delete(persona.id)

    expect(
      await notificacionRepository.findByPersonaColaboradora(persona.id),
    ).toEqual([])
    expect(
      await notificacionRepository.findByPersonaColaboradora("otra-persona"),
    ).toEqual([deOtra])
  })

  test("elimina solo el medio de contacto indicado y conserva los demás", async () => {
    const persona = await service.create({
      ...datos,
      mediosDeContacto: [
        { tipo: "EMAIL", valor: "ana@example.com" },
        { tipo: "WHATSAPP", valor: "+5491123456789" },
      ],
    })
    persona.mediosDeContacto[0]._id = "contacto-1"
    persona.mediosDeContacto[1]._id = "contacto-2"
    await repository.save(persona)

    await service.deleteMedioDeContacto(persona.id, "contacto-1")

    expect((await repository.findById(persona.id)).mediosDeContacto).toEqual([
      { _id: "contacto-2", tipo: "WHATSAPP", valor: "+5491123456789" },
    ])
  })

  test("no elimina contactos si el medio indicado no existe", async () => {
    const persona = await service.create(datos)

    await expect(
      service.deleteMedioDeContacto(persona.id, "contacto-inexistente"),
    ).rejects.toThrow(EntityNotFound)

    expect((await repository.findById(persona.id)).mediosDeContacto).toEqual(
      datos.mediosDeContacto,
    )
  })
})
