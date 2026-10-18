export const catalogoDTO = (item) =>
  item && {
    id: item.id,
    nombre: item.nombre,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
