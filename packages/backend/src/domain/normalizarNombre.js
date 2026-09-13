export default function normalizarNombre(nombre) {
  if (typeof nombre !== "string") return ""

  return nombre.normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
}
