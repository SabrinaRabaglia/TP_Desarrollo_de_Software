
class ProyectoRepository {
     constructor(){
            this.proyectos = []
        }
        
    findAll() {
        return this.proyectos;
    }

    findById(id){
        return this.proyectos.find((c)=> c.id === id);
    }
     findByNombre(nombre) {
        return this.proyectos.find((c) => c.nombre === nombre);
    }
    save(nuevo){
            const indice = this.proyectos.findIndex((p) => p.id === nuevo.id);
            if(indice === -1){
                this.proyectos.push(nuevo)
                return nuevo
            }
            this.proyectos[indice]= nuevo
            return nuevo
    }

     delete(id) {
        this.colectivos = this.colectivos.filter((c) => c.id !== id);
    }
}

const proyectoRepository = new ProyectoRepository();
export default proyectoRepository;