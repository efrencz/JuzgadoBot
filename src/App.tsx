import React, { useState, useEffect, useRef } from 'react';
import { sendQuery, testConnection } from './api';
import { ChatMessage as ChatMessageType } from './types';
import { ChatMessage } from './components/ChatMessage';
import { APIError } from './utils/errorHandling';
import { API_CONFIG } from './config/constants';
import { Calendar, Search, FileText, MessageSquare, LogOut, Send, Bot, User, MessageCircle } from 'lucide-react';
import EventsPage from './pages/EventsPage';

enum QueryStage {
  AskingName = 0,
  AskingPhone = 1,
  ChoosingQueryType = 2,
  EnteringRadicado = 3,
  EnteringFolio = 4,
  ShowingResults = 5
}

interface Message {
  role: 'user' | 'bot';
  content: string | object;
}

export const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [queryStage, setQueryStage] = useState<QueryStage>(QueryStage.AskingName);
  const [selectedQueryType, setSelectedQueryType] = useState<'radicado' | 'folio' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [showEventsPage, setShowEventsPage] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isResetting = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Agregar mensaje de bienvenida inicial
    setMessages([{
      role: 'bot',
      content: '¡Bienvenido al Chatbot del Juzgado! Por favor, dime tu nombre para comenzar.'
    }]);

    const checkConnection = async () => {
      const isConnected = await testConnection();
      if (!isConnected) {
        setError('No se pudo conectar con el servidor. Por favor, inténtelo más tarde.');
      } else {
        setServerStatus('connected');
      }
    };
    checkConnection();
  }, []);

  useEffect(() => {
    if (serverStatus === 'connected' && messages.length === 0 && queryStage === QueryStage.AskingName && !isResetting.current) {
      addMessage({
        role: 'bot',
        content: '👋 ¡Hola! Soy el asistente virtual del Juzgado. Para empezar, ¿podrías decirme tu nombre? 😊'
      });
    }
  }, [serverStatus, messages.length, queryStage]);

  const addMessage = (message: Message) => {
    console.log('Adding message:', message);
    setMessages(prev => [...prev, message]);
  };

  const validateRadicado = (radicado: string): boolean => {
    // Formato esperado: 1234-12345
    const radicadoRegex = /^\d{4}-\d{5}$/;
    return radicadoRegex.test(radicado);
  };

  const validateFolio = (folio: string): boolean => {
    // Formato esperado: XXX-X hasta XXX-XXXXXX (3 dígitos, guion, 1-6 dígitos)
    const folioRegex = /^\d{3}-\d{1,6}$/;
    return folioRegex.test(folio);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Validación específica para el número de teléfono
    if (queryStage === QueryStage.AskingPhone) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(input.trim())) {
        addMessage({ 
          role: 'bot', 
          content: 'El número de teléfono debe tener exactamente 10 dígitos. Por favor, intenta nuevamente.' 
        });
        return;
      }
    }

    // Validación específica para radicado y folio
    if (queryStage === QueryStage.EnteringRadicado || queryStage === QueryStage.EnteringFolio) {
      const userInput = input.trim();
      
      if (selectedQueryType === 'radicado' && !validateRadicado(userInput)) {
        addMessage({
          role: 'bot',
          content: 'El formato del radicado debe ser: 1234-12345 (4 dígitos, guion, 5 dígitos). Por favor, intenta nuevamente.'
        });
        return;
      }
      
      if (selectedQueryType === 'folio' && !validateFolio(userInput)) {
        addMessage({
          role: 'bot',
          content: 'El formato del folio debe ser: XXX-X hasta XXX-XXXXXX (3 dígitos, guion, entre 1 y 6 dígitos). Por ejemplo: 123-1, 123-12, 123-123, etc. Por favor, intenta nuevamente.'
        });
        return;
      }
    }

    const userMessage = input.trim();
    setInput('');
    addMessage({ role: 'user', content: userMessage });

    try {
      setIsLoading(true);
      setError(null);

      if (queryStage === QueryStage.AskingName) {
        setUserName(userMessage);
        addMessage({
          role: 'bot',
          content: `👋 ¡Hola **${userMessage}**! Me alegro de conocerte. ¿Podrías proporcionarme tu número de teléfono de contacto? 📱`
        });
        setQueryStage(QueryStage.AskingPhone);
      } else if (queryStage === QueryStage.AskingPhone) {
        setUserPhone(userMessage);
        addMessage({
          role: 'bot',
          content: `Gracias por la información. ¿En qué puedo ayudarte hoy? 🤝`
        });
        setQueryStage(QueryStage.ChoosingQueryType);
      } else if (queryStage === QueryStage.EnteringRadicado || queryStage === QueryStage.EnteringFolio) {
        const response = await sendQuery({
          query: userMessage,
          option: selectedQueryType === 'radicado' ? 'radicado' : 'predio',
          userName,
          userPhone
        });

        if (response.error) {
          throw new Error(response.error);
        }

        // Mostrar la respuesta formateada
        const formattedResponse = formatResponse(response, selectedQueryType || '');
        console.log('Respuesta formateada:', formattedResponse);
        
        addMessage({
          role: 'bot',
          content: formattedResponse
        });
        
        // Después de mostrar la respuesta, preguntar qué más desea hacer
        setTimeout(() => {
          setQueryStage(QueryStage.ChoosingQueryType);
          addMessage({
            role: 'bot',
            content: '¿Hay algo más en lo que pueda ayudarte? 😊'
          });
        }, 1000);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Error al procesar la consulta');
      addMessage({
        role: 'bot',
        content: `❌ **Error:** ${err instanceof Error ? err.message : 'Error al procesar la consulta'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatResponse = (response: any, queryType: string) => {
    if (!response || !response.data) {
      return '❌ No se encontraron datos para la consulta.';
    }

    const data = response.data;
    
    // Si es un array de resultados
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return '❌ No se encontraron datos para la consulta.';
      }

      // Devolver el array de objetos directamente
      return data;
    }

    // Si es un objeto individual
    if (typeof data === 'object') {
      // Devolver el objeto directamente
      return data;
    }

    // Si es un mensaje de texto
    if (typeof data === 'string') {
      return data;
    }

    return '❌ Formato de respuesta no reconocido.';
  };

  const handleQueryTypeSelection = (type: 'radicado' | 'folio') => {
    setSelectedQueryType(type);
    setQueryStage(type === 'radicado' ? QueryStage.EnteringRadicado : QueryStage.EnteringFolio);
    addMessage({
      role: 'bot',
      content: type === 'radicado' 
        ? '📝 Por favor, ingresa el número de radicado que deseas consultar:' 
        : '🔍 Por favor, ingresa el número de folio de matrícula que deseas consultar:'
    });
  };

  const handleContactSupport = () => {
    window.open('https://wa.me/573102383749', '_blank');
    addMessage({
      role: 'bot',
      content: '👋 Gracias por usar nuestro servicio. ¡Hasta pronto!'
    });
    setTimeout(() => {
      setMessages([]);
      setQueryStage(QueryStage.AskingName);
      setUserName('');
      setUserPhone('');
      setSelectedQueryType(null);
    }, 2000);
  };

  const resetChat = () => {
    if (isResetting.current) return; // Evitar resets múltiples
    isResetting.current = true;
    
    setMessages([{
      role: 'bot',
      content: '👋 ¡Hola! Por favor, ingresa tu nombre para comenzar.'
    }]);
    setQueryStage(QueryStage.AskingName);
    setSelectedQueryType(null);
    setInput('');
    setUserName('');
    setUserPhone('');
    
    isResetting.current = false;
  };

  const handleReset = () => {
    // Mostrar mensaje de confirmación
    if (window.confirm('¿Estás seguro que deseas terminar el chat? Se perderá toda la conversación.')) {
      resetChat();
    }
  };

  const toggleView = () => {
    setShowCalendar(!showCalendar);
    // Ya no reseteamos el chat al cambiar de vista
  };

  const getPlaceholderText = () => {
    switch (queryStage) {
      case QueryStage.AskingName:
        return "👋 Ingresa tu nombre...";
      case QueryStage.AskingPhone:
        return "📱 Ingresa tu número de teléfono...";
      case QueryStage.EnteringRadicado:
        return "📝 Ingresa el número de radicado...";
      case QueryStage.EnteringFolio:
        return "🔍 Ingresa el número de folio...";
      default:
        return "";
    }
  };

  if (!accepted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4">Aviso Legal y Tratamiento de Datos Personales</h2>
          
          <div className="prose prose-sm max-h-96 overflow-y-auto mb-6">
            <p className="mb-4">
              <strong>Aviso Importante:</strong> Esta herramienta es únicamente un apoyo informativo 
              y NO reemplaza ni sustituye los canales oficiales proporcionados por la Rama Judicial 
              de Colombia para la consulta de procesos judiciales.
            </p>

            <p className="mb-4">
              Para consultas oficiales, por favor utilice los canales establecidos por la 
              Rama Judicial en <a href="https://www.ramajudicial.gov.co" target="_blank" rel="noopener noreferrer" 
              className="text-blue-600 hover:text-blue-800">www.ramajudicial.gov.co</a>
            </p>

            <p className="mb-4">
              <strong>Tratamiento de Datos Personales:</strong> De acuerdo con la Ley 1581 de 2012 
              (Ley de Protección de Datos Personales) y el Decreto 1377 de 2013, al utilizar esta 
              herramienta usted acepta que los datos personales suministrados sean tratados para:
            </p>

            <ul className="list-disc pl-6 mb-4">
              <li>Facilitar la consulta de información procesal</li>
              <li>Mantener un registro de las consultas realizadas</li>
              <li>Mejorar la calidad del servicio</li>
            </ul>

            <p className="mb-4">
              Sus datos serán tratados de acuerdo con los principios de legalidad, finalidad, 
              libertad, veracidad, transparencia, acceso y circulación restringida, seguridad 
              y confidencialidad establecidos en la ley.
            </p>

            <p>
              Como titular de los datos, usted tiene derecho a conocer, actualizar, rectificar 
              y solicitar la supresión de sus datos personales según lo establecido en la 
              Ley 1581 de 2012.
            </p>
          </div>

          <div className="flex justify-end gap-4">
            <button
              onClick={() => window.location.href = 'https://www.ramajudicial.gov.co'}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Ir a Rama Judicial
            </button>
            <button
              onClick={() => {
                setAccepted(true);
                setShowLegalModal(false);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Aceptar y Continuar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex-shrink-0 bg-white p-2 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <img 
                alt="Logo Consejo Superior de la Judicatura"
                className="h-16 w-auto object-contain"
                src="/logo.png"
                style={{
                  maxWidth: '300px',
                  height: 'auto'
                }}
              />
            </div>
            <div className="flex-grow text-center mx-4">
              <h1 className="text-xl font-bold mb-1">
                Asistente Virtual Judicial
              </h1>
              <p className="text-sm opacity-90">
                Juzgado 01 Civil del Circuito Especializado en Restitución de Tierras
              </p>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={toggleView}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-blue-900 rounded-lg hover:bg-yellow-400 transition-colors font-medium"
              >
                {showCalendar ? <MessageCircle size={20} /> : <Calendar size={20} />}
                <span>{showCalendar ? 'CHAT' : 'EVENTOS'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {showCalendar ? (
        <div className="flex-1 overflow-hidden">
          <EventsPage />
        </div>
      ) : (
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 md:px-6 lg:px-8">
          <div className="flex-1 flex flex-col bg-white shadow-lg my-4 rounded-lg overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {message.role === 'bot' && (
                      <div className="flex-shrink-0 mr-3">
                        <Bot size={24} className="text-blue-600" />
                      </div>
                    )}
                    <div
                      className={`max-w-[90%] md:max-w-[80%] p-3 md:p-4 rounded-lg shadow ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-800 rounded-bl-none'
                      }`}
                    >
                      {typeof message.content === 'string' ? (
                        <div 
                          className="prose prose-sm max-w-none break-words"
                          dangerouslySetInnerHTML={{ 
                            __html: message.content
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
                          }}
                        />
                      ) : (
                        <ChatMessage message={message} />
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="flex-shrink-0 ml-3">
                        <User size={24} className="text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {queryStage === QueryStage.ChoosingQueryType && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border-t bg-gray-50">
                <button
                  onClick={() => handleQueryTypeSelection('radicado')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FileText size={20} />
                  Consultar por Radicado
                </button>
                <button
                  onClick={() => handleQueryTypeSelection('folio')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Search size={20} />
                  Consultar por Folio
                </button>
                <button
                  onClick={handleContactSupport}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors md:col-span-2"
                >
                  <MessageSquare size={20} />
                  Chatear con un Servidor Judicial
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors md:col-span-2"
                >
                  <LogOut size={20} />
                  Terminar Chat
                </button>
              </div>
            )}

            {queryStage !== QueryStage.ChoosingQueryType && (
              <div className="p-4 border-t bg-gray-50">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={getPlaceholderText()}
                    className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !input.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send size={20} />
                    <span className="hidden md:inline">Enviar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;