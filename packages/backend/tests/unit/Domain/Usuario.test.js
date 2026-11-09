import { describe, expect, test } from "@jest/globals"
import Usuario from "../../../src/domain/Usuario.js"
import { RolUsuario } from "../../../src/domain/enums/RolUsuario.js"
import { DomainValidationError } from "../../../src/domain/errors/DomainErrors.js"

const ENTIDAD_ID = "65f1a2b3c4d5e6f708192a01"

describe("Usuario", () => {
  test("se construye con el email normalizado, el hash, el rol y la entidad", () => {
    const usuario = new Usuario(
      "  Huerta@Colectivo.TEST ",
      "scrypt$sal$hash",
      RolUsuario.COLECTIVO,
      ENTIDAD_ID,
    )

    expect(usuario).toEqual({
      email: "huerta@colectivo.test",
      hashContrasena: "scrypt$sal$hash",
      rol: RolUsuario.COLECTIVO,
      entidad: ENTIDAD_ID,
    })
  })

  test("acepta el rol de persona colaboradora", () => {
    const usuario = new Usuario(
      "anag@persona.test",
      "scrypt$sal$hash",
      RolUsuario.PERSONA_COLABORADORA,
      ENTIDAD_ID,
    )

    expect(usuario.rol).toBe(RolUsuario.PERSONA_COLABORADORA)
  })

  test.each([
    ["sin email", { email: undefined }],
    ["con un email sin arroba", { email: "huerta.colectivo.test" }],
    ["con un email con espacios", { email: "hu erta@colectivo.test" }],
    ["sin hash de contraseña", { hashContrasena: "" }],
    ["con un rol desconocido", { rol: "ADMIN" }],
    ["sin entidad", { entidad: null }],
  ])("rechaza un usuario %s", (_caso, cambios) => {
    const datos = {
      email: "huerta@colectivo.test",
      hashContrasena: "scrypt$sal$hash",
      rol: RolUsuario.COLECTIVO,
      entidad: ENTIDAD_ID,
      ...cambios,
    }

    expect(
      () =>
        new Usuario(
          datos.email,
          datos.hashContrasena,
          datos.rol,
          datos.entidad,
        ),
    ).toThrow(DomainValidationError)
  })
})
