import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ServerStatusProps {
  onSendMessage: (message: string) => void;
}

export const ServerStatus: React.FC<ServerStatusProps> = ({ 
  onSendMessage 
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Simulate server connection or use actual connection logic
    setIsConnected(true);
  }, []);

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    /*<div className="bg-white border-t p-2 sm:p-4 flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
      <div className="flex-grow w-full sm:w-auto flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
        <div className="w-full sm:flex-grow flex items-center space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
            placeholder="Escribe tu mensaje..."
            className="flex-grow border rounded-lg px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-base"
          />
          
          <button 
            onClick={handleSendMessage}
            className="bg-green-500 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>*/
      
      <div className="text-xs sm:text-sm mt-1 sm:mt-0">
        Estado del servidor: 
        <span className={`ml-1 sm:ml-2 ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
          {isConnected ? 'Conectado' : 'Desconectado'}
        </span>
      </div>
    
  );
};