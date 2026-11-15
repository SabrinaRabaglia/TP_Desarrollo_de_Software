import { expect, test } from "@jest/globals"
import dotenv from "dotenv"
import { crearCanales } from "../../../src/canales/canales.js"

test("los tests no mandan nada de verdad aunque se cargue el .env", () => {
  dotenv.config({ quiet: true })

  expect(crearCanales(process.env).simulados).toEqual([
    "EMAIL",
    "WHATSAPP",
    "SMS",
    "TELEGRAM",
  ])
})
