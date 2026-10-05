import { BadRequestError } from "../errors/AppError.js"

export const OBJECT_ID = /^[0-9a-fA-F]{24}$/

export default function validateId(req, _res, next) {
  if (!OBJECT_ID.test(req.params.id)) {
    return next(new BadRequestError(`El id '${req.params.id}' no es válido`))
  }
  next()
}
