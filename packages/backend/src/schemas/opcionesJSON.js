export default {
  virtuals: true,
  versionKey: false,
  transform: (_documento, json) => {
    delete json._id
    return json
  },
}
