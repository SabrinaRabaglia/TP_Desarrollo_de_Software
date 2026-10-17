import { describe, expect, test } from "@jest/globals"
import PersonaColaboradora from "../../../src/domain/PersonaColaboradora.js"
import Colectivo from "../../../src/domain/Colectivo.js"
import Proyecto from "../../../src/domain/Proyecto.js"
import Perfil from "../../../src/domain/Perfil.js"
import Notificacion from "../../../src/domain/notificacion.js"
import { UnidadCompromiso } from "../../../src/domain/enums/UnidadCompromiso.js"
import { ModalidadColaboracion } from "../../../src/domain/enums/ModalidadColaboracion.js"
import TipoColectivo from "../../../src/domain/TipoColectivo.js"
import { DomainValidationError } from "../../../src/domain/errors/DomainErrors.js"

const medios = [
        { tipo: "EMAIL", valor: "test@mail.com" }
    ];

const personaTest = new PersonaColaboradora(
    "pablo",undefined,undefined,undefined,undefined,undefined,undefined,true,medios)

const datos = {
      nombre: "jardinero",
      descripcion: "plantar",
      unidadCompromiso: UnidadCompromiso.HORAS_MENSUALES,
      cantidadHoras: 5,
      modalidadesColaboracion: [ModalidadColaboracion.GRATUITA],
      habilidadesRequeridas: ["girasoles"],
      habilidadesOpcionales: ["rosas"],
    }

const tipoColectivo = new TipoColectivo("Asamblea")
    const colectivoTest = new Colectivo(
      "Jardineria",
      "Grupo para hacer jardineria.",
      tipoColectivo,
      "Argentina",
      "CABA",
      "Almagro",
    )
const perfilTest = new Perfil(datos)
const proyectoTest = new Proyecto("botanica","hacer botanica", colectivoTest)
proyectoTest.agregarPerfil(perfilTest)
colectivoTest.agregarProyecto(proyectoTest)


describe("Notificacion",() => {
    test("se crea correctamente con todos sus datos",()=>{
        const notificacion = new Notificacion("buenas tardes",colectivoTest,personaTest,perfilTest)
        expect(notificacion.contenido).toBe("buenas tardes")
        expect(notificacion.colectivo).toBe(colectivoTest)
        expect(notificacion.personaColaboradora).toBe(personaTest)
        expect(notificacion.perfil).toBe(perfilTest)
    })
    test("tiene que tener contenido", ()=>{
        expect(() => {
        new Notificacion(
            undefined, colectivoTest, personaTest, perfilTest
        )}).toThrow(DomainValidationError)
    })
    test("tiene que tener colectivo", ()=>{
        expect(() => {
        new Notificacion(
            "buenas tardes", undefined, personaTest, perfilTest
        )}).toThrow(DomainValidationError)
    })
    test("tiene que tener persona colaboradora", ()=>{
        expect(() => {
        new Notificacion(
           "buenas tardes", colectivoTest, undefined, perfilTest
        )}).toThrow(DomainValidationError)
    })
    test("tiene que tener perfil", ()=>{
        expect(() => {
        new Notificacion(
            "buenas tardes", colectivoTest, personaTest, undefined
        )}).toThrow(DomainValidationError)
    })
    test("agrega bien los medios externos", ()=>{
        const notificacion = new Notificacion("buenas tardes",colectivoTest,personaTest,perfilTest)
        notificacion.agregarMediosExternos(medios)
        expect(notificacion.mediosExternosUtilizados).toEqual(medios)
    })
})