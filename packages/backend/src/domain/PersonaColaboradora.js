export default class PersonaColaboradora {
  constructor({ nombreFantasia, nombre = null, apellido = null, pronombres = [], presentacion = null, cuentas = [], habilidades = [] }) {
    if (!nombreFantasia) {
      throw new Error("La persona colaboradora debe tener un nombre de fantasia")
    }
    this.nombreFantasia = nombreFantasia;
    this.nombre = nombre;
    this.apellido = apellido;
    this.pronombres = pronombres;
    this.presentacion = presentacion;
    this.cuentas = cuentas;
    this.habilidades = habilidades;
    this.colaboraciones = [];
  }
}
