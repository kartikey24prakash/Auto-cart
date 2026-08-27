import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
});

let currentRole = null;
let currentKey = null;
let currentToken = null;

export function setApiCredentials(role, key, token) {
  currentRole = role;
  currentKey = key;
  currentToken = token;
}

apiClient.interceptors.request.use((config) => {
  // If we have a JWT, use it for dashboard and auth routes
  if (currentToken) {
    config.headers['Authorization'] = `Bearer ${currentToken}`;
  }
  
  // Attach API keys for engine/SDK specific tests or interactions if needed
  if (currentKey) {
    if (currentRole === 'merchant') {
      config.headers['x-merchant-key'] = currentKey;
    } else if (currentRole === 'buyer') {
      config.headers['x-buyer-key'] = currentKey;
    }
  }
  return config;
});

export default apiClient;
