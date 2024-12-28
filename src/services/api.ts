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
      mode: 'cors' as RequestMode,
      signal: controller.signal,
      credentials: 'include' as RequestCredentials,
    };
    console.log('Fetch options:', JSON.stringify(fetchOptions, (key, value) => {
      if (key === 'signal') return '[AbortSignal]';
      return value;
    }, 2));

    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    console.error('Fetch error details:', error);
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
    
    currentChatQueries.push(query);
    console.log('Current chat queries:', JSON.stringify(currentChatQueries, null, 2));

    const response = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/auth/query`, {
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
      })
    });

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
    const response = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/auth/end-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userName: userId,
        userPhone: phoneNumber
      })
    });

    if (!response.ok) {
      throw new Error('Failed to end chat');
    }

    resetChat();
  } catch (error) {
    console.error('End chat error:', error);
    throw handleAPIError(error);
  }
};

export const getEvents = async () => {
  try {
    const response = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/events`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    return await response.json();
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};