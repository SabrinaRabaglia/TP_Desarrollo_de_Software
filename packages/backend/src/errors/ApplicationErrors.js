export class ApplicationError extends Error {
  constructor(message) {
    super(message)
    this.name = this.constructor.name
  }
}

export class EntityNotFound extends ApplicationError {}

export class InvalidReference extends ApplicationError {}

export class AlreadyExists extends ApplicationError {}

export class EntityInUse extends ApplicationError {}

export class BadRequestError extends ApplicationError {
  constructor(message, details = []) {
    super(message)
    this.details = details
  }
}
