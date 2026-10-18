import { BadRequestError } from "../errors/ApplicationErrors.js"
import { OBJECT_ID } from "../validations/objectId.js"

export default function validateId(req, _res, next) {
  if (!OBJECT_ID.test(req.params.id)) {
    return next(new BadRequestError(`El id '${req.params.id}' no es válido`))
  }
  next()
}
