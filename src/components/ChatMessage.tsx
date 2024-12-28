import React from 'react';
import './ChatMessage.css';
import { ChatMessageType } from '../types';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isBot = message.role === 'bot';
  const content = message.content || 'No hay contenido disponible';

  const formatMessage = (content: string) => {
    try {
      // Intentar parsear el contenido como JSON solo si parece ser JSON
      if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
        const data = JSON.parse(content);
        return (
          <div className="radicado-info">
            <h3>Información del Radicado</h3>
            <div className="info-grid">
              <div className="info-section">
                <p><strong>Radicado:</strong> {data.radicado}</p>
                <p><strong>Predio:</strong> {data.predio}</p>
                <p><strong>Municipio:</strong> {data.municipio}</p>
                <p><strong>Solicitante:</strong> {data.solicitante}</p>
                <p><strong>Opositor:</strong> {data.opositor}</p>
                <p><strong>Estado:</strong> {data.estado}</p>
              </div>
              <div className="info-section">
                <p><strong>Última Actuación:</strong> {data.ultimaActuacion}</p>
                <p><strong>Fecha Providencia:</strong> {data.fechaProvidencia}</p>
                <p><strong>Fecha Notificación:</strong> {data.fechaNotificacion}</p>
                <p><strong>Días desde última actuación:</strong> {data.diasUltimaActuacion}</p>
                <p><strong>Sustanciador:</strong> {data.sustanciador}</p>
                {data.enlace && (
                  <p>
                    <strong>Enlace:</strong>{' '}
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
            </div>
          </div>
        );
      }

      // Si el contenido contiene emojis y viñetas, asumimos que es el nuevo formato
      if (content.includes('📄') || content.includes('•')) {
        return (
          <div className="formatted-message">
            {content.split('\n').map((line, index) => {
              // Si la línea contiene un enlace HTML
              if (line.includes('<a href=')) {
                const hrefMatch = line.match(/href="([^"]+)"/);
                const linkText = line.match(/>([^<]+)</);
                const emoji = line.match(/^([^\s]+)/); // Captura el emoji al inicio
                
                if (hrefMatch && linkText) {
                  return (
                    <div key={index} className="message-line">
                      {emoji && emoji[1]} {/* Muestra el emoji si existe */}
                      <a 
                        href={hrefMatch[1]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="document-link"
                      >
                        {linkText[1]}
                      </a>
                    </div>
                  );
                }
              }
              
              return (
                <div key={index} className={`message-line ${line.trim() === '' ? 'message-spacer' : ''}`}>
                  {line}
                </div>
              );
            })}
          </div>
        );
      }

      // Para otros mensajes regulares
      return <div className="regular-message">{content}</div>;
    } catch (error) {
      return <div className="regular-message">{content}</div>;
    }
  };

  return (
    <div className={`message ${isBot ? 'bot' : 'user'}`}>
      {isBot && <span className="bot-icon">🤖</span>}
      {!isBot && <span className="user-icon">👤</span>}
      <div className="message-content">
        {formatMessage(content)}
      </div>
    </div>
  );
};