import api from '../api';
import { Student } from '@/types';

export interface GetStudentsParams {
  q?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface GetStudentsResponse {
  data: Student[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export const studentsService = {
  // Get all students with optional search and pagination
  getStudents: async (params?: GetStudentsParams): Promise<GetStudentsResponse> => {
    const response = await api.get('/students', { params });
    return response.data;
  },

  // Get single student by ID
  getStudentById: async (id: string): Promise<Student> => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },

  // Create new student
  createStudent: async (studentData: Omit<Student, 'id' | 'created_at' | 'updated_at'>): Promise<Student> => {
    const response = await api.post('/students', studentData);
    return response.data;
  },

  // Update student
  updateStudent: async (id: string, studentData: Partial<Student>): Promise<Student> => {
    const response = await api.put(`/students/${id}`, studentData);
    return response.data;
  },

  // Delete student
  deleteStudent: async (id: string): Promise<void> => {
    await api.delete(`/students/${id}`);
  },
};
