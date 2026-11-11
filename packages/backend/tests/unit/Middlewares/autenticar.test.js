import { describe, expect, jest, test } from "@jest/globals"
import {
  autenticar,
  autorizar,
  autorizarEntidad,
} from "../../../src/middlewares/autenticar.js"
import { firmar } from "../../../src/auth/tokens.js"
import { RolUsuario } from "../../../src/domain/enums/RolUsuario.js"
import {
  NoAutenticado,
  NoAutorizado,
} from "../../../src/errors/ApplicationErrors.js"

const usuario = {
  id: "65f1a2b3c4d5e6f708192a10",
  rol: RolUsuario.COLECTIVO,
  entidad: "65f1a2b3c4d5e6f708192a01",
}

const conHeader = (authorization) => ({
  headers: authorization === undefined ? {} : { authorization },
})

describe("autenticar", () => {
  test("con un token válido deja el usuario en req.usuario y sigue", () => {
    const req = conHeader(`Bearer ${firmar(usuario)}`)
    const next = jest.fn()

    autenticar(req, {}, next)

    expect(req.usuario).toEqual(usuario)
    expect(next).toHaveBeenCalledWith()
  })

  test.each([
    ["sin header", undefined],
    ["con otro esquema", `Basic ${firmar(usuario)}`],
    ["con Bearer vacío", "Bearer "],
    ["con un token basura", "Bearer no-es-un-token"],
  ])("%s pasa NoAutenticado y no deja usuario", (_caso, authorization) => {
    const req = conHeader(authorization)
    const next = jest.fn()

    autenticar(req, {}, next)

    expect(next).toHaveBeenCalledWith(expect.any(NoAutenticado))
    expect(req.usuario).toBeUndefined()
  })
})

describe("autorizar", () => {
  test("deja pasar a un rol de la lista", () => {
    const next = jest.fn()

    autorizar(RolUsuario.PERSONA_COLABORADORA, RolUsuario.COLECTIVO)(
      { usuario },
      {},
      next,
    )

    expect(next).toHaveBeenCalledWith()
  })

  test("con un rol fuera de la lista pasa NoAutorizado", () => {
    const next = jest.fn()

    autorizar(RolUsuario.PERSONA_COLABORADORA)({ usuario }, {}, next)

    expect(next).toHaveBeenCalledWith(expect.any(NoAutorizado))
  })
})

describe("autorizarEntidad", () => {
  const persona = {
    id: "65f1a2b3c4d5e6f708192a11",
    rol: RolUsuario.PERSONA_COLABORADORA,
    entidad: "65f1a2b3c4d5e6f708192a02",
  }

  const autorizarPersonaSobre = (usuarioDelToken, id) => {
    const next = jest.fn()
    autorizarEntidad(RolUsuario.PERSONA_COLABORADORA)(
      { usuario: usuarioDelToken, params: { id } },
      {},
      next,
    )
    return next
  }

  test("deja pasar a la entidad del token sobre su propio id", () => {
    expect(
      autorizarPersonaSobre(persona, persona.entidad),
    ).toHaveBeenCalledWith(undefined)
  })

  test("con el id de otra entidad pasa NoAutorizado", () => {
    expect(
      autorizarPersonaSobre(persona, "65f1a2b3c4d5e6f708192a03"),
    ).toHaveBeenCalledWith(expect.any(NoAutorizado))
  })

  test("con el mismo id pero otro rol pasa NoAutorizado", () => {
    const colectivo = { ...persona, rol: RolUsuario.COLECTIVO }

    expect(
      autorizarPersonaSobre(colectivo, persona.entidad),
    ).toHaveBeenCalledWith(expect.any(NoAutorizado))
  })

  test("lee el id del parámetro indicado", () => {
    const next = jest.fn()

    autorizarEntidad(RolUsuario.PERSONA_COLABORADORA, "personaId")(
      { usuario: persona, params: { id: "otro", personaId: persona.entidad } },
      {},
      next,
    )

    expect(next).toHaveBeenCalledWith(undefined)
  })
})
