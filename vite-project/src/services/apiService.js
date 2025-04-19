// API Service Implementation
const API_URL = 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseUrl = API_URL;
  }

  // Helper method to get auth headers
  getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  // Generic request method
  async request(endpoint, method = 'GET', data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: this.getHeaders(),
      credentials: 'include'
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      // For development, simulate API responses
      if (endpoint.includes('/chat/contacts')) {
        return await this.mockGetContacts();
      }
      
      if (endpoint.includes('/chat/messages')) {
        const contactId = endpoint.split('/').pop();
        return await this.mockGetMessages(contactId);
      }
      
      console.log(`Making API request to ${url}`);
      return { status: 'success', message: 'API request simulated' };
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Mock API methods
 

 

  // Chat related methods
  async getContacts() {
    return this.request('/chat/contacts');
  }

  async getMessages(contactId) {
    return this.request(`/chat/messages/${contactId}`);
  }

  async sendMessage(contactId, content, attachment = null) {
    const data = { contactId, content, attachment };
    return this.request('/chat/messages', 'POST', data);
  }

  async markMessagesAsRead(contactId) {
    return this.request(`/chat/messages/${contactId}/read`, 'POST');
  }

  async uploadAttachment(file) {
    console.log('Simulating file upload for', file.name);
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      id: `file-${Date.now()}`,
      url: 'https://example.com/mock-file-url',
      name: file.name
    };
  }
}

// Create a singleton instance
const apiService = new ApiService();
export default apiService;
