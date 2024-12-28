import { API_CONFIG } from '../config/constants';
import { APIError, handleAPIError } from '../utils/errorHandling';

export let currentChatQueries: string[] = [];

const fetchWithTimeout = async (
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> => {
  const { timeout = API_CONFIG.TIMEOUT } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    console.log(`Fetching URL: ${url}`);
    const fetchOptions = {
      ...options,
      mode: 'cors',
      signal: controller.signal,
    };
    console.log('Fetch options:', JSON.stringify(fetchOptions, (key, value) => {
      if (key === 'signal') return '[AbortSignal]';
      return value;
    }, 2));

    const response = await fetch(url, fetchOptions);

    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    console.error('Fetch error details:', {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack
    });
    throw error;
  }
};

export const sendQuery = async (query: string, option: string, userId: string, phoneNumber: string): Promise<any> => {
  try {
    console.log('sendQuery called with:', JSON.stringify({
      query,
      option,
      userId,
      phoneNumber
    }, null, 2));
    
    // Guardar la consulta del usuario
    if (userId && phoneNumber) {
      currentChatQueries.push(query);
      console.log('Current chat queries:', JSON.stringify(currentChatQueries, null, 2));
    } else {
      console.log('No user/phone provided, not saving query');
    }

    const response = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/api/auth/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        query, 
        option,
        userName: userId,    
        userPhone: phoneNumber  
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new APIError(
        error.message || 'Error al enviar la consulta',
        response.status,
        error.error
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Send query error:', error);
    throw handleAPIError(error);
  }
};

export const resetChat = () => {
  currentChatQueries = [];
};

export const endChat = async (userId: string, phoneNumber: string): Promise<void> => {
  try {
    console.log('endChat called with:', JSON.stringify({
      userId,
      phoneNumber,
      queries: currentChatQueries
    }, null, 2));

    if (currentChatQueries.length > 0) {
      console.log('Saving chat history for user:', userId);
      const response = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/api/auth/chat-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          phoneNumber,
          query: currentChatQueries[currentChatQueries.length - 1],
          chatDate: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save chat history');
      }

      console.log('Chat history saved successfully');
      currentChatQueries = []; // Limpiar las consultas después de guardar
    }
  } catch (error) {
    console.error('Error saving chat history:', error);
    throw error;
  }
};

export const getEvents = async () => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/events`);
    if (!response.ok) {
      throw new Error('Error al obtener eventos');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};