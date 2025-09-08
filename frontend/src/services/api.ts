const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Authentication
  async login(username: string, password: string) {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/api/auth/token`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    const data = await response.json();
    this.setToken(data.access_token);
    return data;
  }

  async checkSetup() {
    return this.request<{ needs_setup: boolean }>('/api/auth/check-setup');
  }

  async createInitialAdmin(userData: {
    username: string;
    email: string;
    password: string;
    role: string;
  }) {
    return this.request('/api/auth/setup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser() {
    return this.request('/api/auth/me');
  }

  // System Status
  async getSystemStatus() {
    return this.request('/api/system/status');
  }

  async getSystemInfo() {
    return this.request('/api/system/info');
  }

  // Alerts
  async getAlerts(params?: {
    skip?: number;
    limit?: number;
    alert_type?: string;
    severity?: string;
    status?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    return this.request(`/api/alerts/${query ? `?${query}` : ''}`);
  }

  async createAlert(alertData: {
    type: string;
    severity: string;
    title: string;
    description: string;
    source?: string;
  }) {
    return this.request('/api/alerts/', {
      method: 'POST',
      body: JSON.stringify(alertData),
    });
  }

  async acknowledgeAlert(alertId: string) {
    return this.request(`/api/alerts/${alertId}/acknowledge`, {
      method: 'POST',
    });
  }

  async resolveAlert(alertId: string) {
    return this.request(`/api/alerts/${alertId}/resolve`, {
      method: 'POST',
    });
  }

  // Protected Files
  async getProtectedFiles(params?: {
    skip?: number;
    limit?: number;
    status?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    return this.request(`/api/files/protected${query ? `?${query}` : ''}`);
  }

  async addProtectedFile(fileData: {
    path: string;
    file_type?: string;
    alert_on_read?: boolean;
    alert_on_write?: boolean;
    alert_on_delete?: boolean;
    auto_lock?: boolean;
  }) {
    return this.request('/api/files/protected', {
      method: 'POST',
      body: JSON.stringify(fileData),
    });
  }

  async updateProtectedFile(fileId: string, updates: {
    status?: string;
    lock_reason?: string;
    alert_on_read?: boolean;
    alert_on_write?: boolean;
    alert_on_delete?: boolean;
    auto_lock?: boolean;
  }) {
    return this.request(`/api/files/protected/${fileId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async removeProtectedFile(fileId: string) {
    return this.request(`/api/files/protected/${fileId}`, {
      method: 'DELETE',
    });
  }

  async lockFile(fileId: string, reason: string) {
    return this.request(`/api/files/protected/${fileId}/lock`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async unlockFile(fileId: string) {
    return this.request(`/api/files/protected/${fileId}/unlock`, {
      method: 'POST',
    });
  }

  // Network Rules
  async getNetworkRules(params?: {
    skip?: number;
    limit?: number;
    is_active?: boolean;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    return this.request(`/api/network/rules${query ? `?${query}` : ''}`);
  }

  async createNetworkRule(ruleData: {
    protocol: string;
    port?: string;
    action: string;
    source?: string;
    description: string;
  }) {
    return this.request('/api/network/rules', {
      method: 'POST',
      body: JSON.stringify(ruleData),
    });
  }

  async updateNetworkRule(ruleId: string, updates: {
    action?: string;
    is_active?: boolean;
    description?: string;
  }) {
    return this.request(`/api/network/rules/${ruleId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteNetworkRule(ruleId: string) {
    return this.request(`/api/network/rules/${ruleId}`, {
      method: 'DELETE',
    });
  }

  async getQuarantinedPackets(params?: {
    skip?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    return this.request(`/api/network/quarantined${query ? `?${query}` : ''}`);
  }

  async releaseQuarantinedPacket(packetId: string) {
    return this.request(`/api/network/quarantined/${packetId}/release`, {
      method: 'POST',
    });
  }

  async deleteQuarantinedPacket(packetId: string) {
    return this.request(`/api/network/quarantined/${packetId}`, {
      method: 'DELETE',
    });
  }

  // Logs
  async getLogs(params?: {
    skip?: number;
    limit?: number;
    level?: string;
    category?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    return this.request(`/api/logs/${query ? `?${query}` : ''}`);
  }

  async createLog(logData: {
    level: string;
    category: string;
    message: string;
    details?: string;
  }) {
    return this.request('/api/logs/', {
      method: 'POST',
      body: JSON.stringify(logData),
    });
  }

  async addLogComment(logId: string, comment: string) {
    return this.request(`/api/logs/${logId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  }

  // Users (Admin only)
  async getUsers(params?: {
    skip?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    return this.request(`/api/users/${query ? `?${query}` : ''}`);
  }

  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    role: string;
  }) {
    return this.request('/api/users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUserRole(userId: string, role: string) {
    return this.request(`/api/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async toggleUserStatus(userId: string) {
    return this.request(`/api/users/${userId}/status`, {
      method: 'PATCH',
    });
  }
}

export const apiService = new ApiService();