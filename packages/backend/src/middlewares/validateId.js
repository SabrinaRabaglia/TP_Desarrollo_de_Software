import { BadRequestError } from "../errors/ApplicationErrors.js"
import { OBJECT_ID } from "../validations/objectId.js"

export function validateIdParam(paramName) {
  return (req, _res, next) => {
    if (!OBJECT_ID.test(req.params[paramName])) {
      return next(
        new BadRequestError(`El id '${req.params[paramName]}' no es válido`),
      )
    }
    next()
  }
}

export default validateIdParam("id")
