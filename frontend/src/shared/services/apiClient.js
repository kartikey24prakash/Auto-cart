import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:5000',
});

let currentRole = null;
let currentKey = null;

export function setApiCredentials(role, key) {
  currentRole = role;
  currentKey = key;
}

apiClient.interceptors.request.use((config) => {
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
