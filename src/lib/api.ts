/**
 * API client for Django backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Token ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.detail || data.error || 'Erro na requisição',
        };
      }

      return { data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Erro de conexão',
      };
    }
  }

  // Authentication methods
  async googleAuth(googleToken: string, userData: any) {
    return this.request('/api/auth/google/', {
      method: 'POST',
      body: JSON.stringify({
        google_token: googleToken,
        email: userData.email,
        first_name: userData.given_name,
        last_name: userData.family_name,
        profile_picture: userData.picture,
      }),
    });
  }

  async login(email: string, password: string) {
    return this.request('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    const result = await this.request('/api/auth/logout/', {
      method: 'POST',
    });
    this.clearToken();
    return result;
  }

  async getCurrentUser() {
    return this.request('/api/auth/me/');
  }

  // Checklist methods
  async getChecklists() {
    return this.request('/api/checklists/');
  }

  async deleteChecklist(id: string) {
    return this.request(`/api/checklists/${id}/`, {
      method: 'DELETE',
    });
  }

  async createChecklist(checklistData: any) {
    return this.request('/api/checklists/', {
      method: 'POST',
      body: JSON.stringify(checklistData),
    });
  }

  async getChecklist(id: string) {
    return this.request(`/api/checklists/${id}/`);
  }

  async retryChecklistUpload(id: string) {
    return this.request(`/api/checklists/${id}/retry/`, {
      method: 'POST',
    });
  }

  async getChecklistStatus(id: string) {
    return this.request(`/api/checklists/${id}/status/`);
  }

  // Checklist templates
  async getChecklistTemplates() {
    return this.request('/api/checklists/templates/');
  }

  async createChecklistTemplate(templateData: any) {
    return this.request('/api/checklists/templates/', {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
  }

  async updateChecklistTemplate(id: number, templateData: any) {
    return this.request(`/api/checklists/templates/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(templateData),
    });
  }

  async deleteChecklistTemplate(id: number) {
    return this.request(`/api/checklists/templates/${id}/`, {
      method: 'DELETE',
    });
  }

  // Vehicle methods
  async getVehicles() {
    return this.request('/api/vehicles/');
  }

  async createVehicle(vehicleData: any) {
    return this.request('/api/vehicles/', {
      method: 'POST',
      body: JSON.stringify(vehicleData),
    });
  }

  async getVehicle(id: number) {
    return this.request(`/api/vehicles/${id}/`);
  }

  async updateVehicle(id: number, vehicleData: any) {
    return this.request(`/api/vehicles/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(vehicleData),
    });
  }

  async deleteVehicle(id: number) {
    return this.request(`/api/vehicles/${id}/`, {
      method: 'DELETE',
    });
  }

  // User methods
  async getUserProfile() {
    return this.request('/api/users/profile/');
  }

  async updateUserProfile(profileData: any) {
    return this.request('/api/users/profile/', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
