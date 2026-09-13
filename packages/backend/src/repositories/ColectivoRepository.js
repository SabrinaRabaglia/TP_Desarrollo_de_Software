

export default class ColectivoRepository {
    constructor(){
        this.colectivos = [];
    }
     findAll() {
        return this.colectivos;
    }

    findById(id){
        return this.colectivos.find((c)=> c.id === id);
    }
     findByNombre(nombre) {
        return this.colectivos.find((c) => c.nombre === nombre);
    }

    save(nuevo){
        const indice = this.colectivos.findIndex((c)=> c.id === nuevo.id)
        if(indice === -1){
            this.colectivos.push(nuevo)
            return nuevo
        }
        this.colectivos[indice]= nuevo
        return nuevo
    }
    delete(id) {
        this.colectivos = this.colectivos.filter((c) => c.id !== id);
    }
}

