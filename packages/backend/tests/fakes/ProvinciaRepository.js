import Provincia from '../../src/domain/Provincia.js';
export default class ProvinciaRepository {
  constructor() {
    this.provincias = [
      new Provincia("1", "Buenos Aires"),
      new Provincia("2", "Ciudad Autónoma de Buenos Aires (CABA)"),
      new Provincia("3", "Catamarca"),
      new Provincia("4", "Chaco"),
      new Provincia("5", "Chubut"),
      new Provincia("6", "Córdoba"),
      new Provincia("7", "Corrientes"),
      new Provincia("8", "Entre Ríos"),
      new Provincia("9", "Formosa"),
      new Provincia("10", "Jujuy"),
      new Provincia("11", "La Pampa"),
      new Provincia("12", "La Rioja"),
      new Provincia("13", "Mendoza"),
      new Provincia("14", "Misiones"),
      new Provincia("15", "Neuquén"),
      new Provincia("16", "Río Negro"),
      new Provincia("17", "Salta"),
      new Provincia("18", "San Juan"),
      new Provincia("19", "San Luis"),
      new Provincia("20", "Santa Cruz"),
      new Provincia("21", "Santa Fe"),
      new Provincia("22", "Santiago del Estero"),
      new Provincia("23", "Tierra del Fuego, Antártida e Islas del Atlántico Sur"),
      new Provincia("24", "Tucumán")

    ]
  }


  async findById(id) {
    return this.provincias.find((provincia) => provincia.id === id)
  }

  async save(provincia) {
    const indice = this.provincias.findIndex((p) => p.id === provincia.id)
    if(indice === -1) {
      this.provincias.push(provincia)
      return provincia
    }

    this.provincias[indice] = provincia
    return provincia
  }

}