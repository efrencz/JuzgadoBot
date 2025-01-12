import axios from 'axios';
import { API_CONFIG } from '../config/constants';
import { APIError, handleAPIError } from '../utils/errorHandling';

export let currentChatQueries: string[] = [];
let currentSessionId: string | null = null;

const generateSessionId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const getOrCreateSessionId = () => {
  if (!currentSessionId) {
    currentSessionId = generateSessionId();
  }
  return currentSessionId;
};

// Configurar axios
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Función para probar la conexión
export const testConnection = async () => {
  try {
    console.log('Probando conexión con el servidor...');
    const response = await api.get('/test');
    console.log('Respuesta del servidor:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error al probar la conexión:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || error.message);
    }
    throw error;
  }
};

export const sendQuery = async (query: string, option: string, userId: string, phoneNumber: string): Promise<any> => {
  try {
    console.log('sendQuery called with:', {
      query,
      option,
      userId,
      phoneNumber
    });
    
    currentChatQueries.push(query);
    console.log('Current chat queries:', currentChatQueries);

    const sessionId = getOrCreateSessionId();
    const response = await api.post('/chat/query', {
      query,
      option,
      userName: userId,
      userPhone: phoneNumber,
      sessionId
    });

    return response.data;
  } catch (error) {
    console.error('Send query error:', error);
    if (axios.isAxiosError(error)) {
      throw handleAPIError(new Error(error.response?.data?.error || error.message));
    }
    throw handleAPIError(error);
  }
};

export const resetChat = () => {
  currentChatQueries = [];
  currentSessionId = null;
};

export const endChat = async (userId: string, phoneNumber: string): Promise<void> => {
  try {
    if (currentChatQueries.length === 0) {
      console.log('No hay consultas para guardar');
      return;
    }

    const sessionId = currentSessionId;
    const response = await api.post('/chat/end', {
      userName: userId,
      userPhone: phoneNumber,
      sessionId,
      queries: currentChatQueries,
      responses: [] // Aquí deberías incluir las respuestas del chat
    });

    console.log('Chat ended:', response.data);
    currentSessionId = null;
    currentChatQueries = [];
  } catch (error) {
    console.error('Error ending chat:', error);
    if (axios.isAxiosError(error)) {
      throw handleAPIError(new Error(error.response?.data?.error || error.message));
    }
    throw handleAPIError(error);
  }
};

export const getEvents = async () => {
  try {
    const response = await api.get('/events');
    console.log('Eventos recibidos del servidor:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching events:', error);
    if (axios.isAxiosError(error)) {
      throw handleAPIError(new Error(error.response?.data?.error || error.message));
    }
    throw handleAPIError(error);
  }
};