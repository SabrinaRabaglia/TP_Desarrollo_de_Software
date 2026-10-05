export default async function guardar(model, entidad) {
  const documento = entidad instanceof model ? entidad : new model(entidad)
  return await documento.save()
}
