import { beforeEach, describe, expect, test } from "@jest/globals"
import AuthService from "../../../src/services/AuthService.js"
import HabilidadService from "../../../src/services/HabilidadService.js"
import PersonaColaboradoraService from "../../../src/services/PersonaColaboradoraService.js"
import Colectivo from "../../../src/domain/Colectivo.js"
import Habilidad from "../../../src/domain/Habilidad.js"
import PersonaColaboradora from "../../../src/domain/PersonaColaboradora.js"
import { RolUsuario } from "../../../src/domain/enums/RolUsuario.js"
import { verificar } from "../../../src/auth/tokens.js"
import {
  AlreadyExists,
  CredencialesInvalidas,
  EntityNotFound,
  InvalidReference,
} from "../../../src/errors/ApplicationErrors.js"
import ColaboracionRepository from "../../fakes/ColaboracionRepository.js"
import ColectivoRepository from "../../fakes/ColectivoRepository.js"
import HabilidadRepository from "../../fakes/HabilidadRepository.js"
import NotificacionRepository from "../../fakes/NotificacionRepository.js"
import PersonaColaboradoraRepository from "../../fakes/PersonaColaboradoraRepository.js"
import ProyectoRepository from "../../fakes/ProyectoRepository.js"
import UsuarioRepository from "../../fakes/UsuarioRepository.js"

const crearService = (usuarioRepository = new UsuarioRepository()) =>
  new AuthService(
    usuarioRepository,
    new ColectivoRepository(),
    new PersonaColaboradoraRepository(),
    new PersonaColaboradoraService(
      new ProyectoRepository(),
      new PersonaColaboradoraRepository(),
      new HabilidadService(new HabilidadRepository()),
      new ColaboracionRepository(),
      new NotificacionRepository(),
      usuarioRepository,
    ),
  )

let colectivo
let persona
let habilidad

beforeEach(async () => {
  new UsuarioRepository().deleteAll()
  new ColectivoRepository().deleteAll()
  new PersonaColaboradoraRepository().deleteAll()
  new HabilidadRepository().deleteAll()
  habilidad = await new HabilidadRepository().save(
    new Habilidad("React", "react", "Desarrollo web"),
  )
  colectivo = await new ColectivoRepository().save(
    new Colectivo("Huerta Comunitaria Sur", "Huertas urbanas", "ONG"),
  )
  persona = await new PersonaColaboradoraRepository().save(
    new PersonaColaboradora("anag", "Ana"),
  )
})

const datosDeHuerta = () => ({
  email: "huerta@colectivo.test",
  contrasena: "secreto123",
  rol: RolUsuario.COLECTIVO,
  entidad: colectivo.id,
})

describe("AuthService", () => {
  describe("registrar", () => {
    test("devuelve el usuario público con el nombre del colectivo y sin la contraseña", async () => {
      const usuario = await crearService().registrar(datosDeHuerta())

      expect(usuario).toEqual({
        id: expect.any(String),
        email: "huerta@colectivo.test",
        rol: RolUsuario.COLECTIVO,
        entidad: { id: colectivo.id, nombre: "Huerta Comunitaria Sur" },
      })
    })

    test("de una persona colaboradora devuelve su nombre de fantasía", async () => {
      const usuario = await crearService().registrar({
        email: "anag@persona.test",
        contrasena: "secreto123",
        rol: RolUsuario.PERSONA_COLABORADORA,
        entidad: persona.id,
      })

      expect(usuario.entidad).toEqual({ id: persona.id, nombre: "anag" })
    })

    test("rechaza un email ya usado aunque cambien las mayúsculas", async () => {
      const service = crearService()
      await service.registrar(datosDeHuerta())

      await expect(
        service.registrar({
          ...datosDeHuerta(),
          email: " Huerta@Colectivo.test",
        }),
      ).rejects.toThrow(AlreadyExists)
    })

    test.each([
      ["un colectivo inexistente", RolUsuario.COLECTIVO, () => "no-existe"],
      [
        "un colectivo con el id de una persona",
        RolUsuario.COLECTIVO,
        () => persona.id,
      ],
      [
        "una persona con el id de un colectivo",
        RolUsuario.PERSONA_COLABORADORA,
        () => colectivo.id,
      ],
    ])("rechaza %s sin guardar el usuario", async (_caso, rol, entidad) => {
      const service = crearService()

      await expect(
        service.registrar({ ...datosDeHuerta(), rol, entidad: entidad() }),
      ).rejects.toThrow(InvalidReference)
      await expect(
        service.login("huerta@colectivo.test", "secreto123"),
      ).rejects.toThrow(CredencialesInvalidas)
    })
  })

  describe("registrarPersonaColaboradora", () => {
    const registro = () => ({
      email: "lucia@persona.test",
      contrasena: "secreto123",
      persona: {
        nombreFantasia: "lucia.dev",
        habilidades: [habilidad.id],
        mediosDeContacto: [{ tipo: "EMAIL", valor: "lucia@example.com" }],
      },
    })

    const personasGuardadas = () =>
      new PersonaColaboradoraRepository().findAll()

    test("crea la persona y devuelve su usuario público con el nombre de fantasía", async () => {
      const usuario =
        await crearService().registrarPersonaColaboradora(registro())

      expect(usuario).toEqual({
        id: expect.any(String),
        email: "lucia@persona.test",
        rol: RolUsuario.PERSONA_COLABORADORA,
        entidad: { id: expect.any(String), nombre: "lucia.dev" },
      })
      const creada = await new PersonaColaboradoraRepository().findById(
        usuario.entidad.id,
      )
      expect(creada.nombreFantasia).toBe("lucia.dev")
      expect(creada.habilidades).toEqual([habilidad])
    })

    test("después de registrarse puede iniciar sesión con esas credenciales", async () => {
      const service = crearService()
      const registrado = await service.registrarPersonaColaboradora(registro())

      const { usuario } = await service.login(
        "lucia@persona.test",
        "secreto123",
      )

      expect(usuario).toEqual(registrado)
    })

    test("con un email ya usado lanza AlreadyExists sin crear la persona", async () => {
      const service = crearService()
      await service.registrar(datosDeHuerta())
      const antes = [...(await personasGuardadas())]

      await expect(
        service.registrarPersonaColaboradora({
          ...registro(),
          email: "Huerta@Colectivo.test",
        }),
      ).rejects.toThrow(AlreadyExists)
      expect(await personasGuardadas()).toEqual(antes)
    })

    test("si no puede guardar el usuario borra la persona creada y propaga el error", async () => {
      const caida = new Error("Se cayó la base")
      class UsuarioRepositoryQueFalla extends UsuarioRepository {
        async save() {
          throw caida
        }
      }
      const antes = [...(await personasGuardadas())]

      await expect(
        crearService(
          new UsuarioRepositoryQueFalla(),
        ).registrarPersonaColaboradora(registro()),
      ).rejects.toBe(caida)
      expect(await personasGuardadas()).toEqual(antes)
    })
  })

  describe("login", () => {
    test("con credenciales correctas devuelve un token del usuario y el usuario público", async () => {
      const service = crearService()
      const registrado = await service.registrar(datosDeHuerta())

      const { token, usuario } = await service.login(
        "huerta@colectivo.test",
        "secreto123",
      )

      expect(usuario).toEqual(registrado)
      expect(verificar(token)).toMatchObject({
        sub: registrado.id,
        rol: RolUsuario.COLECTIVO,
        entidad: colectivo.id,
      })
    })

    test("ignora mayúsculas y espacios del email", async () => {
      const service = crearService()
      const registrado = await service.registrar(datosDeHuerta())

      const { usuario } = await service.login(
        " HUERTA@colectivo.test ",
        "secreto123",
      )

      expect(usuario).toEqual(registrado)
    })

    test("un email inexistente y una contraseña incorrecta dan el mismo error", async () => {
      const service = crearService()
      await service.registrar(datosDeHuerta())

      const emailInexistente = service.login(
        "nadie@colectivo.test",
        "secreto123",
      )
      const contrasenaIncorrecta = service.login(
        "huerta@colectivo.test",
        "secreto124",
      )

      const errores = await Promise.all(
        [emailInexistente, contrasenaIncorrecta].map((intento) =>
          intento.catch((error) => error),
        ),
      )
      expect(errores[0]).toBeInstanceOf(CredencialesInvalidas)
      expect(errores[1]).toBeInstanceOf(CredencialesInvalidas)
      expect(errores[0].message).toBe(errores[1].message)
    })
  })

  describe("usuarioActual", () => {
    test("devuelve el usuario público por id", async () => {
      const service = crearService()
      const registrado = await service.registrar(datosDeHuerta())

      expect(await service.usuarioActual(registrado.id)).toEqual(registrado)
    })

    test("con un id inexistente lanza EntityNotFound", async () => {
      await expect(crearService().usuarioActual("no-existe")).rejects.toThrow(
        EntityNotFound,
      )
    })
  })
})
