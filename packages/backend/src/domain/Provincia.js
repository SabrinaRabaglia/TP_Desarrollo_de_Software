import { UnprocessableEntityError } from "../errors/AppError.js";
import normalizarNombre from "./normalizarNombre.js";

const provincias = new Set([
    "Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes",
    "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza",
    "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis",
    "Santa Cruz", "Santa Fe", "Santiago del Estero",
    "Tierra del Fuego, Antártida e Islas del Atlántico Sur", "Tucumán",
    "Ciudad Autónoma de Buenos Aires",
].map(normalizarNombre));

const alias = new Map([
    ["caba", normalizarNombre("Ciudad Autónoma de Buenos Aires")],
    ["tierra del fuego", normalizarNombre("Tierra del Fuego, Antártida e Islas del Atlántico Sur")],
]);

export default class Provincia {
    constructor(nombre){
        Provincia.validar(nombre);
        this.nombre = nombre;
    }

    static validar(nombre) {
        const normalizado = normalizarNombre(nombre);
        if (!provincias.has(alias.get(normalizado) ?? normalizado)) {
            throw new UnprocessableEntityError("La provincia debe ser una de las 23 provincias argentinas o CABA.");
        }
    }
}
