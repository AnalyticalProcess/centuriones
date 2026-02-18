import Footer from './Footer.jsx';
import '../styles/App.css';
import { useEffect, useState } from 'react';

const respuestasPermitidas = [
  'Ya asistí',
  'Ya solicite la cita',
  'Me he comunicado con la eps y no ha sido posible',
  'No he realizado actividades para la recomendación'
];

function App() {
  const [vista, setVista] = useState(() =>
    typeof window !== 'undefined' && window.location.pathname === '/encuesta-enviada'
      ? 'enviado'
      : 'formulario'
  );
  const [documento, setDocumento] = useState('');
  const [recomendacion, setRecomendacion] = useState('');
  const [error, setError] = useState('');
  const [loadingConsulta, setLoadingConsulta] = useState(false);
  const [consultaExitosa, setConsultaExitosa] = useState(false);
  const [mostrarFormularioEncuesta, setMostrarFormularioEncuesta] = useState(false);
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState('');
  const [comentario, setComentario] = useState('');
  const [mensajeEnvio, setMensajeEnvio] = useState('');
  const [loadingEnvio, setLoadingEnvio] = useState(false);

  useEffect(() => {
    const onPopState = () => {
      if (window.location.pathname === '/encuesta-enviada') {
        setVista('enviado');
      } else {
        setVista('formulario');
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const reiniciarFlujo = () => {
    setVista('formulario');
    setDocumento('');
    setRecomendacion('');
    setError('');
    setConsultaExitosa(false);
    setMostrarFormularioEncuesta(false);
    setRespuestaSeleccionada('');
    setComentario('');
    setMensajeEnvio('');
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setRecomendacion('');
    setMensajeEnvio('');
    setConsultaExitosa(false);
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
      setConsultaExitosa(true);
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
      setVista('enviado');
      window.history.pushState({}, '', '/encuesta-enviada');
    } catch (err) {
      setMensajeEnvio(err.message || 'Error inesperado al enviar la encuesta');
    } finally {
      setLoadingEnvio(false);
    }
  }

  if (vista === 'enviado') {
    return (
      <div className="app-shell">
        <main className="card card-success">
          <div className="success-badge">Envío completado</div>
          <h1>Encuesta enviada correctamente</h1>
          <p className="subtitle">
            Gracias por responder. Tu información fue registrada y será revisada por el equipo.
          </p>
          <button type="button" className="btn btn-primary" onClick={reiniciarFlujo}>
            Realizar otra consulta
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <main className="card">
        <header className="hero">
          <p className="eyebrow">Seguimiento de restricciones médicas</p>
          <h1>Consulta y responde tu recomendación</h1>
          <p className="subtitle">Ingresa tu documento, consulta tu estado y completa el seguimiento.</p>
        </header>

        <form className="form-block" onSubmit={handleSubmit}>
          <label htmlFor="documento">Número de Documento</label>
          <input
            type="text"
            id="documento"
            name="documento"
            value={documento}
            onChange={(event) => setDocumento(event.target.value)}
            inputMode="numeric"
            maxLength={20}
            required
            placeholder="Ej: 1032456789"
          />
          <button type="submit" className="btn btn-primary" disabled={loadingConsulta || consultaExitosa}>
            {loadingConsulta ? 'Consultando...' : 'Consultar'}
          </button>
          {consultaExitosa && (
            <p className="hint">
              Consulta completada. Si necesitas buscar otro documento, usa <strong>Realizar otra consulta</strong>.
            </p>
          )}
        </form>

        {recomendacion && (
          <section className="alert alert-info">
            <p className="alert-title">Recomendación encontrada</p>
            <p>{recomendacion}</p>
          </section>
        )}

        {error && (
          <section className="alert alert-error" role="alert">
            <p className="alert-title">Ocurrió un problema</p>
            <p>{error}</p>
          </section>
        )}

        {mostrarFormularioEncuesta && (
          <form className="form-block form-secondary" onSubmit={handleEnviarEncuesta}>
            <label htmlFor="respuestaEncuesta">¿Qué gestión realizaste?</label>
            <select
              id="respuestaEncuesta"
              name="respuestaEncuesta"
              value={respuestaSeleccionada}
              onChange={(event) => setRespuestaSeleccionada(event.target.value)}
              required
            >
              <option value="">Selecciona una opción</option>
              {respuestasPermitidas.map((opcion, index) => (
                <option key={opcion} value={index}>
                  {opcion}
                </option>
              ))}
            </select>

            <label htmlFor="comentario">Comentario adicional (opcional)</label>
            <textarea
              id="comentario"
              name="comentario"
              value={comentario}
              onChange={(event) => setComentario(event.target.value)}
              maxLength={200}
              placeholder="Escribe aquí información relevante para complementar tu respuesta"
              rows={4}
            />
            <p className="char-counter">{comentario.length}/200</p>

            <button type="submit" className="btn btn-secondary" disabled={loadingEnvio}>
              {loadingEnvio ? 'Enviando...' : 'Enviar encuesta'}
            </button>
          </form>
        )}

        {mensajeEnvio && <p className="hint">{mensajeEnvio}</p>}

        <button type="button" className="btn btn-ghost" onClick={reiniciarFlujo}>
          Realizar otra consulta
        </button>
      </main>
      <Footer />
    </div>
  );
}

export default App
