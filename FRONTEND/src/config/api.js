// API configuration for connecting to backend
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const api = {
  // Base fetch wrapper
  async fetch(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  },

  // GET request
  get(endpoint) {
    return this.fetch(endpoint, { method: "GET" });
  },

  // POST request
  post(endpoint, data) {
    return this.fetch(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // PUT request
  put(endpoint, data) {
    return this.fetch(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // DELETE request
  delete(endpoint) {
    return this.fetch(endpoint, { method: "DELETE" });
  },
};

export default api;
