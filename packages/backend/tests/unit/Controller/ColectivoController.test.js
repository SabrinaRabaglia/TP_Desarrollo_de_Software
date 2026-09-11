import { describe, expect, test, jest } from "@jest/globals";
import ColectivoController from "../../../src/controllers/ColectivoController.js";
import { BadRequestError } from "../../../src/errors/AppError.js";


const mockRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
})

const mockColectivoService = () => ({
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  getById: jest.fn(),
  getAll: jest.fn(),
})

describe("ColectivoController",()=>{
    describe("getAll", () => {
        test("Responde con 200 y la lista de colectivos que devuelve el service", () => {
            const colectivoServiceMock = mockColectivoService();
            const lista = [{ nombre: "Asamblea Ambiental" }];
            colectivoServiceMock.getAll.mockReturnValue(lista);

            const controller = new ColectivoController(colectivoServiceMock);
            const req = {};
            const res = mockRes();

            controller.getAll(req, res);

            expect(colectivoServiceMock.getAll).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(lista);
        });
    });
    describe("getById", () => {
        test("Responde con 200 y el colectivo obtenido según el id", () => {
            const colectivoServiceMock = mockColectivoService();
            const colectivo = { nombre: "Asamblea Ambiental" };
            colectivoServiceMock.getById.mockReturnValue(colectivo);

            const controller = new ColectivoController(colectivoServiceMock);
            const req = { params: { id: "1" } };
            const res = mockRes();

            controller.getById(req, res);

            expect(colectivoServiceMock.getById).toHaveBeenCalledWith("1");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(colectivo);
        });
    });
    describe("create",()=>{
        test("Con body valido, delega en el service y responde con 201 el colectivo creado",()=>{
            const colectivoCreado = {
                nombre: "Asamblea Ambiental del Sur",
                descripcion: "Grupo autoconvocado para la protección de la cuenca y humedales locales.",
                tipo: "asamblea",
                pais: "Argentina",
                provincia: "CABA",
                ciudad: "Almagro"
            }
            const colectivoServiceMock = mockColectivoService();
            colectivoServiceMock.create.mockReturnValue(colectivoCreado)
            const controller = new ColectivoController(colectivoServiceMock)
            const req = {body: {nombre: "Asamblea Ambiental del Sur",
                descripcion: "Grupo autoconvocado para la protección de la cuenca y humedales locales.",
                tipo: "asamblea",
                pais: "Argentina",
                provincia: "CABA",
                ciudad: "Almagro"}}
            const res = mockRes()

            controller.create(req,res)

            expect(colectivoServiceMock.create).toHaveBeenCalledWith(req.body)
            expect(res.status).toHaveBeenCalledWith(201)
            expect(res.json).toHaveBeenCalledWith(colectivoCreado)
        })
        test("con body inválido (falta un campo), tira BadRequestError y no llama al service", () => {
              const colectivoServiceMock = mockColectivoService()
              const controller = new ColectivoController(colectivoServiceMock)
              const req = { body: { nombre: "Asamblea Ambiental del Sur",
                            descripcion: "Grupo autoconvocado para la protección de la cuenca y humedales locales." } }
              const res = mockRes()
        
              const crearConBodyInvalido = () => controller.create(req, res)
        
              expect(crearConBodyInvalido).toThrow(BadRequestError)
              expect(colectivoServiceMock.create).not.toHaveBeenCalled()
        })
        test("con un campo extra no declarado en el schema, tira BadRequestError", () => {
              const colectivoServiceMock = mockColectivoService()
              const controller = new ColectivoController(colectivoServiceMock)
              const req = { body: { nombre: "Asamblea Ambiental del Sur",
                descripcion: "Grupo autoconvocado para la protección de la cuenca y humedales locales.",
                tipo: "asamblea",
                pais: "Argentina",
                provincia: "CABA",
                ciudad: "Almagro", 
                extra: "no debería estar" } }
              const res = mockRes()
        
              const crearConCampoExtra = () => controller.create(req, res)
        
              expect(crearConCampoExtra).toThrow(BadRequestError)
        })
    })
    describe("put", () => {
        test("con body valido actualiza el colectivo y responde con 200", () => {
            const colectivoServiceMock = mockColectivoService();
            colectivoServiceMock.update.mockReturnValue(true);

            const controller = new ColectivoController(colectivoServiceMock);
            const colectivoActualizado = {
            nombre: "Asamblea Ambiental del Sur",
            descripcion: "Nueva descripción con objetivos ampliados para el barrio.",
            tipo: "asamblea",
            pais: "Argentina",
            provincia: "CABA",
            ciudad: "Palermo"
        };
            const req = { params: { id: "1" }, body: colectivoActualizado};
            const res = mockRes();

            controller.put(req, res);

            expect(colectivoServiceMock.update).toHaveBeenCalledWith("1", req.body);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(colectivoActualizado);
        });

        test("con body invalido tira BadRequestError", () => {
            const colectivoServiceMock = mockColectivoService();
            const controller = new ColectivoController(colectivoServiceMock);
            const req = { params: { id: "1" }, body: { nombre: "Solo nombre" } };
            const res = mockRes();

            expect(() => controller.put(req, res)).toThrow(BadRequestError);
        });
    });

    describe("patch", () => {
        test("con actualización parcial valida delega en el service y responde con 200", () => {
            const colectivoServiceMock = mockColectivoService();
            const actualizado = { nombre: "Nuevo Nombre" };
            colectivoServiceMock.update.mockReturnValue(actualizado);

            const controller = new ColectivoController(colectivoServiceMock);
            const req = { params: { id: "1" }, body: { nombre: "Nuevo Nombre" } };
            const res = mockRes();

            controller.patch(req, res);

            expect(colectivoServiceMock.update).toHaveBeenCalledWith("1", { nombre: "Nuevo Nombre" });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(actualizado);
        });
    });

    describe("delete", () => {
        test("llama al delete del service y responde con 204", () => {
            const colectivoServiceMock = mockColectivoService();
            const controller = new ColectivoController(colectivoServiceMock);
            const req = { params: { id: "1" } };
            const res = mockRes();

            controller.delete(req, res);

            expect(colectivoServiceMock.delete).toHaveBeenCalledWith("1");
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
        });
    });
})