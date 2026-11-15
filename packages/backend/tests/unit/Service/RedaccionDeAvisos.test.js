import { beforeEach, describe, expect, test } from "@jest/globals"
import RedaccionDeAvisos from "../../../src/services/RedaccionDeAvisos.js"
import ColectivoRepository from "../../fakes/ColectivoRepository.js"
import ProyectoRepository from "../../fakes/ProyectoRepository.js"

describe("RedaccionDeAvisos", () => {
  const colectivoRepository = new ColectivoRepository()
  const proyectoRepository = new ProyectoRepository()
  let colectivo
  let perfil

  beforeEach(async () => {
    colectivoRepository.deleteAll()
    proyectoRepository.deleteAll()
    colectivo = await colectivoRepository.save({ nombre: "Red Solidaria Sur" })
    const proyecto = await proyectoRepository.save({
      titulo: "Mapa de comedores comunitarios",
      colectivo: colectivo.id,
      perfiles: [{ nombre: "Tester" }],
      hitos: [],
    })
    perfil = proyecto.perfiles[0]
  })

  const notificacion = (cambios = {}) => ({
    contenido: "Hola, ¿te sumás?",
    colectivo: colectivo.id,
    perfil: perfil.id,
    ...cambios,
  })

  test("arma el aviso con los nombres del colectivo, el proyecto y el perfil", async () => {
    const redaccion = new RedaccionDeAvisos(
      colectivoRepository,
      proyectoRepository,
      "https://ejemplo",
    )

    expect(await redaccion.redactar(notificacion())).toBe(
      'Red Solidaria Sur te escribió por el perfil Tester de "Mapa de comedores comunitarios":\n\n' +
        "Hola, ¿te sumás?\n\n" +
        "Este es un aviso automático de Código a Voluntad. Para responder entrá a la plataforma: https://ejemplo/mensajes",
    )
  })

  test("si el colectivo y el perfil ya no existen, igual redacta el aviso", async () => {
    const redaccion = new RedaccionDeAvisos(
      colectivoRepository,
      proyectoRepository,
    )

    const aviso = await redaccion.redactar(
      notificacion({ colectivo: "no-existe", perfil: "tampoco" }),
    )

    expect(aviso).toBe(
      "Un colectivo te escribió en Código a Voluntad:\n\n" +
        "Hola, ¿te sumás?\n\n" +
        "Este es un aviso automático de Código a Voluntad. Para responder entrá a la plataforma.",
    )
  })
})
