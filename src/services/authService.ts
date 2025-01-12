import { API_CONFIG } from '../config/constants';

interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
  };
}

class AuthService {
  private static TOKEN_KEY = 'adminToken';

  static async login(username: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error('Error en la autenticación');
    }

    const data = await response.json();
    localStorage.setItem(this.TOKEN_KEY, data.token);
    return data;
  }

  static async verifyToken(): Promise<boolean> {
    try {
      const token = this.getToken();
      if (!token) return false;

      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/verify-token`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  static async getStats() {
    try {
      const token = this.getToken();
      if (!token) throw new Error('No hay token de autenticación');

      console.log('Fetching stats from:', `${API_CONFIG.BASE_URL}/chat-history/admin/chat-history`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/chat-history/admin/chat-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText
        });

        if (response.status === 401) {
          this.logout();
          throw new Error('Sesión expirada');
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al obtener estadísticas');
      }

      const data = await response.json();
      console.log('Stats data received:', data);
      return data;
    } catch (error) {
      console.error('Error in getStats:', error);
      throw error;
    }
  }

  static async getChatHistory(phone: string) {
    const token = this.getToken();
    if (!token) throw new Error('No hay token de autenticación');

    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/chat-history/${phone}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.logout();
        throw new Error('Sesión expirada');
      }
      if (response.status === 404) {
        throw new Error('No se encontró historial para este número');
      }
      throw new Error('Error al obtener historial');
    }

    const data = await response.json();
    return data;
  }

  static setToken(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static logout() {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export default AuthService;
