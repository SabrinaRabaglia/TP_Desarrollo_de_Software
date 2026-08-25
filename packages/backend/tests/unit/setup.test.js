import { describe, expect, test } from "@jest/globals"

describe("Configuración de Jest", () => {
  test("ejecuta un test unitario", () => {
    expect("hello world").toBe("hello world")
  })
})
