import { describe, expect, test } from "@jest/globals"
import ColectivoService from "../../../src/services/ColectivoService.js";
import { ConflictError, NotFoundError, UnprocessableEntityError } from "../../../src/errors/AppError.js";
import ColectivoRepository from "../../../src/repositories/ColectivoRepository.js";

describe("ColectivoService", ()=>{
    describe("create",()=>{
        test("crea y guarda un colectivo cuando el nombre no existe todavia",()=>{
            const service = new ColectivoService(new ColectivoRepository())
            const nueva = {
                nombre: "Asamblea Ambiental",
                descripcion: "Protección de humedales locales",
                tipo: "Asamblea" }
            const colectivoCreado = service.create(nueva)
            
            expect(colectivoCreado.nombre).toBe(nueva.nombre)
            expect(colectivoCreado.descripcion).toBe(nueva.descripcion)
            expect(colectivoCreado.tipo).toBe(nueva.tipo)
            expect(service.getAll()).toEqual([colectivoCreado])
        })
        test("tira ConflictError si ya existe un colectivo con el mismo nombre", () => {
            const service = new ColectivoService(new ColectivoRepository());
            
            service.create({
                nombre: "Asamblea Ambiental",
                descripcion: "Protección de humedales locales",
                tipo: "Asamblea"
            });

            const crearColectivoDuplicado = () =>
                service.create({
                    nombre: "Asamblea Ambiental",
                    descripcion: "Otra descripción distinta",
                    tipo: "ONG"
                });

            expect(crearColectivoDuplicado).toThrow(ConflictError);
            expect(service.getAll()).toHaveLength(1);
        });
        describe("getById", () => {
        test("devuelve el colectivo correspondiente cuando se encuentra por ID", () => {
            const service = new ColectivoService(new ColectivoRepository());
            const colectivoCreado = service.create({
                nombre: "Asamblea Ambiental",
                descripcion: "Protección de humedales locales",
                tipo: "Asamblea"
            });

            const colectivoEncontrado = service.getById(colectivoCreado.id);

            expect(colectivoEncontrado).toBeDefined();
            expect(colectivoEncontrado.id).toBe(colectivoCreado.id);
            expect(colectivoEncontrado.nombre).toBe("Asamblea Ambiental");
        });

        test("lanza NotFoundError si el colectivo no existe", () => {
            const service = new ColectivoService(new ColectivoRepository());

            expect(() => service.getById("id-inexistente")).toThrow(NotFoundError);
        });
    });

    describe("update", () => {
        test("rechaza un nombre vacío en una actualización parcial sin modificar el colectivo", () => {
            const service = new ColectivoService(new ColectivoRepository());
            const colectivo = service.create({
                nombre: "Asamblea Ambiental", descripcion: "Descripción original", tipo: "Asamblea"
            });
            const antes = structuredClone(colectivo);

            expect(() => service.patch(colectivo.id, {
                nombre: "", descripcion: "No debe guardarse"
            })).toThrow(UnprocessableEntityError);

            expect(service.getById(colectivo.id)).toEqual(antes);
        });

        test("lanza NotFoundError si intenta actualizar un colectivo inexistente", () => {
            const service = new ColectivoService(new ColectivoRepository());
            const datos = { nombre: "Nuevo", descripcion: "Desc", tipo: "ONG" };

            expect(() => service.update("id-inexistente", datos)).toThrow(NotFoundError);
        });
    });

    describe("delete", () => {
        test("elimina el colectivo correctamente si existe", () => {
            const service = new ColectivoService(new ColectivoRepository());
            const colectivo = service.create({
                nombre: "Asamblea Ambiental",
                descripcion: "Protección de humedales locales",
                tipo: "Asamblea"
            });

            service.delete(colectivo.id);

            expect(service.getAll()).toHaveLength(0);
        });
    });
    })
})
