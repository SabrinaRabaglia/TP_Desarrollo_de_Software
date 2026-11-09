const opcionesJSON = {
  virtuals: true,
  versionKey: false,
  transform: (_documento, json) => {
    delete json._id
    return json
  },
}

export const opcionesJSONCon = (ajustar) => ({
  ...opcionesJSON,
  transform: (documento, json) =>
    ajustar(opcionesJSON.transform(documento, json)),
})

export default opcionesJSON
