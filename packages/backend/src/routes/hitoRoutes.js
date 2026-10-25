import { Router } from "express";
import { hitoController } from "../dependencias.js"; 

import validateId from "../middlewares/validateId.js"

const routes = Router();

// actualizar un hito dado su id
routes.patch("/hitos/:id", validateId, hitoController.update);

//borrar un hito dado su id
routes.delete("/hitos/:id", validateId, hitoController.delete);


export default routes;
