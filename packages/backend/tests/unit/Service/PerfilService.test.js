import { beforeEach, describe, expect, test } from "@jest/globals"
import PerfilService from "../../../src/services/PerfilService.js"
import ProyectoService from "../../../src/services/ProyectoService.js"
import ProyectoRepository from "../../fakes/ProyectoRepository.js"
import ColectivoService from "../../../src/services/ColectivoService.js"
import ColectivoRepository from "../../fakes/ColectivoRepository.js"
import TipoColectivoRepository from "../../fakes/TipoColectivoRepository.js"
import ProvinciaRepository from "../../fakes/ProvinciaRepository.js"
import PaisRepository from "../../fakes/PaisRepository.js"
import PostulacionRepository from "../../fakes/PostulacionRepository.js"
import HabilidadService from "../../../src/services/HabilidadService.js"
import HabilidadRepository from "../../fakes/HabilidadRepository.js"
import PersonaColaboradoraService from "../../../src/services/PersonaColaboradoraService.js"
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

describe("PerfilService", () => {
  let service
  let proyectoService
  let proyecto
  let otroProyecto
  let habilidad1
  let habilidad2
  let datos
  let personaColaboradoraService
  let postulacionRepository
  let habilidadService

  beforeEach(async () => {
    const proyectoRepository = new ProyectoRepository()
    const colectivoRepository = new ColectivoRepository()
    const habilidadRepository = new HabilidadRepository()
    const personaColaboradoraRepository = new PersonaColaboradoraRepository()
    postulacionRepository = new PostulacionRepository()

    personaColaboradoraRepository.deleteAll()
    proyectoRepository.deleteAll()
    colectivoRepository.deleteAll()
    habilidadRepository.deleteAll()

    const colectivoService = new ColectivoService(
      colectivoRepository,
      new TipoColectivoRepository(),
      proyectoRepository,
      new ProvinciaRepository(),
      new PaisRepository(),
    )
    habilidadService = new HabilidadService(habilidadRepository)
    proyectoService = new ProyectoService(
      proyectoRepository,
      colectivoRepository,
    )
    personaColaboradoraService = new PersonaColaboradoraService(
      proyectoRepository,
      personaColaboradoraRepository,
      habilidadService,
      postulacionRepository,
    )
    service = new PerfilService(
      proyectoService,
      proyectoRepository,
      habilidadService,
    )

    const colectivo = await colectivoService.create({
      nombre: "Asamblea Ambiental",
      descripcion: "Protección de humedales",
      tipo: "Asamblea",
    })
    proyecto = await proyectoService.create({
      titulo: "Plataforma de Colaboración",
      descripcion: "Plataforma para conectar colectivos sociales",
      colectivo: colectivo.id,
    })
    otroProyecto = await proyectoService.create({
      titulo: "Otro proyecto",
      descripcion: "Otro proyecto cualquiera",
      colectivo: colectivo.id,
    })

    habilidad1 = await habilidadService.create({
      titulo: "JavaScript",
      codigo: "javascript",
      descripcion: "Desarrollo con JavaScript",
    })
    habilidad2 = await habilidadService.create({
      titulo: "React",
      codigo: "react",
      descripcion: "Desarrollo con React",
    })

    datos = {
      nombre: "Tester",
      descripcion: "Perfil de testing",
      unidadCompromiso: UnidadCompromiso.HORAS_MENSUALES,
      cantidadHoras: 5,
      modalidadesColaboracion: [ModalidadColaboracion.GRATUITA],
      habilidadesRequeridas: [habilidad1.id],
      habilidadesOpcionales: [habilidad2.id],
    }
  })

  const perfilesDe = async (proyectoId) =>
    (await proyectoService.getById(proyectoId)).perfiles

  describe("create", () => {
    test("agrega el perfil al proyecto con las habilidades resueltas y lo devuelve", async () => {
      const perfil = await service.create(proyecto.id, datos)

      expect(perfil.id).toEqual(expect.any(String))
      expect(perfil.descripcion).toBe(datos.descripcion)
      expect(perfil.habilidadesRequeridas).toEqual([habilidad1])
      expect(perfil.habilidadesOpcionales).toEqual([habilidad2])
      expect(await perfilesDe(proyecto.id)).toEqual([perfil])
    })

    test("permite dos perfiles iguales en el mismo proyecto, con ids distintos", async () => {
      const primero = await service.create(proyecto.id, datos)
      const segundo = await service.create(proyecto.id, datos)

      expect(primero.id).not.toBe(segundo.id)
      expect(await perfilesDe(proyecto.id)).toHaveLength(2)
    })

    test("lanza EntityNotFound si el proyecto no existe", async () => {
      await expect(service.create("id-inexistente", datos)).rejects.toThrow(
        EntityNotFound,
      )
    })

    test.each(["habilidadesRequeridas", "habilidadesOpcionales"])(
      "lanza InvalidReference si una de %s no existe, sin crear el perfil",
      async (campo) => {
        await expect(
          service.create(proyecto.id, { ...datos, [campo]: ["inexistente"] }),
        ).rejects.toThrow(InvalidReference)
        expect(await perfilesDe(proyecto.id)).toEqual([])
      },
    )

    test("lanza DomainValidationError si el perfil es inválido, sin crearlo", async () => {
      await expect(
        service.create(proyecto.id, { ...datos, habilidadesRequeridas: [] }),
      ).rejects.toThrow(DomainValidationError)
      expect(await perfilesDe(proyecto.id)).toEqual([])
    })

    test("lanza DomainRuleError si el proyecto está cerrado", async () => {
      await proyectoService.update(proyecto.id, { estado: "CERRADO" })

      await expect(service.create(proyecto.id, datos)).rejects.toThrow(
        DomainRuleError,
      )
      expect(await perfilesDe(proyecto.id)).toEqual([])
    })
  })

  describe("consultas", () => {
    test("getAllByProyectoId devuelve solo los perfiles de ese proyecto", async () => {
      const perfil = await service.create(proyecto.id, datos)
      await service.create(otroProyecto.id, datos)

      expect(await service.getAllByProyectoId(proyecto.id)).toEqual([perfil])
    })

    test("getById devuelve el perfil dentro de su proyecto", async () => {
      const perfil = await service.create(proyecto.id, datos)

      expect(await service.getById(proyecto.id, perfil.id)).toBe(perfil)
    })

    test("getById lanza EntityNotFound si el perfil es de otro proyecto", async () => {
      const perfil = await service.create(otroProyecto.id, datos)

      await expect(service.getById(proyecto.id, perfil.id)).rejects.toThrow(
        EntityNotFound,
      )
    })

    test("lanza EntityNotFound si el proyecto no existe", async () => {
      await expect(
        service.getAllByProyectoId("id-inexistente"),
      ).rejects.toThrow(EntityNotFound)
    })
  })

  describe("búsqueda de colaboradores por perfiles", () => {
    const buscarColaboradores = (...perfiles) =>
      personaColaboradoraService.getAllByPerfiles(
        perfiles.map((perfil) => perfil.id),
      )

    const crearPersona = (nombreFantasia, habilidades) =>
      personaColaboradoraService.create({ nombreFantasia, habilidades })

    test("devuelve las personas que tienen todas las habilidades requeridas del perfil", async () => {
      const perfil = await service.create(proyecto.id, {
        ...datos,
        habilidadesRequeridas: [habilidad1.id, habilidad2.id],
        habilidadesOpcionales: [habilidad1.id],
      })
      const completa = await crearPersona("completa", [
        habilidad1.id,
        habilidad2.id,
      ])
      await crearPersona("solo javascript", [habilidad1.id])
      await crearPersona("sin habilidades", [])

      expect(await buscarColaboradores(perfil)).toEqual([completa])
    })

    test("tener solo habilidades opcionales no alcanza para aparecer", async () => {
      const perfil = await service.create(proyecto.id, datos)
      const conRequerida = await crearPersona("con requerida", [habilidad1.id])
      await crearPersona("solo opcional", [habilidad2.id])

      expect(await buscarColaboradores(perfil)).toEqual([conRequerida])
    })

    test("ordena primero a quienes tienen más habilidades opcionales del perfil", async () => {
      const habilidad3 = await new HabilidadService(
        new HabilidadRepository(),
      ).create({ titulo: "SQL", codigo: "sql", descripcion: "Bases de datos" })
      const perfil = await service.create(proyecto.id, {
        ...datos,
        habilidadesOpcionales: [habilidad2.id, habilidad3.id],
      })
      const ninguna = await crearPersona("ninguna", [habilidad1.id])
      const ambas = await crearPersona("ambas", [
        habilidad1.id,
        habilidad2.id,
        habilidad3.id,
      ])
      const una = await crearPersona("una", [habilidad1.id, habilidad3.id])

      expect(await buscarColaboradores(perfil)).toEqual([ambas, una, ninguna])
    })

    test("lanza DomainRuleError si el proyecto está cerrado", async () => {
      const perfil = await service.create(proyecto.id, datos)
      await crearPersona("con requerida", [habilidad1.id])
      await proyectoService.update(proyecto.id, { estado: "CERRADO" })

      await expect(buscarColaboradores(perfil)).rejects.toThrow(DomainRuleError)
    })

    test("no sugiere a quienes ya están inscriptos en el proyecto", async () => {
      const perfil = await service.create(proyecto.id, datos)
      const inscripta = await crearPersona("inscripta", [habilidad1.id])
      const enOtroProyecto = await crearPersona("en otro proyecto", [
        habilidad1.id,
      ])
      await postulacionRepository.save({
        personaColaboradora: { id: inscripta.id },
        proyecto: { id: proyecto.id },
      })
      await postulacionRepository.save({
        personaColaboradora: { id: enOtroProyecto.id },
        proyecto: { id: otroProyecto.id },
      })

      expect(await buscarColaboradores(perfil)).toEqual([enOtroProyecto])
    })

    test("lanza EntityNotFound si el perfil no existe", async () => {
      await expect(
        personaColaboradoraService.getAllByPerfiles(["perfil-inexistente"]),
      ).rejects.toThrow(EntityNotFound)
    })

    test("con varios perfiles no repite personas y las ordena por su mejor puntaje", async () => {
      const habilidad3 = await new HabilidadService(
        new HabilidadRepository(),
      ).create({ titulo: "SQL", codigo: "sql", descripcion: "Bases de datos" })
      const perfil = await service.create(proyecto.id, datos)
      const perfilConSql = await service.create(otroProyecto.id, {
        ...datos,
        habilidadesOpcionales: [habilidad3.id],
      })
      const soloJs = await crearPersona("solo javascript", [habilidad1.id])
      const conSql = await crearPersona("con sql", [
        habilidad1.id,
        habilidad3.id,
      ])

      expect(await buscarColaboradores(perfil, perfilConSql)).toEqual([
        conSql,
        soloJs,
      ])
    })
  })

  describe("update", () => {
    test("reemplaza los datos del perfil y lo devuelve", async () => {
      const perfil = await service.create(proyecto.id, datos)

      const actualizado = await service.update(proyecto.id, perfil.id, {
        ...datos,
        nombre: undefined,
        descripcion: "Descripción actualizada",
        habilidadesRequeridas: [habilidad2.id],
        habilidadesOpcionales: [habilidad1.id],
      })

      expect(actualizado.id).toBe(perfil.id)
      expect(actualizado.nombre).toBeNull()
      expect(actualizado.descripcion).toBe("Descripción actualizada")
      expect(actualizado.habilidadesRequeridas).toEqual([habilidad2])
      expect(actualizado.habilidadesOpcionales).toEqual([habilidad1])
      expect(await perfilesDe(proyecto.id)).toEqual([actualizado])
    })

    test.each([
      [
        "DomainValidationError",
        DomainValidationError,
        { habilidadesOpcionales: [] },
      ],
      [
        "InvalidReference",
        InvalidReference,
        { habilidadesRequeridas: ["inexistente"] },
      ],
    ])("lanza %s sin modificar el perfil", async (_nombre, error, cambio) => {
      const perfil = await service.create(proyecto.id, datos)
      const antes = { ...perfil }

      await expect(
        service.update(proyecto.id, perfil.id, { ...datos, ...cambio }),
      ).rejects.toThrow(error)
      expect({ ...(await service.getById(proyecto.id, perfil.id)) }).toEqual(
        antes,
      )
    })

    test("con dos perfiles idénticos, modifica solo el indicado", async () => {
      const gemelo = await service.create(proyecto.id, datos)
      const perfil = await service.create(proyecto.id, datos)

      await service.update(proyecto.id, perfil.id, {
        ...datos,
        descripcion: "Editado",
      })

      const [primero, segundo] = await perfilesDe(proyecto.id)
      expect(primero.id).toBe(gemelo.id)
      expect(primero.descripcion).toBe(datos.descripcion)
      expect(segundo.id).toBe(perfil.id)
      expect(segundo.descripcion).toBe("Editado")
    })

    test("lanza EntityNotFound si el perfil es de otro proyecto", async () => {
      const perfil = await service.create(otroProyecto.id, datos)

      await expect(
        service.update(proyecto.id, perfil.id, datos),
      ).rejects.toThrow(EntityNotFound)
    })

    test("lanza DomainRuleError si el proyecto está cerrado", async () => {
      const perfil = await service.create(proyecto.id, datos)
      await proyectoService.update(proyecto.id, { estado: "CERRADO" })

      await expect(
        service.update(proyecto.id, perfil.id, { ...datos, cantidadHoras: 20 }),
      ).rejects.toThrow(DomainRuleError)
      expect(
        (await service.getById(proyecto.id, perfil.id)).cantidadHoras,
      ).toBe(5)
    })
  })

  describe("delete", () => {
    test("elimina el perfil y conserva los demás", async () => {
      const perfil = await service.create(proyecto.id, datos)
      const otro = await service.create(proyecto.id, datos)

      await service.delete(proyecto.id, perfil.id)

      expect(await perfilesDe(proyecto.id)).toEqual([otro])
    })

    test("lanza EntityNotFound si el perfil es de otro proyecto, sin borrarlo", async () => {
      const perfil = await service.create(otroProyecto.id, datos)

      await expect(service.delete(proyecto.id, perfil.id)).rejects.toThrow(
        EntityNotFound,
      )
      expect(await perfilesDe(otroProyecto.id)).toEqual([perfil])
    })

    test("lanza DomainRuleError si el proyecto está cerrado", async () => {
      const perfil = await service.create(proyecto.id, datos)
      await proyectoService.update(proyecto.id, { estado: "CERRADO" })

      await expect(service.delete(proyecto.id, perfil.id)).rejects.toThrow(
        DomainRuleError,
      )
      expect(await perfilesDe(proyecto.id)).toEqual([perfil])
    })
  })
})
