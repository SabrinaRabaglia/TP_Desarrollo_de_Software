import { useState } from "react";

const BarraDeBusqueda = ({ placeholder = "Buscar...", onBuscar }) => {
  const [texto, setTexto] = useState("");

  const manejarEnvio = (e) => {
    e.preventDefault(); 
    onBuscar(texto);   
  };

  return (
    <form onSubmit={manejarEnvio} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
      <input
        type="text"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={placeholder}
        style={{ flexGrow: 1, padding: '8px' }}
      />
      <button type="submit" style={{ padding: '8px 16px' }}>
        Buscar
      </button>
    </form>
  );
};

export default BarraDeBusqueda;