import "./ListaDeCuentas.css"

const ListaDeCuentas = ({ cuentas }) => {
  return (
    <ul className="lista-de-Cuentas">
      {cuentas.map((cuenta) => (
        <li key={cuenta} className="lista-de-cuentas-item">
          {cuenta.tipo} {"-"} {cuenta.usuario}
        </li>
      ))}
    </ul>
  )
}

export default ListaDeCuentas
