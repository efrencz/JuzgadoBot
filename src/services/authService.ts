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
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al iniciar sesión');
    }

    const data = await response.json();
    this.setToken(data.token);
    return data;
  }

  static async verifyToken(): Promise<boolean> {
    try {
      const token = this.getToken();
      if (!token) return false;

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/verify-token`, {
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
    const token = this.getToken();
    if (!token) throw new Error('No hay token de autenticación');

    const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.logout();
        throw new Error('Sesión expirada');
      }
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener estadísticas');
    }

    return response.json();
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
