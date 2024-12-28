import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChatMessage as ChatMessageType } from './types';
import { ChatMessage } from './components/ChatMessage';
import { ServerStatus } from './components/ServerStatus';
import { sendQuery, endChat, resetChat } from './services/api';
import { APIError } from './utils/errorHandling';
import { API_CONFIG } from './config/constants';
import { Calendar } from 'lucide-react';
import EventsPage from './pages/EventsPage';

enum QueryStage {
  AskingName = 0,
  AskingPhone = 1,
  ChoosingQueryType = 2,
  EnteringRadicado = 3,
  EnteringFolio = 4,
  ShowingResults = 5
}

export const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [queryStage, setQueryStage] = useState<QueryStage>(QueryStage.AskingName);
  const [userName, setUserName] = useState<string>('');
  const [userPhone, setUserPhone] = useState<string>('');
  const [queryResult, setQueryResult] = useState<string>('');
  const [selectedQueryType, setSelectedQueryType] = useState<'radicado' | 'folio' | null>(null);
  const [serverStatus, setServerStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [isLoading, setIsLoading] = useState(false);
  const [showEventsPage, setShowEventsPage] = useState(false);
  const [currentInput, setCurrentInput] = useState('');

  // Ref para el auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use a ref to track if welcome message has been sent
  const welcomeMessageSent = useRef(false);

  // Función para agregar mensajes al chat
  const addMessage = useCallback((role: 'user' | 'bot', content: string) => {
    const message = { role, content };
    console.log('Adding message:', JSON.stringify(message, null, 2));
    setMessages(prev => [...prev, message]);
  }, []);

  // Verificar estado del servidor
  useEffect(() => {
    fetch(`${API_CONFIG.BASE_URL}/test`)
      .then(response => response.json())
      .then(() => setServerStatus('connected'))
      .catch(() => setServerStatus('error'));
  }, []);

  // Mostrar mensaje de bienvenida inicial
  useEffect(() => {
    if (messages.length === 0 && serverStatus === 'connected') {
      addMessage('bot', '¡Hola! 👋 Bienvenido al Centro de Consulta de Expedientes.\nPor favor, ¿podrías decirme tu nombre?');
    }
  }, [messages.length, serverStatus, addMessage]);

  // Scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const resetChat = useCallback(() => {
    setMessages([]);
    setQueryStage(QueryStage.AskingName);
    setUserName('');
    setUserPhone('');
    setSelectedQueryType(null);
  }, []);

  const handleEndChat = useCallback(async () => {
    try {
      if (userName && userPhone) {
        await endChat(userName, userPhone);
      }
      addMessage('bot', 'Gracias por usar nuestro servicio. ¡Hasta pronto!');
      setTimeout(() => {
        resetChat();
      }, 2000);
    } catch (error) {
      console.error('Error ending chat:', error);
      addMessage('bot', 'Hubo un error al finalizar el chat. Por favor, intenta nuevamente.');
    }
  }, [userName, userPhone, addMessage, resetChat]);

  const handleQueryTypeSelection = useCallback((type: 'radicado' | 'folio' | 'whatsapp' | 'end') => {
    if (type === 'end') {
      handleEndChat();
    } else if (type === 'whatsapp') {
      window.open('https://wa.me/573187423430', '_blank');
      handleEndChat();
    } else {
      setSelectedQueryType(type);
      const message = type === 'radicado'
        ? 'Por favor, ingresa el número de radicado que deseas consultar:'
        : 'Por favor, ingresa el número de folio de matrícula que deseas consultar:';
      addMessage('bot', message);
      setQueryStage(type === 'radicado' ? QueryStage.EnteringRadicado : QueryStage.EnteringFolio);
    }
  }, [addMessage, handleEndChat]);

  const showOptions = useCallback(() => {
    addMessage('bot', `¿Qué información deseas consultar, ${userName}?\n\n` +
      '1. Consultar por Radicado\n' +
      '2. Consultar por Folio de Matrícula\n' +
      '3. Comunicarse con un Servidor Judicial\n' +
      '4. Terminar chat');
    setQueryStage(QueryStage.ChoosingQueryType);
  }, [userName, addMessage]);

  const handleNameInput = useCallback((message: string) => {
    const trimmedName = message.trim();
    if (trimmedName.length === 0) {
      addMessage('bot', 'Por favor, ingresa un nombre válido.');
      return;
    }
    setUserName(trimmedName);
    console.log('Setting user name:', trimmedName);
    addMessage('bot', `Mucho gusto ${trimmedName}, ¿podrías proporcionarme tu número de teléfono de contacto? (Debe ser un número de 10 dígitos)`);
    setQueryStage(QueryStage.AskingPhone);
  }, [addMessage]);

  const handlePhoneInput = useCallback((message: string) => {
    const trimmedPhone = message.trim();
    if (!validatePhoneNumber(trimmedPhone)) {
      addMessage('bot', 'Por favor, ingresa un número de teléfono válido que contenga 10 dígitos numéricos.\nPor ejemplo: 3001234567');
      return;
    }
    setUserPhone(trimmedPhone);
    console.log('Setting user phone:', trimmedPhone);
    setQueryStage(QueryStage.ChoosingQueryType);
    addMessage('bot', `Gracias por proporcionar tu número de teléfono: ${trimmedPhone}`);
    setTimeout(() => {
      showOptions();
    }, 500);
  }, [addMessage, showOptions]);

  const handleRadicadoInput = useCallback(async (message: string) => {
    try {
      console.log('Submitting radicado query with user info:', { userName, userPhone });
      const response = await sendQuery(message, '1', userName, userPhone);
      handleQueryResponse(response);
    } catch (error) {
      console.error('Error submitting query:', error);
      addMessage('bot', 'Lo siento, hubo un error al procesar tu consulta. Por favor, intenta de nuevo.');
      showOptions();
    }
  }, [userName, userPhone, addMessage, showOptions]);

  const handleFolioInput = useCallback(async (message: string) => {
    try {
      const trimmedFolio = message.trim();
      if (!validateFolioFormat(trimmedFolio)) {
        addMessage('bot', 'Por favor, ingresa un número de Folio de Matrícula válido en alguno de estos formatos:\n000-00, 000-000, 000-0000, 000-00000, 000-000000\nPor ejemplo: 123-45 o 123-45678');
        return;
      }
      console.log('Submitting folio query with user info:', { userName, userPhone });
      const response = await sendQuery(trimmedFolio, '2', userName, userPhone);
      handleQueryResponse(response);
    } catch (error) {
      console.error('Error submitting query:', error);
      addMessage('bot', 'Lo siento, hubo un error al procesar tu consulta. Por favor, intenta nuevamente.');
      showOptions();
    }
  }, [userName, userPhone, addMessage, showOptions]);

  const handleMessage = useCallback(async (message: string) => {
    if (isLoading) return;

    switch (queryStage) {
      case QueryStage.AskingName:
        handleNameInput(message);
        break;

      case QueryStage.AskingPhone:
        handlePhoneInput(message);
        break;

      case QueryStage.ChoosingQueryType:
        if (message === '1') {
          handleQueryTypeSelection('radicado');
        } else if (message === '2') {
          handleQueryTypeSelection('folio');
        } else if (message === '3') {
          handleQueryTypeSelection('whatsapp');
        } else if (message === '4') {
          handleQueryTypeSelection('end');
        } else {
          addMessage('bot', `${userName}, por favor selecciona una opción válida:\n\n1. Consultar por Radicado\n2. Consultar por Folio de Matrícula\n3. Comunicarse con un Servidor Judicial\n4. Terminar chat`);
        }
        break;

      case QueryStage.EnteringRadicado:
        handleRadicadoInput(message);
        break;

      case QueryStage.EnteringFolio:
        handleFolioInput(message);
        break;

      default:
        console.error('Estado no manejado:', queryStage);
    }
  }, [
    queryStage,
    isLoading,
    handleNameInput,
    handlePhoneInput,
    handleQueryTypeSelection,
    handleRadicadoInput,
    handleFolioInput,
    userName,
    addMessage
  ]);

  const handleQueryResponse = (response: any) => {
    const formattedResponse = {
      radicado: response.radicado || 'No disponible',
      predio: response.predio || 'No disponible',
      municipio: response.municipio || 'No disponible',
      solicitante: response.solicitante || 'No disponible',
      opositor: response.opositor || 'No disponible',
      estado: response.estado || 'No disponible',
      ultimaActuacion: response.ultimaActuacion || 'No disponible',
      fechaProvidencia: response.fechaProvidencia || 'No disponible',
      fechaNotificacion: response.fechaNotificacion || 'No disponible',
      enlace: response.enlace || '',
    };

    // Crear un mensaje formateado más amigable
    const messageLines = [
      '📄 Información del Radicado:',
      `• Número: ${formattedResponse.radicado}`,
      `• Predio: ${formattedResponse.predio}`,
      `• Municipio: ${formattedResponse.municipio}`,
      '',
      '👥 Participantes:',
      `• Solicitante: ${formattedResponse.solicitante}`,
      `• Opositor: ${formattedResponse.opositor}`,
      '',
      '📊 Estado del Proceso:',
      `• Estado actual: ${formattedResponse.estado}`,
      `• Última actuación: ${formattedResponse.ultimaActuacion}`,
      `• Fecha providencia: ${formattedResponse.fechaProvidencia}`,
      `• Fecha notificación: ${formattedResponse.fechaNotificacion}`,
    ];

    // Agregar el enlace solo si está disponible, ahora con formato HTML
    if (formattedResponse.enlace) {
      messageLines.push('', `🔗 <a href="${formattedResponse.enlace}" target="_blank" rel="noopener noreferrer" class="document-link">Ver documento</a>`);
    }

    addMessage('bot', messageLines.join('\n'));
    setQueryStage(QueryStage.ChoosingQueryType);
    setTimeout(() => {
      showOptions();
    }, 1000);
  };

  const handleQuerySubmit = useCallback(async (queryText: string) => {
    try {
      setIsLoading(true);
      const option = selectedQueryType === 'radicado' ? '1' : '2';
      const response = await sendQuery(queryText, option);
      setQueryResult(response.response);
      addMessage('bot', response.response);
      showOptions();
    } catch (error) {
      console.error('Query submission error:', error);
      addMessage('bot', 'Lo siento, hubo un error al procesar tu consulta. Por favor, intenta nuevamente.');
      showOptions();
    } finally {
      setIsLoading(false);
    }
  }, [selectedQueryType, showOptions, addMessage]);

  const toggleEventsView = () => {
    setShowEventsPage(!showEventsPage);
  };

  const getPlaceholderText = () => {
    switch (queryStage) {
      case QueryStage.AskingName:
        return 'Ingresa tu nombre';
      case QueryStage.AskingPhone:
        return 'Ingresa tu número de teléfono';
      case QueryStage.EnteringRadicado:
        return 'Ingresa el número de radicado';
      case QueryStage.EnteringFolio:
        return 'Ingresa el número de Folio de Matrícula';
      default:
        return 'Ingresa tu mensaje';
    }
  };

  const handleSendMessageWithInput = () => {
    handleMessage(currentInput);
    setCurrentInput('');
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Eliminar espacios y guiones si los hay
    const cleanPhone = phone.replace(/[\s-]/g, '');
    // Verificar que solo contenga números y tenga exactamente 10 dígitos
    return /^\d{10}$/.test(cleanPhone);
  };

  const validateFolioFormat = (folio: string): boolean => {
    // Formato: 000-00, 000-000, 000-0000, 000-00000, 000-000000
    const folioRegex = /^\d{3}-\d{2,6}$/;
    return folioRegex.test(folio);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 max-w-full overflow-hidden">
      <header className="bg-gradient-to-l from-blue-600 to-white p-4 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex-1">
            <img 
              src="/src/assets/logo.png" 
              alt="Logo" 
              className="h-12 w-auto"
            />
          </div>
          <div className="flex-1 text-center max-w-3xl mx-auto px-4">
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight text-blue-800 leading-tight">
              <span className="md:hidden">Asistente Virtual</span>
              <span className="hidden md:inline">
                Asistente Virtual Juzgado 01 Civil del Circuito Especializado en Restitución de Tierras de El Carmen de Bolívar
              </span>
            </h1>
          </div>
          <div className="flex-1 flex justify-end">
            <button
              onClick={toggleEventsView}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-blue-900 rounded-lg hover:bg-yellow-400 transition-colors font-semibold"
            >
              <Calendar size={20} />
              <span className="hidden sm:inline">Eventos</span>
            </button>
          </div>
        </div>
      </header>

      {showEventsPage ? (
        <div className="flex-1 overflow-y-auto">
          <EventsPage />
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto space-y-4 p-2 sm:p-4 max-w-full">
            <div className="max-w-full mx-auto">
              {messages.map((message, index) => (
                <ChatMessage key={index} message={message} />
              ))}
              {isLoading && (
                <div className="text-center text-gray-500 italic p-4">
                  Cargando...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Chat Input Section */}
          <div className="p-4 bg-white border-t">
            <div className="container mx-auto max-w-4xl">
              {queryStage === QueryStage.ChoosingQueryType && (
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <button
                    onClick={() => handleQueryTypeSelection('radicado')}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Consultar por Radicado
                  </button>
                  <button
                    onClick={() => handleQueryTypeSelection('folio')}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Consultar por Folio
                  </button>
                  <button
                    onClick={() => handleQueryTypeSelection('whatsapp')}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Comunicarse con un Servidor Judicial
                  </button>
                  <button
                    onClick={() => handleQueryTypeSelection('end')}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Terminar chat
                  </button>
                </div>
              )}
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessageWithInput();
                    }
                  }}
                  placeholder={getPlaceholderText()}
                  className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading || (queryStage === QueryStage.ChoosingQueryType)}
                />
                <button
                  onClick={handleSendMessageWithInput}
                  disabled={isLoading || !currentInput.trim() || (queryStage === QueryStage.ChoosingQueryType)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <ServerStatus status={serverStatus} />
    </div>
  );
};