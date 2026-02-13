import Footer from './Footer.jsx';
import '../styles/App.css';
import { useState } from 'react';

function App() {
  const [documento, setDocumento] = useState('');
  const [recomendacion, setRecomendacion] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setRecomendacion('');
    setLoading(true);

    try {
      const documentoSanitizado = documento.trim();

      if (!/^\d{1,20}$/.test(documentoSanitizado)) {
        throw new Error('El documento debe contener solo dígitos (máximo 20).');
      }

      const response = await fetch('/.netlify/functions/recuperarRecuperacion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: documentoSanitizado }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo consultar la recomendación');
      }

      setRecomendacion(data.recomendacion || 'Sin recomendación');
    } catch (err) {
      setError(err.message || 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h1>Seguimiento de Restricciones Médicas</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="documento">Número de Documento:</label>
          <input
            type="text"
            id="documento"
            name="documento"
            value={documento}
            onChange={(event) => setDocumento(event.target.value)}
            inputMode="numeric"
            maxLength={20}
            required
            placeholder="Ingrese su número de documento"
          />
        <button type="submit" disabled={loading}>
          {loading ? 'Consultando...' : 'Consultar'}
        </button>  
      </form>
      {recomendacion && <p><strong>Recomendación:</strong> {recomendacion}</p>}
      {error && <p role="alert">{error}</p>}
      <Footer />
    </div>
  )
}

export default App
