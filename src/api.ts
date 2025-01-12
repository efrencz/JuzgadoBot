import axios from 'axios';
import { API_CONFIG } from './config/constants';
import AuthService from './services/authService';

export interface QueryRequest {
  query: string;
  option: string;
  userName: string;
  userPhone: string;
}

export interface QueryResponse {
  error?: string;
  [key: string]: any;
}

// Crear instancia de axios con la configuración base
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

const getAuthHeaders = () => {
  const token = AuthService.getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export const sendQuery = async (data: QueryRequest): Promise<QueryResponse> => {
  try {
    console.log('Enviando consulta:', data);
    const response = await api.post('/auth/query', data);
    console.log('Respuesta recibida:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error en la consulta:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || error.message);
    }
    throw error;
  }
};

export const testConnection = async (): Promise<boolean> => {
  try {
    console.log('Probando conexión con el servidor...');
    const response = await api.get('/test');
    console.log('Respuesta del servidor:', response.data);
    return response.data.status === 'ok';
  } catch (error) {
    console.error('Error al probar la conexión:', error);
    return false;
  }
};

export const changeAdminPassword = async (currentPassword: string, newPassword: string) => {
  try {
    console.log('Sending password change request');
    const response = await axios.post(
      `${API_CONFIG.BASE_URL}/auth/change-password`,
      { currentPassword, newPassword },
      { headers: getAuthHeaders() }
    );
    console.log('Password change response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};
