import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface Props {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<Props> = ({ onSendMessage, disabled }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Escribe tu consulta aquí..."
        disabled={disabled}
        className={`flex-1 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : ''
        }`}
      />
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className={`p-3 bg-blue-500 text-white rounded-lg transition-colors ${
          disabled || !input.trim()
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-blue-600'
        }`}
      >
        <Send className="w-5 h-5" />
      </button>
    </form>
  );
};