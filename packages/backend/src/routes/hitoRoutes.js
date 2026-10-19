import { Router } from "express";
import { hitoController } from "../dependencias.js"; 

const routes = Router();

// actualizar un hito dado su id
routes.patch("/:id", hitoController.update);

//borrar un hito dado su id
routes.delete("/:id", hitoController.delete);

export default routes;