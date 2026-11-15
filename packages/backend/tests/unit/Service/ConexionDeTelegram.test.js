import { beforeEach, describe, expect, jest, test } from "@jest/globals"
import ConexionDeTelegram from "../../../src/services/ConexionDeTelegram.js"
import PersonaColaboradora from "../../../src/domain/PersonaColaboradora.js"
import MedioDeContacto from "../../../src/domain/MedioDeContacto.js"
import { emitirCodigo } from "../../../src/auth/codigoDeVinculacion.js"
import {
  EntityNotFound,
  ServicioNoDisponible,
} from "../../../src/errors/ApplicationErrors.js"
import PersonaColaboradoraRepository from "../../fakes/PersonaColaboradoraRepository.js"
import nuevoId from "../../fakes/nuevoId.js"

const ENLACE_VENCIDO =
  "Ese enlace ya no sirve. Entrá a Mi perfil en Código a Voluntad y tocá Conectar Telegram de nuevo."

describe("ConexionDeTelegram", () => {
  const repositorio = new PersonaColaboradoraRepository()
  const ahora = new Date("2026-11-15T12:00:00.000Z")
  let telegram
  let conexion
  let ana

  beforeEach(async () => {
    repositorio.deleteAll()
    telegram = {
      obtenerBot: jest.fn(async () => ({ username: "CodigoAVoluntadBot" })),
    }
    conexion = new ConexionDeTelegram(telegram, repositorio, {
      ahora: () => ahora,
    })
    ana = await repositorio.save(new PersonaColaboradora("anag"))
    ana.mediosDeContacto = [
      new MedioDeContacto("EMAIL", "ana@example.com", "m1"),
    ]
  })

  const telegramDe = (persona) =>
    persona.mediosDeContacto
      .filter((medio) => medio.tipo === "TELEGRAM")
      .map((medio) => medio.valor)

  describe("crearEnlace", () => {
    test("da un enlace al bot con un código para la persona", async () => {
      const { enlace, venceEn } = await conexion.crearEnlace(ana.id)

      const { codigo } = emitirCodigo(ana.id, ahora)
      expect(enlace).toBe(`https://t.me/CodigoAVoluntadBot?start=${codigo}`)
      expect(venceEn).toEqual(new Date("2026-11-15T12:15:00.000Z"))
    })

    test("pregunta el nombre del bot una sola vez", async () => {
      await conexion.crearEnlace(ana.id)
      await conexion.crearEnlace(ana.id)

      expect(telegram.obtenerBot).toHaveBeenCalledTimes(1)
    })

    test("falla si la persona no existe", async () => {
      await expect(conexion.crearEnlace(nuevoId())).rejects.toThrow(
        EntityNotFound,
      )
    })

    test("sin Telegram configurado avisa que el servicio no está disponible", async () => {
      const sinTelegram = new ConexionDeTelegram(null, repositorio)

      await expect(sinTelegram.crearEnlace(ana.id)).rejects.toThrow(
        ServicioNoDisponible,
      )
    })
  })

  describe("atenderMensaje", () => {
    test("con un código válido conecta el chat a la persona y le confirma", async () => {
      const { codigo } = emitirCodigo(ana.id, ahora)

      const respuesta = await conexion.atenderMensaje({
        chatId: 987654321,
        texto: `/start ${codigo}`,
      })

      expect(respuesta).toBe(
        "Listo, anag. Desde ahora te aviso por acá cuando un colectivo te escriba en Código a Voluntad. Este chat es solo para avisos: para responder entrá a la plataforma.",
      )
      const guardada = await repositorio.findById(ana.id)
      expect(telegramDe(guardada)).toEqual(["987654321"])
      expect(guardada.mediosDeContacto[0].valor).toBe("ana@example.com")
    })

    test.each([
      [
        "vencido",
        () => emitirCodigo(ana.id, new Date("2026-11-15T11:00:00.000Z")).codigo,
      ],
      [
        "adulterado",
        () => {
          const { codigo } = emitirCodigo(ana.id, ahora)
          return codigo.slice(0, -1) + (codigo.endsWith("A") ? "B" : "A")
        },
      ],
      [
        "de una persona que ya no existe",
        () => emitirCodigo(nuevoId(), ahora).codigo,
      ],
    ])("con un código %s no conecta nada", async (_caso, codigo) => {
      const respuesta = await conexion.atenderMensaje({
        chatId: 987654321,
        texto: `/start ${codigo()}`,
      })

      expect(respuesta).toBe(ENLACE_VENCIDO)
      expect(telegramDe(await repositorio.findById(ana.id))).toEqual([])
    })

    test("/start sin código explica cómo conectarse", async () => {
      expect(
        await conexion.atenderMensaje({ chatId: 1, texto: "/start" }),
      ).toBe(
        "Para recibir avisos por acá, entrá a Mi perfil en Código a Voluntad y tocá Conectar Telegram.",
      )
    })

    test("a cualquier otro mensaje le aclara que el chat es solo para avisos", async () => {
      expect(
        await conexion.atenderMensaje({
          chatId: 1,
          texto: "Hola, me interesa",
        }),
      ).toBe(
        "Este chat es solo para avisos. Para responder a un colectivo entrá a Código a Voluntad.",
      )
    })
  })
})
