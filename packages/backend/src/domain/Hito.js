
export class Hito {
  constructor(fecha, porcentajeConcrecion, descripcion, proyecto) {
    if (porcentajeConcrecion < 0 || porcentajeConcrecion > 100) {
      throw new Error("El porcentaje de concreción debe estar entre 0 y 100.");
    }
    this.fecha = new Date(fecha);
    this.porcentajeConcrecion = porcentajeConcrecion;
    this.descripcion = descripcion;
    this.proyecto = proyecto; 
  }
}