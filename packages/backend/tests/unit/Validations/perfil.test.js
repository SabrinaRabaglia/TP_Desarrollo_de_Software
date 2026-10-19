import { describe, expect, jest, test } from "@jest/globals"
import validar from "../../../src/middlewares/validar.js"
import { BadRequestError } from "../../../src/errors/ApplicationErrors.js"
import { perfilSchema } from "../../../src/validations/perfil.js"
import { UnidadCompromiso } from "../../../src/domain/enums/UnidadCompromiso.js"
import { ModalidadColaboracion } from "../../../src/domain/enums/ModalidadColaboracion.js"

const perfilValido = {
  nombre: "Tester",
  descripcion: "Testing E2E con Cypress",
  unidadCompromiso: UnidadCompromiso.HORAS_MENSUALES,
  cantidadHoras: 5,
  modalidadesColaboracion: [ModalidadColaboracion.GRATUITA],
  habilidadesRequeridas: ["65f1a2b3c4d5e6f708192a11"],
  habilidadesOpcionales: ["65f1a2b3c4d5e6f708192a12"],
}

const validarBody = (body) => {
  const req = { body }
  const next = jest.fn()
  validar(perfilSchema)(req, {}, next)
  return { req, next }
}

describe("validación de perfiles", () => {
  test("un body válido pasa sin cambios", () => {
    const { req, next } = validarBody(perfilValido)

    expect(next).toHaveBeenCalledWith()
    expect(req.body).toEqual(perfilValido)
  })

  test("el nombre es opcional", () => {
    const sinNombre = { ...perfilValido }
    delete sinNombre.nombre

    expect(validarBody(sinNombre).next).toHaveBeenCalledWith()
  })

  test.each([
    ["sin descripción", { descripcion: undefined }],
    ["sin habilidades requeridas", { habilidadesRequeridas: undefined }],
    ["sin habilidades opcionales", { habilidadesOpcionales: undefined }],
    [
      "con una habilidad requerida que no es un id",
      { habilidadesRequeridas: ["cypress"] },
    ],
    [
      "con una habilidad opcional que no es un id",
      { habilidadesOpcionales: ["soap_ui"] },
    ],
    [
      "con habilidades que no son una lista",
      { habilidadesRequeridas: "65f1a2b3c4d5e6f708192a11" },
    ],
    ["con la cantidad de horas como texto", { cantidadHoras: "5" }],
    ["con una unidad de compromiso inválida", { unidadCompromiso: "ANUALES" }],
    [
      "con una modalidad inválida",
      { modalidadesColaboracion: ["VOLUNTARIADO"] },
    ],
    ["con un campo que no existe", { campoInexistente: true }],
  ])("rechaza con BadRequestError un body %s", (_caso, cambio) => {
    const { next } = validarBody({ ...perfilValido, ...cambio })

    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError))
  })

  // El schema controla la forma; las reglas del perfil las aplica el dominio
  // y responden 422 (ver Perfil.test.js).
  test.each([
    ["sin habilidades requeridas", { habilidadesRequeridas: [] }],
    ["con horas no enteras", { cantidadHoras: 2.5 }],
    ["con horas negativas", { cantidadHoras: -3 }],
  ])(
    "deja pasar un perfil %s para que lo rechace el dominio",
    (_caso, cambio) => {
      expect(
        validarBody({ ...perfilValido, ...cambio }).next,
      ).toHaveBeenCalledWith()
    },
  )
})
