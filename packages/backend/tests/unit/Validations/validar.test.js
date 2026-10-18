import { describe, expect, jest, test } from "@jest/globals"
import { z } from "zod"
import validar from "../../../src/middlewares/validar.js"
import { BadRequestError } from "../../../src/errors/ApplicationErrors.js"

const schema = z.object({ cantidad: z.coerce.number() }).strict()

describe("validar", () => {
  test("con datos válidos los reemplaza por el resultado parseado y sigue", () => {
    const req = { body: { cantidad: "3" } }
    const next = jest.fn()

    validar(schema)(req, {}, next)

    expect(req.body).toEqual({ cantidad: 3 })
    expect(next).toHaveBeenCalledWith()
  })

  test("con datos inválidos pasa un BadRequestError con el detalle", () => {
    const next = jest.fn()

    validar(schema)({ body: { cantidad: "x", extra: 1 } }, {}, next)

    const error = next.mock.calls[0][0]
    expect(error).toBeInstanceOf(BadRequestError)
    expect(error.details).not.toHaveLength(0)
  })

  test("puede validar la query aunque Express la exponga como getter", () => {
    const req = Object.create({
      get query() {
        return { cantidad: "5" }
      },
    })
    const next = jest.fn()

    validar(schema, "query")(req, {}, next)

    expect(req.query).toEqual({ cantidad: 5 })
    expect(next).toHaveBeenCalledWith()
  })
})
