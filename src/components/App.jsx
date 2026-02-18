import Footer from './Footer.jsx';
import '../styles/App.css';
import { useState } from 'react';

const respuestasPermitidas = [
  'Ya asistí',
  'Ya solicite la cita',
  'Me he comunicado con la eps y no ha sido posible',
  'No he realizado actividades para la recomendación'
];

function App() {
  const [documento, setDocumento] = useState('');
  const [recomendacion, setRecomendacion] = useState('');
  const [error, setError] = useState('');
  const [loadingConsulta, setLoadingConsulta] = useState(false);
  const [mostrarFormularioEncuesta, setMostrarFormularioEncuesta] = useState(false);
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState('');
  const [comentario, setComentario] = useState('');
  const [mensajeEnvio, setMensajeEnvio] = useState('');
  const [loadingEnvio, setLoadingEnvio] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setRecomendacion('');
    setMensajeEnvio('');
    setMostrarFormularioEncuesta(false);
    setLoadingConsulta(true);

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
      setMostrarFormularioEncuesta(true);
    } catch (err) {
      setError(err.message || 'Error inesperado');
    } finally {
      setLoadingConsulta(false);
    }
  }

  async function handleEnviarEncuesta(event) {
    event.preventDefault();
    setMensajeEnvio('');
    setError('');

    if (respuestaSeleccionada === '') {
      setMensajeEnvio('Selecciona una respuesta antes de enviar.');
      return;
    }

    setLoadingEnvio(true);
    try {
      const response = await fetch('/.netlify/functions/enviarEncuesta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [documento.trim(), String(respuestaSeleccionada), comentario.trim()],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo enviar la encuesta');
      }

      setMensajeEnvio('Encuesta enviada correctamente.');
      setRespuestaSeleccionada('');
      setComentario('');
    } catch (err) {
      setMensajeEnvio(err.message || 'Error inesperado al enviar la encuesta');
    } finally {
      setLoadingEnvio(false);
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
        <button type="submit" disabled={loadingConsulta}>
          {loadingConsulta ? 'Consultando...' : 'Consultar'}
        </button>  
      </form>
      {recomendacion && <p><strong>Recomendación:</strong> {recomendacion}</p>}
      {error && <p role="alert">{error}</p>}
      {mostrarFormularioEncuesta && (
        <form onSubmit={handleEnviarEncuesta}>
          <label htmlFor="respuestaEncuesta">Estado de recomendación:</label>
          <select
            id="respuestaEncuesta"
            name="respuestaEncuesta"
            value={respuestaSeleccionada}
            onChange={(event) => setRespuestaSeleccionada(event.target.value)}
            required
          >
            <option value="">Seleccione una opción</option>
            {respuestasPermitidas.map((opcion, index) => (
              <option key={opcion} value={index}>
                {opcion}
              </option>
            ))}
          </select>

          <label htmlFor="comentario">Comentario adicional:</label>
          <input
            type="text"
            id="comentario"
            name="comentario"
            value={comentario}
            onChange={(event) => setComentario(event.target.value)}
            maxLength={200}
            placeholder="Escribe un comentario adicional"
          />

          <button type="submit" disabled={loadingEnvio}>
            {loadingEnvio ? 'Enviando...' : 'Enviar'}
          </button>
        </form>
      )}
      {mensajeEnvio && <p>{mensajeEnvio}</p>}
      <Footer />
    </div>
  )
}

export default App
