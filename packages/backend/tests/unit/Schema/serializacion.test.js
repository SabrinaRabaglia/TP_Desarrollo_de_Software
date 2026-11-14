import { describe, expect, test } from "@jest/globals"
import mongoose from "mongoose"
import PostulacionModel from "../../../src/schemas/postulacionSchema.js"
import ColectivoModel from "../../../src/schemas/colectivoSchema.js"
import NotificacionModel from "../../../src/schemas/notificacionSchema.js"
import PaisModel from "../../../src/schemas/paisSchema.js"
import PersonaColaboradoraModel from "../../../src/schemas/personaColaboradoraSchema.js"
import ProyectoModel from "../../../src/schemas/proyectoSchema.js"
import UsuarioModel from "../../../src/schemas/usuarioSchema.js"

const idDe = (documento) => String(documento._id)
const fecha = new Date("2026-10-01T00:00:00.000Z")

describe("serialización a JSON de los documentos", () => {
  test("una persona colaboradora expone el id y el tipo de sus medios de contacto, nunca el valor", () => {
    const persona = new PersonaColaboradoraModel({
      nombreFantasia: "anag",
      cuentas: [{ nombreUsuario: "anagomez", tipo: "GITHUB" }],
      mediosDeContacto: [{ tipo: "EMAIL", valor: "ana@example.com" }],
    })

    const json = persona.toJSON()

    expect(json).toEqual({
      id: idDe(persona),
      nombreFantasia: "anag",
      nombre: null,
      apellido: null,
      pronombres: [],
      presentacion: null,
      cuentas: [{ nombreUsuario: "anagomez", tipo: "GITHUB" }],
      habilidades: [],
      aceptaMensajeriaInterna: false,
      mediosDeContacto: [
        { id: idDe(persona.mediosDeContacto[0]), tipo: "EMAIL" },
      ],
    })
    expect(JSON.stringify(json)).not.toContain("ana@example.com")
    expect(persona.mediosDeContacto[0].valor).toBe("ana@example.com")
  })

  test("una notificación expone el flag de pendiente y los tipos ya enviados, nunca sus envíos ni valores", () => {
    const notificacion = new NotificacionModel({
      fecha,
      contenido: "Hola",
      colectivo: new mongoose.Types.ObjectId(),
      personaColaboradora: new mongoose.Types.ObjectId(),
      perfil: new mongoose.Types.ObjectId(),
      envios: [
        {
          medio: { tipo: "EMAIL", valor: "ana@example.com" },
          estado: "ENVIADO",
          intentos: 1,
          enviadoEn: fecha,
        },
        {
          medio: { tipo: "SMS", valor: "+54 9 11 2345-6789" },
          estado: "PENDIENTE",
          ultimoError: "SMS caído",
        },
      ],
      procesandoDesde: fecha,
    })

    const json = JSON.parse(JSON.stringify(notificacion))

    expect(json.mediosExternosUtilizados).toEqual(["EMAIL"])
    expect(json.pendienteDeEnvio).toBe(true)
    expect(json).not.toHaveProperty("envios")
    expect(json).not.toHaveProperty("procesandoDesde")
    expect(json).not.toHaveProperty("reintentarDesde")
    expect(JSON.stringify(json)).not.toContain("ana@example.com")
    expect(JSON.stringify(json)).not.toContain("SMS caído")
  })

  test("una colaboración pública muestra quién la realizó", () => {
    const personaColaboradora = new mongoose.Types.ObjectId()
    const postulacion = new PostulacionModel({
      fechaInscripcion: fecha,
      esAnonima: false,
      personaColaboradora,
      perfil: new mongoose.Types.ObjectId(),
    })

    expect(postulacion.toJSON().personaColaboradora).toEqual(
      personaColaboradora,
    )
  })

  test("una colaboración anónima figura igual pero sin indicar quién la realizó", () => {
    const colaboracion = new PostulacionModel({
      fechaPostulacion: fecha,
      esAnonima: true,
      personaColaboradora: new mongoose.Types.ObjectId(),
      perfil: new mongoose.Types.ObjectId(),
    })

    const json = colaboracion.toJSON()

    expect(json.esAnonima).toBe(true)
    expect(json.personaColaboradora).toBeNull()
    expect(json.perfil).toBeDefined()
  })

  test("un proyecto expone sus perfiles e hitos sin claves internas", () => {
    const proyecto = new ProyectoModel({
      titulo: "Mapa",
      descripcion: "Mapa de humedales",
      colectivo: new mongoose.Types.ObjectId(),
      fechaAlta: fecha,
      perfiles: [
        {
          descripcion: "Tester",
          unidadCompromiso: "HORAS_MENSUALES",
          cantidadHoras: 5,
          modalidadesColaboracion: ["GRATUITA"],
        },
      ],
      hitos: [{ fecha, porcentajeConcrecion: 40, descripcion: "Entrega" }],
    })

    const json = JSON.parse(JSON.stringify(proyecto))

    expect(json).not.toHaveProperty("_id")
    expect(json).not.toHaveProperty("__v")
    expect(json.perfiles[0]).toEqual({
      id: idDe(proyecto.perfiles[0]),
      nombre: null,
      descripcion: "Tester",
      unidadCompromiso: "HORAS_MENSUALES",
      cantidadHoras: 5,
      modalidadesColaboracion: ["GRATUITA"],
      habilidadesRequeridas: [],
      habilidadesOpcionales: [],
      limiteColaboraciones: null,
      postulacionesAceptadas: [],
    })
    expect(json.hitos[0]).toEqual({
      id: idDe(proyecto.hitos[0]),
      fecha: fecha.toISOString(),
      porcentajeConcrecion: 40,
      descripcion: "Entrega",
    })
  })

  test("un colectivo expone su ubicación y los proyectos que le cargaron", () => {
    const pais = new PaisModel({ nombre: "Argentina" })
    const colectivo = new ColectivoModel({
      nombre: "Asamblea Ambiental",
      descripcion: "Protección de humedales",
      tipo: "Asamblea",
      pais,
      ciudad: "Lanús",
    })
    const proyecto = new ProyectoModel({
      titulo: "Mapa",
      descripcion: "Mapa de humedales",
      colectivo: colectivo._id,
      fechaAlta: fecha,
    })
    colectivo.proyectos = [proyecto]

    const json = JSON.parse(JSON.stringify(colectivo))

    expect(json).toEqual({
      id: idDe(colectivo),
      nombre: "Asamblea Ambiental",
      descripcion: "Protección de humedales",
      tipo: "Asamblea",
      pais: { id: idDe(pais), nombre: "Argentina" },
      provincia: null,
      ciudad: "Lanús",
      proyectos: [JSON.parse(JSON.stringify(proyecto))],
    })
    expect(json.proyectos[0]).toMatchObject({
      id: idDe(proyecto),
      titulo: "Mapa",
      perfiles: [],
      hitos: [],
    })
  })

  test("un usuario nunca expone el hash de su contraseña", () => {
    const usuario = new UsuarioModel({
      email: "huerta@colectivo.test",
      hashContrasena: "scrypt$sal$hash",
      rol: "COLECTIVO",
      entidad: new mongoose.Types.ObjectId(),
    })

    const json = usuario.toJSON()

    expect(json).toEqual({
      id: idDe(usuario),
      email: "huerta@colectivo.test",
      rol: "COLECTIVO",
      entidad: usuario.entidad,
    })
    expect(JSON.stringify(json)).not.toContain("scrypt")
  })
})
