const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'accountant' | 'student' | 'parent';
}

interface AuthResponse {
  _id: string;
  name: string;
  email: string;
  role: string;
  token: string;
}

// Auth Service
export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to login');
    }

    const result = await response.json();

    // Store the JWT token
    if (result.token) {
      localStorage.setItem('auth_token', result.token);
    }

    return result;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to register');
    }

    const result = await response.json();

    // Store the JWT token
    if (result.token) {
      localStorage.setItem('auth_token', result.token);
    }

    return result;
  },

  async getMe(): Promise<any> {
    const token = localStorage.getItem('auth_token');

    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user data');
    }

    return await response.json();
  },

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('firebase_token');
  }
};

// Student Service
export const studentService = {
  async getStudents(params?: { q?: string; page?: number; limit?: number }): Promise<any> {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('firebase_token');

    const queryParams = new URLSearchParams();
    if (params?.q) queryParams.append('q', params.q);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(`${API_URL}/api/students?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch students');
    }

    return await response.json();
  },

  async getStudentById(id: string): Promise<any> {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('firebase_token');

    const response = await fetch(`${API_URL}/api/students/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch student');
    }

    return await response.json();
  },

  async createStudent(data: any): Promise<any> {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('firebase_token');

    const response = await fetch(`${API_URL}/api/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create student');
    }

    return await response.json();
  },

  async updateStudent(id: string, data: any): Promise<any> {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('firebase_token');

    const response = await fetch(`${API_URL}/api/students/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update student');
    }

    return await response.json();
  },

  async deleteStudent(id: string): Promise<any> {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('firebase_token');

    const response = await fetch(`${API_URL}/api/students/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete student');
    }

    return await response.json();
  }
};

// Settings Service
export const settingsService = {
  async getSettings(): Promise<any> {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('firebase_token');

    const response = await fetch(`${API_URL}/api/settings`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch settings');
    }

    return await response.json();
  },

  async updateSettings(data: any): Promise<any> {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('firebase_token');

    const response = await fetch(`${API_URL}/api/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update settings');
    }

    return await response.json();
  }
};
