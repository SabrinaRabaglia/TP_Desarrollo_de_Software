import { beforeEach, describe, expect, test } from "@jest/globals"
import AuthService from "../../../src/services/AuthService.js"
import Colectivo from "../../../src/domain/Colectivo.js"
import PersonaColaboradora from "../../../src/domain/PersonaColaboradora.js"
import { RolUsuario } from "../../../src/domain/enums/RolUsuario.js"
import { verificar } from "../../../src/auth/tokens.js"
import {
  AlreadyExists,
  CredencialesInvalidas,
  EntityNotFound,
  InvalidReference,
} from "../../../src/errors/ApplicationErrors.js"
import ColectivoRepository from "../../fakes/ColectivoRepository.js"
import PersonaColaboradoraRepository from "../../fakes/PersonaColaboradoraRepository.js"
import UsuarioRepository from "../../fakes/UsuarioRepository.js"

const crearService = () =>
  new AuthService(
    new UsuarioRepository(),
    new ColectivoRepository(),
    new PersonaColaboradoraRepository(),
  )

let colectivo
let persona

beforeEach(async () => {
  new UsuarioRepository().deleteAll()
  new ColectivoRepository().deleteAll()
  new PersonaColaboradoraRepository().deleteAll()
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
