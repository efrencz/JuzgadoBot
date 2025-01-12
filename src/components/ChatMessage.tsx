import React from 'react';
import './ChatMessage.css';
import { ChatMessageType, SearchResult } from '../types';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isBot = message.role === 'bot';

  const renderHoja1Result = (data: SearchResult) => (
    <div className="radicado-info">
      <h3>📋 Información del Proceso</h3>
      <p><span className="icon">📝</span><strong>Radicado</strong> {data.radicado}</p>
      <p><span className="icon">🏠</span><strong>Predio</strong> {data.predio}</p>
      <p><span className="icon">🌆</span><strong>Municipio</strong> {data.municipio}</p>
      <p><span className="icon">👤</span><strong>Solicitante</strong> {data.solicitante}</p>
      {data.opositor && <p><span className="icon">👥</span><strong>Opositor</strong> {data.opositor}</p>}
      {data.estado && <p><span className="icon">🔄</span><strong>Estado</strong> {data.estado}</p>}
      {data.ultimaActuacion && <p><span className="icon">✍️</span><strong>Última Actuación</strong> {data.ultimaActuacion}</p>}
      {data.fechaProvidencia && <p><span className="icon">📅</span><strong>Fecha Providencia</strong> {data.fechaProvidencia}</p>}
      {data.fechaNotificacion && <p><span className="icon">📢</span><strong>Fecha Notificación</strong> {data.fechaNotificacion}</p>}
      {data.enlace && (
        <p>
          <span className="icon">🔗</span><strong>Enlace</strong>
          <a 
            href={data.enlace} 
            target="_blank" 
            rel="noopener noreferrer"
            className="document-link"
          >
            Ver documento 📄
          </a>
        </p>
      )}
    </div>
  );

  const renderHoja3Result = (data: SearchResult) => (
    <div className="radicado-info">
      <h3>📋 Información de Sentencia</h3>
      <p><span className="icon">📝</span><strong>Radicado</strong> {data.radicado}</p>
      <p><span className="icon">🏠</span><strong>Predio</strong> {data.predio}</p>
      <p><span className="icon">🌆</span><strong>Municipio</strong> {data.municipio}</p>
      <p><span className="icon">👤</span><strong>Solicitante</strong> {data.solicitante}</p>
      {data.fechaSentencia && <p><span className="icon">⚖️</span><strong>Fecha Sentencia</strong> {data.fechaSentencia}</p>}
      {data.enlaceSentencia && (
        <p>
          <span className="icon">🔗</span><strong>Enlace</strong>
          <a 
            href={data.enlaceSentencia} 
            target="_blank" 
            rel="noopener noreferrer"
            className="document-link"
          >
            Ver sentencia 📄
          </a>
        </p>
      )}
    </div>
  );

  const formatMessage = (content: any) => {
    if (typeof content === 'string') {
      return <p className="formatted-message">{content}</p>;
    }

    if (Array.isArray(content)) {
      if (content.length === 0) {
        return <p className="formatted-message">No se encontraron resultados.</p>;
      }

      return (
        <>
          {content.map((result: SearchResult, index: number) => (
            <React.Fragment key={index}>
              {result.source === 'Hoja 1' && renderHoja1Result(result)}
              {result.source === 'Hoja 3' && renderHoja3Result(result)}
              {index < content.length - 1 && <hr />}
            </React.Fragment>
          ))}
        </>
      );
    }

    if (content && typeof content === 'object') {
      if (content.source === 'Hoja 1') {
        return renderHoja1Result(content as SearchResult);
      }
      if (content.source === 'Hoja 3') {
        return renderHoja3Result(content as SearchResult);
      }
    }

    return <p className="formatted-message">Formato de respuesta no reconocido.</p>;
  };

  return (
    <div className={`message ${isBot ? 'bot' : 'user'}`}>
      {isBot && <span className="bot-icon">🤖</span>}
      {!isBot && <span className="user-icon">👤</span>}
      {formatMessage(message.content)}
    </div>
  );
};