import api from '../api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'accountant' | 'student' | 'parent';
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export const authService = {
  // Login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);

    // Store token in localStorage
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }

    return response.data;
  },

  // Register
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);

    // Store token in localStorage
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }

    return response.data;
  },

  // Get current user
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  },
};
