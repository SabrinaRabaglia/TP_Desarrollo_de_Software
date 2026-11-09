import { describe, expect, test } from "@jest/globals"
import { coincide, hashear } from "../../../src/auth/contrasenas.js"

describe("contraseñas", () => {
  test("una contraseña coincide con su propio hash", async () => {
    const hash = await hashear("secreto123")

    expect(await coincide("secreto123", hash)).toBe(true)
  })

  test("otra contraseña no coincide con el hash", async () => {
    const hash = await hashear("secreto123")

    expect(await coincide("secreto124", hash)).toBe(false)
  })

  test("el hash indica el algoritmo y no contiene la contraseña", async () => {
    const hash = await hashear("secreto123")

    expect(hash).toMatch(/^scrypt\$[0-9a-f]+\$[0-9a-f]+$/)
    expect(hash).not.toContain("secreto123")
  })

  test("dos hashes de la misma contraseña difieren por el salt y los dos coinciden", async () => {
    const primero = await hashear("secreto123")
    const segundo = await hashear("secreto123")

    expect(primero).not.toBe(segundo)
    expect(await coincide("secreto123", primero)).toBe(true)
    expect(await coincide("secreto123", segundo)).toBe(true)
  })
})
